type AuthenticatedUser = {
  email: string;
};

type AuthenticationResponse = AuthenticatedUser & {
  sessionToken?: string;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const sessionTokenStorageKey = 'agentic-microsystems-session-token';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: getAuthenticatedHeaders(init?.headers),
  });
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Authentication request failed.');
  }

  return payload as T;
}

function readStoredSessionToken() {
  try {
    return window.localStorage.getItem(sessionTokenStorageKey);
  } catch {
    return null;
  }
}

function storeSessionToken(token: string | undefined) {
  try {
    if (token) {
      window.localStorage.setItem(sessionTokenStorageKey, token);
      return;
    }

    window.localStorage.removeItem(sessionTokenStorageKey);
  } catch {
    // Storage can be unavailable in private browsing contexts. Cookie auth still works when supported.
  }
}

export function getAuthenticatedHeaders(headers?: HeadersInit) {
  const token = readStoredSessionToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function validatePassword(password: string) {
  return password.length >= 12;
}

export async function registerUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }

  if (!validatePassword(password)) {
    throw new Error('Use at least 12 characters for the password.');
  }

  const authenticatedUser = await request<AuthenticationResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  storeSessionToken(authenticatedUser.sessionToken);

  return authenticatedUser;
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail) || !validatePassword(password)) {
    throw new Error('Incorrect email or password.');
  }

  const authenticatedUser = await request<AuthenticationResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  storeSessionToken(authenticatedUser.sessionToken);

  return authenticatedUser;
}

export async function getAuthenticatedSession() {
  return request<AuthenticatedUser>('/api/auth/session');
}

export async function clearAuthenticatedSession() {
  try {
    await request<Record<string, never>>('/api/auth/logout', {
      method: 'POST',
    });
  } finally {
    storeSessionToken(undefined);
  }
}
