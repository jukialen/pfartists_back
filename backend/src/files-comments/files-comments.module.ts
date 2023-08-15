import { Module } from '@nestjs/common';
import { FilesCommentsController } from './files-comments.controller';
import { FilesCommentsService } from './files-comments.service';
import { FilesModule } from '../files/files.module';

@Module({
  controllers: [FilesCommentsController],
  providers: [FilesCommentsService],
  imports: [FilesModule],
})
export class FilesCommentsModule {}
