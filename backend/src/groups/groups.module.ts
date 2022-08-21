import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groups.controller';
import { Groups } from './groups.entity';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Groups])
    ],
  controllers: [GroupsController],
  providers: [GroupsService]
})
export class GroupsModule {}
