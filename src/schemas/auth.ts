import { z } from 'zod';

// Same rules as the web app (brainhealth-frontend/src/schemas), phrased kindly.
export const signInSchema = z.object({
  email: z.string().min(1, 'Please enter your email').email('That email does not look quite right'),
  password: z.string().min(1, 'Please enter your password'),
});
export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Please tell us what to call you (at least 2 letters)'),
    email: z.string().min(1, 'Please enter your email').email('That email does not look quite right'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Add at least one capital letter')
      .regex(/[0-9]/, 'Add at least one number'),
    confirmPassword: z.string().min(1, 'Please repeat your password'),
    acceptTerms: z.boolean().refine((v) => v === true, 'Please confirm to continue'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'The passwords do not match yet',
    path: ['confirmPassword'],
  });
export type SignUpFormValues = z.infer<typeof signUpSchema>;
