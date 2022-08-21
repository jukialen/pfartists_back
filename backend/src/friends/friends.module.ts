import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { Friends } from './friends.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friends])
    ],
  controllers: [FriendsController],
  providers: [FriendsService]
})
export class FriendsModule {}
