import {
  CreateBucketCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { formatFileName, getMimeType, deleteFile } from 'src/utils';
import { Readable } from 'stream';
import * as Const from 'src/constants';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(MinioService.name);
  private bucketName: string;
  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('MINIO_REGION'),
      endpoint: this.configService.get('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY'),
        secretAccessKey: this.configService.get('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME');
  }

  async onModuleInit() {
    await this.createBucketIfNotExists(this.bucketName);
  }

  async createBucketIfNotExists(bucketName: string) {
    try {
      const command = new CreateBucketCommand({ Bucket: bucketName });
      await this.s3Client.send(command);
      this.logger.log(`Bucket "${bucketName}" created`);
    } catch (err: any) {
      if (err.name === 'BucketAlreadyOwnedByYou') {
        this.logger.log(`Bucket "${bucketName}" already exists`);
      } else {
        this.logger.error(`Error creating bucket: ${err.message}`);
      }
    }
  }

  async uploadFile(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const fileNameFormat = formatFileName(fileName);
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileNameFormat,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
      this.logger.log(`Uploaded file ${fileNameFormat} successfully`);
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
    return fileNameFormat;
  }

  async uploadLargeFileToMinio(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    const contentType = getMimeType(fileName);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: fileName,
        Body: fs.createReadStream(filePath),
        ContentType: contentType,
      },
      partSize: 10 * 1024 * 1024,
      queueSize: 5,
    });

    upload.on('httpUploadProgress', (progress) => {
      this.logger.log(`Progress: ${progress.loaded} / ${progress.total}`);
    });

    try {
      await upload.done();
      this.logger.log(`Upload ${fileName} completed`);
    } catch (err) {
      this.logger.error(`Upload failed: ${err.message}`);
      //clean file in tmp
      deleteFile(filePath);
      throw err;
    }
  }

  async downloadFile(objectKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const response = await this.s3Client.send(command);
    const body = response.Body as Readable;

    fs.mkdirSync(Const.tempDownloadDir, { recursive: true });
    const tempFilePath = path.join(Const.tempDownloadDir, `${objectKey}`);
    const writeStream = fs.createWriteStream(tempFilePath);

    return new Promise((resolve, reject) => {
      body
        .pipe(writeStream)
        .on('finish', () => {
          this.logger.log(`Downloaded to ${tempFilePath}`);
          resolve(tempFilePath);
        })
        .on('error', (err) => {
          console.log({ err });
          reject(err);
        });
    });
  }
}
