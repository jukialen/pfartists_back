import { S3, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
export const parallelUploads3 = (
  client: S3 | S3Client,
  bucket: string,
  file: Express.Multer.File,
): Upload => {
  return new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: file.originalname,
      Body: file.buffer,
    },
  });
};
