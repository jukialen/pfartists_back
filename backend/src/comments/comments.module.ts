import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [CommentsController],
  imports: [RolesModule],
})
export class CommentsModule {}
