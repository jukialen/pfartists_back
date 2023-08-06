import { Module } from '@nestjs/common';
import { SubCommentsController } from './sub-comments.controller';

@Module({
  controllers: [SubCommentsController]
})
export class SubCommentsModule {}
