import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { MongoClient, ObjectId } from 'mongodb';

const scrypt = promisify(scryptCallback);
const port = Number(process.env.PORT ?? 8787);
const mongoUri =
  process.env.MONGODB_URI ??
  'mongodb+srv://agent_db_user:XWNGJ4JDnJMwIg1E@agenticmicrosystemsdb.eu7pmtb.mongodb.net/?appName=AgenticMicrosystemsDB';
const databaseName = 'agentic_microsystems';
const allowedOrigins = new Set(
  (process.env.CLIENT_ORIGINS ?? process.env.CLIENT_ORIGIN ?? 'http://127.0.0.1:5173,http://127.0.0.1:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const cookieDomain = process.env.COOKIE_DOMAIN;
const secureCookies = process.env.NODE_ENV === 'production';
const sessionDurationMs = 1000 * 60 * 60 * 24 * 7;
const sessionCookieName = 'am_session';
const passwordHashBytes = 64;
const passwordOptions = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

const mongoClient = new MongoClient(mongoUri);
let users;
let sessions;
let meshDesigns;
let databaseReadyPromise;

function ensureDatabase() {
  if (!databaseReadyPromise) {
    databaseReadyPromise = mongoClient.connect().then(async () => {
      const database = mongoClient.db(databaseName);
      users = database.collection('users');
      sessions = database.collection('sessions');
      meshDesigns = database.collection('mesh_designs');

      await users.createIndex({ email: 1 }, { unique: true });
      await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await sessions.createIndex({ tokenHash: 1 }, { unique: true });
      await meshDesigns.createIndex({ userId: 1, normalizedName: 1 }, { unique: true });
    });
  }

  return databaseReadyPromise;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 12;
}

function normalizeDesignName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

function validateDesignName(name) {
  return typeof name === 'string' && normalizeDesignName(name).length > 0 && normalizeDesignName(name).length <= 80;
}

function validateDesignPayload(design) {
  if (!design || typeof design !== 'object' || Array.isArray(design)) {
    return false;
  }

  const { positions, connectionIds } = design;

  if (!positions || typeof positions !== 'object' || Array.isArray(positions) || !Array.isArray(connectionIds)) {
    return false;
  }

  const validPositions = Object.values(positions).every(
    (position) =>
      position &&
      typeof position === 'object' &&
      Number.isFinite(position.x) &&
      Number.isFinite(position.y) &&
      position.x >= 0 &&
      position.x <= 100 &&
      position.y >= 0 &&
      position.y <= 100,
  );
  const validConnections = connectionIds.every(
    (connectionId) => typeof connectionId === 'string' && /^[a-z0-9-]+__[a-z0-9-]+$/i.test(connectionId),
  );

  return validPositions && validConnections;
}

function json(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function corsHeaders(origin) {
  if (!origin || !allowedOrigins.has(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function parseCookies(request) {
  return Object.fromEntries(
    (request.headers.cookie ?? '')
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf('=');

        if (separatorIndex === -1) {
          return [cookie, ''];
        }

        return [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))];
      }),
  );
}

function buildSessionCookie(token, maxAgeSeconds) {
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    secureCookies ? 'SameSite=None' : 'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (secureCookies) {
    parts.push('Secure');
  }

  if (cookieDomain) {
    parts.push(`Domain=${cookieDomain}`);
  }

  return parts.join('; ');
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password, salt) {
  const derivedKey = await scrypt(password, salt, passwordHashBytes, passwordOptions);

  return Buffer.from(derivedKey).toString('base64');
}

async function passwordMatches(password, user) {
  const candidateHash = Buffer.from(await hashPassword(password, user.passwordSalt), 'base64');
  const storedHash = Buffer.from(user.passwordHash, 'base64');

  return candidateHash.length === storedHash.length && timingSafeEqual(candidateHash, storedHash);
}

async function createSession(userId) {
  await ensureDatabase();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await sessions.insertOne({
    userId,
    tokenHash: hashSessionToken(token),
    createdAt: new Date(),
    expiresAt,
  });

  return token;
}

async function getSessionUser(request) {
  await ensureDatabase();
  const token = parseCookies(request)[sessionCookieName];

  if (!token) {
    return null;
  }

  const session = await sessions.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  return users.findOne(
    { _id: session.userId },
    {
      projection: {
        email: 1,
      },
    },
  );
}

async function readJsonBody(request) {
  let body = '';

  for await (const chunk of request) {
    body += chunk;

    if (body.length > 10_000) {
      throw new Error('Request body too large.');
    }
  }

  return body ? JSON.parse(body) : {};
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  const responseCorsHeaders = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      ...responseCorsHeaders,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    });
    response.end();
    return;
  }

  try {
    if (request.method === 'GET' && request.url === '/api/health') {
      json(response, 200, { ok: true }, responseCorsHeaders);
      return;
    }

    if (request.method === 'POST' && request.url === '/api/auth/register') {
      await ensureDatabase();
      const { email = '', password = '' } = await readJsonBody(request);
      const normalizedEmail = normalizeEmail(email);

      if (!validateEmail(normalizedEmail)) {
        json(response, 400, { error: 'Enter a valid email address.' }, responseCorsHeaders);
        return;
      }

      if (!validatePassword(password)) {
        json(response, 400, { error: 'Use at least 12 characters for the password.' }, responseCorsHeaders);
        return;
      }

      const passwordSalt = randomBytes(16).toString('base64');
      const passwordHash = await hashPassword(password, passwordSalt);
      const insertResult = await users.insertOne({
        email: normalizedEmail,
        passwordHash,
        passwordSalt,
        createdAt: new Date(),
      });
      const token = await createSession(insertResult.insertedId);

      json(
        response,
        201,
        { email: normalizedEmail },
        {
          ...responseCorsHeaders,
          'Set-Cookie': buildSessionCookie(token, sessionDurationMs / 1000),
        },
      );
      return;
    }

    if (request.method === 'POST' && request.url === '/api/auth/login') {
      await ensureDatabase();
      const { email = '', password = '' } = await readJsonBody(request);
      const normalizedEmail = normalizeEmail(email);
      const user = await users.findOne({ email: normalizedEmail });

      if (!user || !validatePassword(password) || !(await passwordMatches(password, user))) {
        json(response, 401, { error: 'Incorrect email or password.' }, responseCorsHeaders);
        return;
      }

      const token = await createSession(user._id);

      json(
        response,
        200,
        { email: normalizedEmail },
        {
          ...responseCorsHeaders,
          'Set-Cookie': buildSessionCookie(token, sessionDurationMs / 1000),
        },
      );
      return;
    }

    if (request.method === 'GET' && request.url === '/api/auth/session') {
      const user = await getSessionUser(request);

      if (!user) {
        json(response, 401, { error: 'Not authenticated.' }, responseCorsHeaders);
        return;
      }

      json(response, 200, { email: user.email }, responseCorsHeaders);
      return;
    }

    if (request.method === 'POST' && request.url === '/api/auth/logout') {
      await ensureDatabase();
      const token = parseCookies(request)[sessionCookieName];

      if (token) {
        await sessions.deleteOne({ tokenHash: hashSessionToken(token) });
      }

      json(
        response,
        200,
        {},
        {
          ...responseCorsHeaders,
          'Set-Cookie': buildSessionCookie('', 0),
        },
      );
      return;
    }

    if (request.method === 'GET' && request.url === '/api/mesh-designs') {
      const user = await getSessionUser(request);

      if (!user) {
        json(response, 401, { error: 'Not authenticated.' }, responseCorsHeaders);
        return;
      }

      const designs = await meshDesigns
        .find(
          { userId: user._id },
          {
            projection: {
              name: 1,
              positions: 1,
              connectionIds: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        )
        .sort({ updatedAt: -1, createdAt: -1 })
        .toArray();

      json(
        response,
        200,
        {
          designs: designs.map((design) => ({
            id: design._id.toString(),
            name: design.name,
            positions: design.positions,
            connectionIds: design.connectionIds,
            createdAt: design.createdAt,
            updatedAt: design.updatedAt,
          })),
        },
        responseCorsHeaders,
      );
      return;
    }

    if (request.method === 'POST' && request.url === '/api/mesh-designs') {
      const user = await getSessionUser(request);

      if (!user) {
        json(response, 401, { error: 'Not authenticated.' }, responseCorsHeaders);
        return;
      }

      const { name = '', positions, connectionIds } = await readJsonBody(request);

      if (!validateDesignName(name)) {
        json(response, 400, { error: 'Use a design name between 1 and 80 characters.' }, responseCorsHeaders);
        return;
      }

      if (!validateDesignPayload({ positions, connectionIds })) {
        json(response, 400, { error: 'Design data is invalid.' }, responseCorsHeaders);
        return;
      }

      const normalizedName = normalizeDesignName(name);
      const now = new Date();
      const insertResult = await meshDesigns.insertOne({
        userId: user._id,
        name: normalizedName,
        normalizedName: normalizedName.toLowerCase(),
        positions,
        connectionIds,
        createdAt: now,
        updatedAt: now,
      });

      json(
        response,
        201,
        {
          design: {
            id: insertResult.insertedId.toString(),
            name: normalizedName,
            positions,
            connectionIds,
            createdAt: now,
            updatedAt: now,
          },
        },
        responseCorsHeaders,
      );
      return;
    }

    const designMatch = request.url?.match(/^\/api\/mesh-designs\/([a-f0-9]{24})$/i);

    if (request.method === 'PUT' && designMatch) {
      const user = await getSessionUser(request);

      if (!user) {
        json(response, 401, { error: 'Not authenticated.' }, responseCorsHeaders);
        return;
      }

      const { positions, connectionIds } = await readJsonBody(request);

      if (!validateDesignPayload({ positions, connectionIds })) {
        json(response, 400, { error: 'Design data is invalid.' }, responseCorsHeaders);
        return;
      }

      const updatedAt = new Date();
      const updateResult = await meshDesigns.findOneAndUpdate(
        { _id: new ObjectId(designMatch[1]), userId: user._id },
        {
          $set: {
            positions,
            connectionIds,
            updatedAt,
          },
        },
        {
          returnDocument: 'after',
          projection: {
            name: 1,
            positions: 1,
            connectionIds: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      );

      if (!updateResult) {
        json(response, 404, { error: 'Design not found.' }, responseCorsHeaders);
        return;
      }

      json(
        response,
        200,
        {
          design: {
            id: updateResult._id.toString(),
            name: updateResult.name,
            positions: updateResult.positions,
            connectionIds: updateResult.connectionIds,
            createdAt: updateResult.createdAt,
            updatedAt: updateResult.updatedAt,
          },
        },
        responseCorsHeaders,
      );
      return;
    }

    json(response, 404, { error: 'Not found.' }, responseCorsHeaders);
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateMessage = request.url?.startsWith('/api/mesh-designs')
        ? 'A design with this name already exists.'
        : 'An account with this email already exists.';

      json(response, 409, { error: duplicateMessage }, responseCorsHeaders);
      return;
    }

    console.error(error);
    json(response, 500, { error: 'Internal server error.' }, responseCorsHeaders);
  }
});

server.listen(port, () => {
  console.log(`Auth API listening on http://127.0.0.1:${port}`);
});
