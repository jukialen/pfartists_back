import { Module } from '@nestjs/common';
import { SubCommentsController } from './sub-comments.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [SubCommentsController],
  imports: [RolesModule],
})
export class SubCommentsModule {}
