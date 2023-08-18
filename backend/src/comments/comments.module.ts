import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { SubCommentsModule } from 'src/sub-comments/sub-comments.module';
import { RolesModule } from '../roles/roles.module';


@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
  imports: [SubCommentsModule, RolesModule],
})
export class CommentsModule {}
