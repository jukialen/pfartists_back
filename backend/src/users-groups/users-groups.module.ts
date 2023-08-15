import { Module } from '@nestjs/common';
import { UsersGroupsService } from './users-groups.service';
import { RolesModule } from '../roles/roles.module';

@Module({
  providers: [UsersGroupsService],
  exports: [UsersGroupsService],
  imports: [RolesModule],
})
export class UsersGroupsModule {}
