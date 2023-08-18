import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { UsersGroupsModule } from '../users-groups/users-groups.module';
import { PostsModule } from '../posts/posts.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
  imports: [RolesModule, PostsModule, UsersGroupsModule],
})
export class GroupsModule {}
