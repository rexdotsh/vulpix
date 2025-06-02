import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    HEURIST_API_KEY: z.string().min(1).regex(/[-#]/),
    PINATA_JWT: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_GATEWAY_URL: z.string().min(1),
  },
  runtimeEnv: {
    HEURIST_API_KEY: process.env.HEURIST_API_KEY,
    PINATA_JWT: process.env.PINATA_JWT,
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  },
});
