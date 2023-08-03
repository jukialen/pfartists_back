import { Module } from '@nestjs/common';
import { GroupsPostsController } from './groups-posts.controller';
import { GroupsPostsService } from './groups-posts.service';
import { PostsModule } from '../posts/posts.module';
import { LikedModule } from '../liked/liked.module';

@Module({
  controllers: [GroupsPostsController],
  providers: [GroupsPostsService],
  exports: [GroupsPostsService],
  imports: [PostsModule, LikedModule],
})
export class GroupsPostsModule {}
