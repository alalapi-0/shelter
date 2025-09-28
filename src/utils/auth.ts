import { createHash } from 'crypto';
import { env } from '../config/env.js';

export const hashToken = (token: string) =>
  createHash('sha256').update(`${token}:${env.TOKEN_SECRET}`).digest('hex');
