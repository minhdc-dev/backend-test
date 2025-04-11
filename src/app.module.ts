import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoService } from './video/video.service';
import { FfmpegService } from './video/ffmpeg.service';
import { AnalysisController } from './analysis/analysis.controller';
import { AnalysisService } from './analysis/analysis.service';
import { ImageCompareService } from './video/image.compare.service';
import { UploadService } from './upload/upload.service';
import { UploadController } from './upload/upload.controller';
import { MinioService } from './minio/minio.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AnalysisController, UploadController],
  providers: [
    VideoService,
    FfmpegService,
    AnalysisService,
    ImageCompareService,
    UploadService,
    MinioService,
  ],
})
export class AppModule {}
