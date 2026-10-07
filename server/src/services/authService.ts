import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../errors/AppError';
import { userRepository } from '../repositories/userRepository';
import type { RegisterInput, LoginInput } from '../validators/authSchemas';

const BCRYPT_ROUNDS = 12;

/** Safe user shape returned to callers — never includes passwordHash. */
export interface SafeUser {
  id: string;
  username: string;
  email: string;
}

export interface JwtPayload {
  userId: string;
}

function toSafeUser(user: { _id: unknown; username: string; email: string }): SafeUser {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<SafeUser> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check for duplicates before attempting the insert so we can return
    // a friendly error rather than a raw Mongoose duplicate-key error.
    const [existingEmail, existingUsername] = await Promise.all([
      userRepository.findByEmail(normalizedEmail),
      userRepository.findByUsername(input.username),
    ]);

    if (existingEmail) {
      throw new AppError(409, 'CONFLICT', 'An account with that email already exists.');
    }
    if (existingUsername) {
      throw new AppError(409, 'CONFLICT', 'That username is already taken.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      username: input.username,
      email: normalizedEmail,
      passwordHash,
    });

    return toSafeUser(user);
  },

  async login(input: LoginInput): Promise<SafeUser> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      // Run a dummy hash to match timing of a real bcrypt comparison, preventing
      // timing attacks that could reveal whether an email exists.
      await bcrypt.hash('dummy', BCRYPT_ROUNDS);
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid email or password.');
    }

    return toSafeUser(user);
  },

  createToken(userId: string): string {
    return jwt.sign({ userId } as JwtPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  },

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid or expired token.');
    }
  },

  async getMe(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'User not found.');
    }
    return toSafeUser(user);
  },
};
