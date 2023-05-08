import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { UsersGroupsModule } from '../users-groups/users-groups.module';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
  imports: [UsersGroupsModule],
})
export class GroupsModule {}
