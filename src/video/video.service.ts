import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FfmpegService } from './ffmpeg.service';
import { MinioService } from 'src/minio/minio.service';
import * as Utils from 'src/utils';
import * as Const from 'src/constants';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  constructor(
    private readonly minioService: MinioService,
    private readonly ffmpegService: FfmpegService,
  ) {}

  async exposureTimeInSeconds(
    logoName: string,
    videoName: string,
    intervalSeconds: number,
  ): Promise<{
    status: number;
    message: string;
    data: { exposureSeconds: number[]; total: number };
  }> {
    const [logoPath, videoPath] = await Promise.all([
      await this.minioService.downloadFile(logoName),
      await this.minioService.downloadFile(videoName),
    ]);
    const frames = await this.ffmpegService.splitVideoToFrames(
      videoPath,
      intervalSeconds || Const.intervalSeconds,
    );
    const exposureSeconds = await this.compareWithLogo(
      logoPath,
      frames,
      intervalSeconds || Const.intervalSeconds,
    );

    // clean
    Utils.deleteFolder(Const.outputFramesDir);
    Utils.deleteFolder(Const.tempDownloadDir);

    this.logger.log('Returned results');
    return {
      status: HttpStatus.OK,
      message: 'Successful Analysis',
      data: {
        exposureSeconds,
        total: exposureSeconds.length,
      },
    };
  }

  private async compareWithLogo(
    logoPath: string,
    frams: string[],
    intervalSeconds: number,
  ): Promise<number[]> {
    const results: number[] = [];
    for (let i = 0; i < frams.length; i++) {
      const isVisible = await this.mockCompare(logoPath, frams[i]);
      if (isVisible) results.push(i * intervalSeconds);
    }
    return results;
  }

  private async mockCompare(
    logoPath: string,
    framePath: string,
  ): Promise<boolean> {
    // Mock for test
    return Math.random() > 0.7;

    // Using OpenAI compare to video frame is contain the logo
    // return this.compareService.compareFrameWithLogo(logoPath, framePath);
  }
}
