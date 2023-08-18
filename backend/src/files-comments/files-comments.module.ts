import { Module } from '@nestjs/common';
import { FilesCommentsController } from './files-comments.controller';
import { FilesCommentsService } from './files-comments.service';
import { FilesModule } from '../files/files.module';
import { SubCommentsModule } from 'src/sub-comments/sub-comments.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  controllers: [FilesCommentsController],
  providers: [FilesCommentsService],
  imports: [FilesModule, SubCommentsModule, RolesModule],
})
export class FilesCommentsModule {}
