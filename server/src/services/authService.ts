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
  /**
   * Registers a new user.
   * Hashes the password before storing.
   * Throws 409 CONFLICT on duplicate username or email.
   */
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

  /**
   * Verifies email + password and returns the safe user on success.
   * Always throws 401 on failure — no distinction between wrong email or password.
   */
  async login(input: LoginInput): Promise<SafeUser> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      // Use the same timing path as a real user to avoid timing attacks
      await bcrypt.hash('dummy', BCRYPT_ROUNDS);
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid email or password.');
    }

    return toSafeUser(user);
  },

  /** Creates a signed JWT containing only the user ID. */
  createToken(userId: string): string {
    return jwt.sign({ userId } as JwtPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  },

  /** Verifies a JWT and returns the payload, or throws 401 on failure. */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid or expired token.');
    }
  },

  /** Returns the safe user profile for the given userId. */
  async getMe(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'User not found.');
    }
    return toSafeUser(user);
  },
};
