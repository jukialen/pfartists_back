import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FriendsModule } from '../friends/friends.module';
import { GroupsModule } from '../groups/groups.module';
import { FilesModule } from '../files/files.module';
import { RolesModule } from '../roles/roles.module';
import { UsersGroupsModule } from '../users-groups/users-groups.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    FriendsModule,
    GroupsModule,
    FilesModule,
    RolesModule,
    UsersGroupsModule,
  ],
})
export class UsersModule {}
