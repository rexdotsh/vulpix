import { NextResponse } from 'next/server';
import Heurist from 'heurist';
import { env } from '@/env';
import { generateImageSchema } from '@/lib/validationSchemas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = generateImageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors },
        { status: 400 },
      );
    }
    const {
      model,
      prompt,
      neg_prompt,
      num_iterations,
      guidance_scale,
      width,
      height,
      seed,
    } = parseResult.data;

    const heurist = new Heurist({ apiKey: env.HEURIST_API_KEY });

    const result = await heurist.images.generate({
      model,
      prompt,
      ...(neg_prompt && { neg_prompt }),
      ...(num_iterations && { num_iterations }),
      ...(guidance_scale && { guidance_scale }),
      ...(width && { width }),
      ...(height && { height }),
      ...(seed !== undefined && { seed }),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating image via Heurist:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
