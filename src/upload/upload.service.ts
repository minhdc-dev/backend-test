import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { MinioService } from 'src/minio/minio.service';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  constructor(private readonly minioService: MinioService) {}

  async uploadImage(file: Express.Multer.File) {
    // Convert to png
    const pngBuffer = await sharp(file.buffer).png().toBuffer();
    file.originalname = `${file.originalname.replace(path.extname(file.originalname), '')}.png`;

    const filename = await this.minioService.uploadFile(
      file.originalname,
      pngBuffer,
      'image/png',
    );

    if (!filename) {
      return {
        status: HttpStatus.FOUND,
        message: 'Upload fail',
      };
    }
    return {
      status: HttpStatus.CREATED,
      message: 'Upload successfully.',
      fileName: filename,
    };
  }

  async uploadVideo(file: Express.Multer.File) {
    await this.minioService.uploadLargeFileToMinio(file.path);

    // Delete file in tmp
    fs.unlinkSync(file.path);
    return {
      status: HttpStatus.CREATED,
      message: 'Upload video successfully.',
      fileName: file.filename,
    };
  }
}
