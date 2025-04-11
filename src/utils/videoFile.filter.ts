import { BadRequestException } from '@nestjs/common';

export const videoFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/\/(mp4|mov)$/)) {
    return callback(
      new BadRequestException('Only video file are allowed!'),
      false,
    );
  }
  callback(null, true);
};
