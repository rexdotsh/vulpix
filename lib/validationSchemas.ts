import { z } from 'zod';

export const generateImageSchema = z.object({
  model: z.string().min(1, 'Model is required.'),
  prompt: z.string().min(1, 'Prompt is required.'),
  neg_prompt: z.string().optional(),
  num_iterations: z.number().min(1).max(100).optional(),
  guidance_scale: z.number().min(1).max(20).optional(),
  width: z.number().min(256).max(2048).optional(),
  height: z.number().min(256).max(2048).optional(),
  seed: z.number().int().optional(),
});

export type GenerateImageInput = z.infer<typeof generateImageSchema>;
