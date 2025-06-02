import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // DATABASE_URL: z.string().url(),
    HEURIST_API_KEY: z.string().min(1).regex(/[-#]/),
  },
  client: {
    // TODO
  },
  runtimeEnv: {
    // DATABASE_URL: process.env.DATABASE_URL,
    HEURIST_API_KEY: process.env.HEURIST_API_KEY,
  },
});
