import { Module } from '@nestjs/common';
import { LastCommentsController } from './last-comments.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  controllers: [LastCommentsController],
  imports: [RolesModule],
})
export class LastCommentsModule {}
