import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    HEURIST_API_KEY: z.string().min(1).regex(/[-#]/),
    PINATA_JWT: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_GATEWAY_URL: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    HEURIST_API_KEY: process.env.HEURIST_API_KEY,
    PINATA_JWT: process.env.PINATA_JWT,
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  },
});
