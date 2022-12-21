import {
  Body,
  Controller,
  Delete,
  Get,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma, Users as UsersModel } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<UsersModel[] | 'Already done'> {
    const orderArray: object[] = [];

    if (typeof orderBy === 'string') {
      const order = orderBy.split(', ');

      for (const or of order) {
        const data = or.replace(/(\w+:)|(\w+ :)/g, function (s) {
          return '"' + s.substring(0, s.length - 1) + '":';
        });

        const obj: Prisma.UsersOrderByWithRelationInput = await JSON.parse(
          data,
        );

        orderArray.push(obj);
      }
    }

    let whereObj: Prisma.UsersWhereInput;

    if (typeof where === 'string') {
      const whereData = where.replace(/(\w+:)|(\w+ :)/g, function (s) {
        return '"' + s.substring(0, s.length - 1) + '":';
      });

      whereObj = await JSON.parse(whereData);
    }

    const firstResults = await this.usersService.users({
      take: parseInt(limit) || undefined,
      orderBy: orderArray || undefined,
      skip: parseInt(skip) || undefined,
      where: whereObj || undefined,
    });

    if (!!cursor) {
      const nextResults = await this.usersService.users({
        take: parseInt(limit) || undefined,
        orderBy: orderArray || undefined,
        skip: 1,
        cursor: {
          pseudonym: cursor,
        },
        where: whereObj || undefined,
      });

      const nextData = [];

      for (const next of nextResults) {
        nextData.push({
          username: next.username,
          pseudonym: next.pseudonym,
          email: next.email,
          description: next.description,
          photoUrl: next.profilePhoto,
          plan: next.plan,
        });
      }
      return nextData ? nextData : 'Already done';
    } else if (!!skip) {
      return await this.usersService.users({
        take: parseInt(limit) || undefined,
        orderBy: orderArray || undefined,
        skip: parseInt(skip),
        where: whereObj || undefined,
      });
    } else {
      const firstData = [];

      for (const fir of firstResults) {
        firstData.push({
          username: fir.username,
          pseudonym: fir.pseudonym,
          email: fir.email,
          description: fir.description,
          photoUrl: fir.profilePhoto,
          plan: fir.plan,
        });
      }
      return firstData;
    }
  }

  @Get(':pseudonym')
  async getOneUser(@Param('pseudonym') pseudonym: string): Promise<{
    username?: string;
    pseudonym: string;
    email: string;
    description?: string;
    photoUrl?: string;
    plan: string;
  }> {
    const result = await this.usersService.findUser({ pseudonym });

    return {
      username: result.username,
      pseudonym: result.pseudonym,
      email: result.email,
      description: result.description,
      photoUrl: result.profilePhoto,
      plan: result.plan,
    };
  }

  @Post()
  async signUp(
    @Body() userData: { email: string; password: string },
  ): Promise<UsersModel | NotAcceptableException> {
    return this.usersService.createUser(userData);
  }

  @Patch(':pseudonym')
  async updateUsername(
    @Param('pseudonym') pseudonym: string,
    @Body('data')
    data: Prisma.UsersUpdateInput | Prisma.UsersUncheckedUpdateInput,
  ): Promise<UsersModel> {
    return this.usersService.updateUser({
      where: { pseudonym },
      data,
    });
  }

  @Delete(':pseudonym')
  async delete(@Param('pseudonym') pseudonym: UsersModel): Promise<UsersModel> {
    return await this.usersService.deleteUser(pseudonym);
  }
}
