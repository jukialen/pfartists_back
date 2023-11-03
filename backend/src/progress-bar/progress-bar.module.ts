import { Module } from '@nestjs/common';
import { ProgressBarGateway } from './progress-bar.gateway';
import { FilesModule } from '../files/files.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  providers: [ProgressBarGateway],
  exports: [ProgressBarGateway],
  imports: [FilesModule, GroupsModule],
})
export class ProgressBarModule {}
