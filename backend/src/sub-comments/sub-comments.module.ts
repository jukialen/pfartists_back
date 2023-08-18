import { Module } from '@nestjs/common';
import { SubCommentsController } from './sub-comments.controller';
import { SubCommentsService } from './sub-comments-service';
import { LastCommentsModule } from 'src/last-comments/last-comments.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [SubCommentsController],
  providers: [SubCommentsService],
  exports: [SubCommentsService],
  imports: [LastCommentsModule, RolesModule],
})
export class SubCommentsModule {}
