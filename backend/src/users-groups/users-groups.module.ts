import { Module } from '@nestjs/common';
import { UsersGroupsController } from './users-groups.controller';
import { UsersGroupsService } from './users-groups.service';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [UsersGroupsController],
  providers: [UsersGroupsService],
  exports: [UsersGroupsService],
  imports: [RolesModule],
})
export class UsersGroupsModule {}
