import { Module } from '@nestjs/common';
import { LastCommentsController } from './last-comments.controller';

@Module({
  controllers: [LastCommentsController]
})
export class LastCommentsModule {}
