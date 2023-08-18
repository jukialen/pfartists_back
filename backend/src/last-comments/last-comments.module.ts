import { Module } from '@nestjs/common';
import { LastCommentsController } from './last-comments.controller';
import { LastCommentsService } from './last-comments-service';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [LastCommentsController],
  providers: [LastCommentsService],
  exports: [LastCommentsService],
  imports: [RolesModule],
})
export class LastCommentsModule {}
