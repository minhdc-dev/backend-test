import { Injectable } from '@nestjs/common';
import { VideoService } from 'src/video/video.service';

@Injectable()
export class AnalysisService {
  constructor(private readonly videoService: VideoService) {}

  async exposureTimeInSeconds(
    logoName: string,
    videoName: string,
    intervalSeconds: number,
  ) {
    return this.videoService.exposureTimeInSeconds(
      logoName,
      videoName,
      intervalSeconds,
    );
  }
}
