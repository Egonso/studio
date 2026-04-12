import { z } from 'zod';

export const safeIdentifierSchema = z
  .string()
  .trim()
  .min(1, 'Kennung ist erforderlich.')
  .max(128, 'Kennung ist zu lang.')
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/, 'Kennung ist ungültig.');
