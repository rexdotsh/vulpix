'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { availableModels } from '@/lib/availableModels';
import {
  generateImageSchema,
  type GenerateImageInput,
} from '@/lib/validationSchemas';

export default function GeneratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageDimensions, setGeneratedImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const form = useForm<GenerateImageInput>({
    resolver: zodResolver(generateImageSchema),
    defaultValues: {
      model: availableModels[0].id,
      prompt: '',
      neg_prompt: '',
      num_iterations: 25,
      guidance_scale: 7.5,
      width: 1024,
      height: 768,
      seed: undefined,
    },
  });

  const onSubmit: SubmitHandler<GenerateImageInput> = async (data) => {
    setIsLoading(true);
    setGeneratedImage(null);
    setGeneratedImageDimensions(null);
    toast.info('Generating image...');

    const payload: { [key: string]: any } = { ...data };

    if (!payload.neg_prompt || payload.neg_prompt.trim() === '') {
      payload.neg_prompt = undefined;
    }
    if (payload.seed === undefined || Number.isNaN(payload.seed)) {
      payload.seed = undefined;
    }

    try {
      const response = await fetch('/api/heurist/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          typeof errorData.error === 'string'
            ? errorData.error
            : errorData.error?.message || 'Failed to generate image';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.url) {
        setGeneratedImage(result.url);
        setGeneratedImageDimensions({
          width: data.width ?? 1024,
          height: data.height ?? 768,
        });
        toast.success('Image generated successfully!');
      } else {
        console.error('Unexpected API response structure:', result);
        throw new Error('Image URL not found in API response.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error generating image.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedModelId = form.watch('model');
  const modelDescription = availableModels.find(
    (m) => m.id === selectedModelId,
  )?.description;

  const watchWidth = form.watch('width');
  const watchHeight = form.watch('height');
  const watchIterations = form.watch('num_iterations');
  const watchGuidance = form.watch('guidance_scale');

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Image Generation Studio</CardTitle>
              <CardDescription>
                Craft your vision. Define parameters and let the AI bring your
                ideas to life.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-0"
              >
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableModels.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {modelDescription && (
                          <FormDescription>{modelDescription}</FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., A majestic lion in a vibrant jungle, golden hour"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the image you want to create.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neg_prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Negative Prompt (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., blurry, low quality, text, watermark"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe what to avoid in the image.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width: {watchWidth ?? 1024}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={256}
                              max={2048}
                              step={64}
                              value={[field.value ?? 1024]}
                              onValueChange={(val) => field.onChange(val[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height: {watchHeight ?? 768}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={256}
                              max={2048}
                              step={64}
                              value={[field.value ?? 768]}
                              onValueChange={(val) => field.onChange(val[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="num_iterations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Iterations: {watchIterations ?? 25}
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value ?? 25]}
                              onValueChange={(val) => field.onChange(val[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guidance_scale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Guidance Scale: {watchGuidance ?? 7.5}
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={20}
                              step={0.5}
                              value={[field.value ?? 7.5]}
                              onValueChange={(val) => field.onChange(val[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="seed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seed (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Leave blank for random"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === ''
                                  ? undefined
                                  : Number.parseInt(val, 10),
                              );
                            }}
                            value={
                              field.value === undefined
                                ? ''
                                : String(field.value)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          A specific seed for reproducible results. Random if
                          blank.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="pt-6">
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Image'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-8">
          <Card className="w-full min-h-[300px] lg:min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
            <CardHeader className="w-full">
              <CardTitle className="text-center">Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center w-full p-2 aspect-[1/1] max-h-[70vh]">
              {isLoading && (
                <div className="flex flex-col items-center text-muted-foreground">
                  <svg
                    className="animate-spin h-12 w-12 mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p>Generating your masterpiece...</p>
                </div>
              )}
              {!isLoading && generatedImage && generatedImageDimensions && (
                <Image
                  src={generatedImage}
                  alt="Generated image"
                  width={generatedImageDimensions.width}
                  height={generatedImageDimensions.height}
                  className="rounded-md object-contain max-w-full max-h-full"
                  priority
                  unoptimized
                />
              )}
              {!isLoading && !generatedImage && (
                <div className="text-center text-muted-foreground p-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-4 opacity-50"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">
                    Your Image Will Appear Here
                  </h3>
                  <p className="text-sm">
                    Fill out the form on the left and click "Generate Image" to
                    see the magic happen.
                  </p>
                </div>
              )}
            </CardContent>
            {generatedImage && (
              <CardFooter className="pt-4 flex justify-center">
                <Button variant="outline" asChild>
                  <a
                    href={generatedImage}
                    download={`generated_image_${Date.now()}.png`}
                  >
                    Download Image
                  </a>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
