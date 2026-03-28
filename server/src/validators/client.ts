import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  currency: z.enum(['MAD', 'USD', 'EUR', 'GBP']).default('USD'),
  notes: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
