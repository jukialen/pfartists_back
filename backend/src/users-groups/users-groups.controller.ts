import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Inject,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersGroupsService } from './users-groups.service';
import { Prisma, Role } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';

import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users-groups')
export class UsersGroupsController {
  constructor(
    private prisma: PrismaService,
    private usersGroupsService: UsersGroupsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post()
  @UseGuards(new AuthGuard())
  async createRelation(
    @Body('data') data: Prisma.UsersGroupsUncheckedCreateInput,
  ) {
    return this.usersGroupsService.createRelation(data);
  }

  @Patch(':name')
  @UseGuards(new AuthGuard())
  async updateGroup(
    @Body('data')
    data: Prisma.UsersGroupsUncheckedUpdateInput & { role?: Role },
  ) {
    return this.usersGroupsService.updateRelation(data, {
      usersGroupsId: data.usersGroupsId.toString(),
    });
  }
  @Delete(':usersGroupsId')
  @UseGuards(new AuthGuard())
  async deleteGroup(@Body('usersGroupsId') data: Prisma.UsersGroupsWhereInput) {
    return this.usersGroupsService.deleteRelation(data);
  }
}
