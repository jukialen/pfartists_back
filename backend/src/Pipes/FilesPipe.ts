import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';

@Injectable()
export class PhotosAnimSizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const oneKb = 1024;
    return value.size < oneKb;
  }
}

@Injectable()
export class VideosSizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const size = 51200;
    return value.size < size;
  }
}

export const FileTypePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 1048576 }),
    new FileTypeValidator({
      fileType: '^.*\\.jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP|avif|AVIF$',
    }),
  ],
});
