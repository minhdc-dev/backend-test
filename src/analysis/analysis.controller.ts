import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ExposureSecondsInput } from 'src/interfaces/analysis';

@Controller('analysis')
@ApiTags('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}
  @Post('exposureTimeInSeconds')
  @ApiBody({
    type: ExposureSecondsInput,
  })
  async analyze(
    @Body()
    body: ExposureSecondsInput,
  ) {
    return this.analysisService.exposureTimeInSeconds(
      body.logoName,
      body.videoName,
      body.intervalSeconds,
    );
  }
}
