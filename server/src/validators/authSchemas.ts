import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username must be at most 30 characters.')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username may only contain letters, numbers, underscores, and hyphens.'
    ),
  email: z
    .string()
    .email('Must be a valid email address.')
    .max(254, 'Email is too long.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password is too long.'),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Must be a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
