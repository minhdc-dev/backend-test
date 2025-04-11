import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class ExposureSecondsInput {
  @ApiProperty({
    example: '20250409_132850_1Netherlands.png',
  })
  @IsNotEmpty()
  logoName: string;
  @ApiProperty({
    example: '20250409_174359_test_15s.mp4',
  })
  @IsNotEmpty()
  videoName: string;
  @ApiProperty({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  intervalSeconds?: number = 10;
}
