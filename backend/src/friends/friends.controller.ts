import { Controller, Get, Param } from '@nestjs/common';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async findALl(@Param('limit') limit: number) {
      return this.friendsService.users({
        take: limit
      })
    }
}
