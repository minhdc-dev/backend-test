import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import * as Const from 'src/constants';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);
  async splitVideoToFrames(
    videoPath: string,
    intervalSeconds = 10,
  ): Promise<string[]> {
    const outputDir = path.join(
      Const.outputFramesDir,
      path.basename(videoPath, path.extname(videoPath)),
    );

    const videoDuration = await this.getVideoDurationInSeconds(videoPath);
    const estimatedFrames = Math.ceil(videoDuration / intervalSeconds);
    const paddingDigits = Math.max(
      4,
      Math.ceil(Math.log10(estimatedFrames + 1)),
    );

    fs.mkdirSync(outputDir, { recursive: true });
    const outputPattern = path.join(
      outputDir,
      `frame_%0${paddingDigits}d.jpeg`,
    );
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([`-vf`, `fps=1/${intervalSeconds}`])
        .output(outputPattern)
        .on('progress', (progress) => {
          this.logger.log(
            `Extracting progress... [${progress.percent?.toFixed(0)}%]`,
          );
        })
        .on('end', () => {
          const files = fs
            .readdirSync(outputDir)
            .filter((f) => f.endsWith('.jpeg'))
            .map((f) => path.join(outputDir, f));
          this.logger.log(
            `Extracted ${files.length} frames (1 every ${intervalSeconds}s)`,
          );
          resolve(files);
        })
        .on('error', (err) => {
          this.logger.error(`FFmpeg error: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  // Get duration of video
  async getVideoDurationInSeconds(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format.duration;
        if (!duration) return reject(new Error('No duration found'));
        resolve(Math.ceil(duration));
      });
    });
  }
}
