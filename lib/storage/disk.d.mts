export type ImageGroup = "ticket-images" | "ticket-outputs" | "blog-covers" | "blog-images";
export function imageStorageRoot(): string;
export function writeImage(group: ImageGroup, data: Buffer): Promise<string>;
export function readImage(key: string): Promise<Buffer | null>;
export function readStoredImage(row: { file_path?: string | null; image_data?: Buffer | null } | null | undefined): Promise<Buffer | null>;
