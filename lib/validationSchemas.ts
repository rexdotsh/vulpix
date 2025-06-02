import { z } from 'zod';

export const generateImageSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  neg_prompt: z.string().optional(),
  num_iterations: z.number().optional(),
  guidance_scale: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  seed: z.number().optional(),
});

export type GenerateImageInput = z.infer<typeof generateImageSchema>;
