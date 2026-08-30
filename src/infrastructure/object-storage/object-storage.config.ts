import { ConfigService } from "@nestjs/config";

export type ObjectStorageConfig = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export function getObjectStorageConfig(
  config: ConfigService,
): ObjectStorageConfig {
  const endpoint = config.getOrThrow("OBJECT_STORAGE_ENDPOINT");
  const accessKeyId = config.getOrThrow("OBJECT_STORAGE_ACCESS_KEY_ID");
  const secretAccessKey = config.getOrThrow("OBJECT_STORAGE_SECRET_ACCESS_KEY");
  const bucket = config.getOrThrow("OBJECT_STORAGE_BUCKET");

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}
