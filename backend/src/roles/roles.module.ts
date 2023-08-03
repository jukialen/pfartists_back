import { Module } from '@nestjs/common';
import { RolesService } from './rolesService';

@Module({
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
