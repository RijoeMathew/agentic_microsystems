type AuthenticatedUser = {
  email: string;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Authentication request failed.');
  }

  return payload as T;
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

  return request<AuthenticatedUser>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: normalizedEmail, password }),
  });
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail) || !validatePassword(password)) {
    throw new Error('Incorrect email or password.');
  }

  return request<AuthenticatedUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: normalizedEmail, password }),
  });
}

export async function getAuthenticatedSession() {
  return request<AuthenticatedUser>('/api/auth/session');
}

export async function clearAuthenticatedSession() {
  await request<Record<string, never>>('/api/auth/logout', {
    method: 'POST',
  });
}
