import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CommentsModule } from 'src/comments/comments.module';
import { LikedModule } from 'src/liked/liked.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
  imports: [CommentsModule, LikedModule, RolesModule],
})
export class PostsModule {}
