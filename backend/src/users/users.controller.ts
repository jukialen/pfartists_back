import {
  Body,
  CacheInterceptor,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  NotFoundException,
  NotAcceptableException,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Prisma, Users as UsersModel } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async findAll(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('where') where?: string,
    @Query('cursor') cursor?: string,
  ): Promise<unknown | UsersModel[] | NotFoundException> {
    const getCache = await this.cacheManager.get('users');

    if (!!getCache) {
      return getCache;
    } else {
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
        where: whereObj || undefined,
      });

      const firstData = [];

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
        return nextData
          ? firstData.concat(...nextData)
          : new NotFoundException('Already done');
      } else {
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
      }

      await this.cacheManager.set('users', firstData, 0);
      return firstData;
    }
  }

  @Get(':pseudonym')
  async getOneUser(@Param('pseudonym') pseudonym: string): Promise<
    | unknown
    | {
        username?: string;
        pseudonym: string;
        email: string;
        description?: string;
        photoUrl?: string;
        plan: string;
      }
  > {
    const getCache = await this.cacheManager.get('usersOne');

    if (!!getCache) {
      return getCache;
    } else {
      const result = await this.usersService.findUser({ pseudonym });
      const data = {
        username: result.username,
        pseudonym: result.pseudonym,
        email: result.email,
        description: result.description,
        photoUrl: result.profilePhoto,
        plan: result.plan,
      };

      await this.cacheManager.set('usersOne', data);
      return data;
    }
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
    await this.cacheManager.reset();
    return await this.usersService.deleteUser(pseudonym);
  }
}
