import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { MongoClient } from 'mongodb';

const scrypt = promisify(scryptCallback);
const port = Number(process.env.PORT ?? 8787);
const mongoUri =
  'mongodb://agent_db_user:XWNGJ4JDnJMwIg1E@ac-jqqzcns-shard-00-00.eu7pmtb.mongodb.net:27017,ac-jqqzcns-shard-00-01.eu7pmtb.mongodb.net:27017,ac-jqqzcns-shard-00-02.eu7pmtb.mongodb.net:27017/?tls=true&replicaSet=atlas-fw4r9u-shard-0&authSource=admin&retryWrites=true&w=majority&appName=AgenticMicrosystemsDB';
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
await mongoClient.connect();

const database = mongoClient.db(databaseName);
const users = database.collection('users');
const sessions = database.collection('sessions');

await users.createIndex({ email: 1 }, { unique: true });
await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
await sessions.createIndex({ tokenHash: 1 }, { unique: true });

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 12;
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
    'SameSite=Lax',
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
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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

    json(response, 404, { error: 'Not found.' }, responseCorsHeaders);
  } catch (error) {
    if (error?.code === 11000) {
      json(response, 409, { error: 'An account with this email already exists.' }, responseCorsHeaders);
      return;
    }

    console.error(error);
    json(response, 500, { error: 'Internal server error.' }, responseCorsHeaders);
  }
});

server.listen(port, () => {
  console.log(`Auth API listening on http://127.0.0.1:${port}`);
});
