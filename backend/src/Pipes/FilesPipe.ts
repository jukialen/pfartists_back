import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class FilesPipe implements PipeTransform {
  transform(value: Express.Multer.File) {
    if (
      value.mimetype === 'image/png' ||
      'image/jpg' ||
      'image/jpeg' ||
      'image/avif' ||
      'image/webp' ||
      'image/gif'
    ) {
      const size = 5000000;
      return value.size <= size;
    } else if (value.mimetype === 'videos/webm' || 'videos/mp4') {
      const size = 200000000;
      return value.size <= size;
    }
    return false;
  }
}
