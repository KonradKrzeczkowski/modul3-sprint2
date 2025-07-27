
import { IncomingMessage, ServerResponse } from 'http';

interface User {
  id: string;
  name: string;
}

const mockDatabase: Record<string, User> = {
  '123': { id: '123', name: 'Alice' },
};

export function generateToken(userId: string): string {
  return `token-${userId}`;
}

export function getUserFromToken(token: string): User | null {
  const userId = token.replace('token-', '');
  return mockDatabase[userId] || null;
}

export function setAuthCookie(res: ServerResponse, token: string) {
  res.setHeader('Set-Cookie', `auth=${token}; HttpOnly; Path=/`);
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  const cookies: Record<string, string> = {};

  if (!header) return cookies;

  const pairs = header.split(';');
  for (const pair of pairs) {
    const [key, value] = pair.trim().split('=');
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}