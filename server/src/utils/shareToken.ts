import crypto from 'crypto';

/**
 * Generates a cryptographically secure random share token.
 * Returns 32 random bytes as a URL-safe base64url string (43 chars).
 */
export function generateShareToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hashes a share token with SHA-256 for storage.
 * The raw token is placed in the public URL; only its hash is stored in the database.
 */
export function hashShareToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
