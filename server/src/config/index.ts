/**
 * Centralized application configuration.
 *
 * All environment variables are read here. Secrets are validated at startup
 * so the server fails fast rather than silently running without required config.
 */

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const CLIENT_URL = process.env['CLIENT_URL'] ?? 'http://localhost:5173';
const MONGODB_URI = process.env['MONGODB_URI'] ?? '';
const JWT_SECRET = process.env['JWT_SECRET'] ?? '';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '7d';

// Fail fast if required secrets are missing
if (!MONGODB_URI) {
  console.error('[Config] MONGODB_URI is required but not set.');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('[Config] JWT_SECRET is required but not set.');
  process.exit(1);
}

export const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  clientUrl: CLIENT_URL,
  mongodbUri: MONGODB_URI,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
} as const;