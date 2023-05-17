import { Module } from '@nestjs/common';
import { LikedService } from './liked.service';

@Module({
  providers: [LikedService],
  exports: [LikedService],
})
export class LikedModule {}
