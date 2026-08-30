import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Readable } from "stream";
import {
  getObjectStorageConfig,
  ObjectStorageConfig,
} from "./object-storage.config.js";

@Injectable()
export class ObjectStorageService {
  private readonly configObjectStorage: ObjectStorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.configObjectStorage = getObjectStorageConfig(this.configService);
  }

  /**
   * https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/CLIENTS.md
   */
  public createObjectStorageClient() {
    return new S3Client({
      // Required by AWS SDK, not used by R2
      region: "auto",
      endpoint: this.configObjectStorage.endpoint,
      credentials: {
        accessKeyId: this.configObjectStorage.accessKeyId,
        secretAccessKey: this.configObjectStorage.secretAccessKey,
      },
    });
  }

  public async upload(
    key: string,
    body: Readable,
    contentType = "application/octet-stream",
  ) {
    const parallelUpload = new Upload({
      client: this.createObjectStorageClient(),
      params: {
        Bucket: this.configObjectStorage.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });

    await parallelUpload.done();

    const head = await this.createObjectStorageClient().send(
      new HeadObjectCommand({
        Bucket: this.configObjectStorage.bucket,
        Key: key,
      }),
    );

    const sizeBytes = head.ContentLength ?? 0;

    return sizeBytes;
  }

  private formatBytes(n: number) {
    if (n < 1024) {
      return `${n} B`;
    }

    if (n < 1024 ** 2) {
      return `${(n / 1024).toFixed(1)} KB`;
    }

    return `${(n / 1024 ** 2).toFixed(1)} MB`;
  }
}
