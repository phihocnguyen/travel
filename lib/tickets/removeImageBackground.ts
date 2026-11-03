"use client";

import type { BackgroundRemovalPipeline } from "@huggingface/transformers";

type BackgroundRemover = InstanceType<typeof BackgroundRemovalPipeline>;

let removerPromise: Promise<BackgroundRemover> | null = null;

async function getRemover(): Promise<BackgroundRemover> {
  if (!removerPromise) {
    const { pipeline } = await import("@huggingface/transformers");
    removerPromise = pipeline("background-removal", "Ko033/isnet-general-use-onnx", {
      dtype: "q8",
    });
  }

  try {
    return await removerPromise;
  } catch (error) {
    removerPromise = null;
    throw error;
  }
}

export async function removeImageBackground(image: Blob): Promise<Blob> {
  const remover = await getRemover();
  const sourceUrl = URL.createObjectURL(image);

  try {
    const result = await remover(sourceUrl);
    return await result.toBlob("image/png");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
