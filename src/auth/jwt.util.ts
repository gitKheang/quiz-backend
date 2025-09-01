import * as jwt from 'jsonwebtoken';

const JWT_SECRET: jwt.Secret = (process.env.JWT_SECRET ?? 'dev_secret_change_me') as jwt.Secret;

export type JwtPayload = { sub: string; email: string; name: string; role?: string };

export function signToken(
  payload: JwtPayload,
  expiresIn: jwt.SignOptions['expiresIn'] = '7d',
) {
  const options: jwt.SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken<T = JwtPayload>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}
