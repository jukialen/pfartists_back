import { HttpException, HttpStatus } from '@nestjs/common';

export const allContent = {
  statusCode: HttpStatus.NO_CONTENT,
  message: 'All content has been displayed.',
};

export const deleted = (name: string): HttpException => {
  throw new HttpException(
    {
      status: HttpStatus.OK,
      error: `${name} has been deleted`,
    },
    HttpStatus.OK,
  );
};
