import {
  Body,
  CACHE_MANAGER,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Post,
  UsePipes,
  UploadedFile,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Prisma, Role } from '@prisma/client';
import { SessionContainer } from 'supertokens-node/recipe/session';
import ses from 'supertokens-node/recipe/session';

import { queriesTransformation } from '../constants/queriesTransformation';
import { AuthGuard } from '../auth/auth.guard';
import { Session } from '../auth/session.decorator';
import { JoiValidationPipe } from '../Pipes/JoiValidationPipe';
import { FilesPipe } from '../Pipes/FilesPipe';
import { UsersPipe } from '../Pipes/UsersPipe';
import { allContent } from '../constants/allCustomsHttpMessages';
import { UserDto, SortType, MembersDto } from '../DTOs/user.dto';
import { QueryDto } from '../DTOs/query.dto';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { UsersGroupsService } from '../users-groups/users-groups.service';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly usersGroupsService: UsersGroupsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @UseGuards(new AuthGuard())
  async newUsers(@Query('where') where: string) {
    const whereElements: Prisma.UsersWhereUniqueInput = JSON.parse(where);

    return await this.usersService.findUser(whereElements);
  }

  @Get('all')
  @UseGuards(new AuthGuard())
  async users(@Query('queryData') queryData: QueryDto) {
    const getCache: UserDto[] = await this.cacheManager.get('users');

    const { orderBy, limit, where, cursor } = queryData;
    if (!!getCache) {
      return getCache;
    } else {
      const { order, whereElements }: SortType = await queriesTransformation(
        true,
        orderBy,
        where,
      );

      const firstResults = await this.usersService.findAllUsers({
        take: parseInt(limit),
        orderBy: order,
        where: whereElements,
      });

      const firstNextData: UserDto[] = [];
      const nextData: UserDto[] = [];

      if (!!cursor) {
        const nextResults = await this.usersService.findAllUsers({
          take: parseInt(limit),
          orderBy: order,
          skip: 1,
          cursor: {
            pseudonym: cursor,
          },
          where: whereElements,
        });

        if (nextResults.length > 0) {
          if (firstNextData.length === 0) {
            firstNextData.concat(firstResults, nextResults);
            await this.cacheManager.set('users', firstNextData);
            return firstNextData;
          }

          if (nextData.length === 0) {
            nextData.concat(firstNextData, nextResults);
            await this.cacheManager.set('users', nextData);
            return nextData;
          }

          nextData.concat(nextResults);
          await this.cacheManager.set('users', nextData);
          return nextData;
        } else {
          return allContent;
        }
      } else {
        await this.cacheManager.set('users', firstResults);
        return firstResults;
      }
    }
  }

  @Get('members')
  @UseGuards(new AuthGuard())
  async getUsersFromGroupsWithRole(
    @Query('queryData')
    queryData: QueryDto & { name: string; role: Role },
  ) {
    const { orderBy, limit, cursor, name, role } = queryData;

    const { roleId } = await this.prisma.roles.findUnique({
      where: { type: role },
      select: {
        roleId: true,
      },
    });

    const { order }: SortType = await queriesTransformation(false, orderBy);

    const firstIdResults =
      await this.usersGroupsService.getTheGroupOfGivenUserAboutGivenRole({
        orderBy: order,
        take: parseInt(limit),
        name,
        roleId,
      });

    if (role === Role.ADMIN) {
      const { pseudonym, profilePhoto } = await this.usersService.findUser({
        id: firstIdResults[0].userId,
      });
      return {
        pseudonym,
        profilePhoto,
      };
    } else {
      const firstData: MembersDto[] = [];

      for (const first of firstIdResults) {
        const user: UserDto = await this.usersService.findUser({
          id: first.userId,
        });

        firstData.push({
          usersGroupsId: first.usersGroupsId,
          pseudonym: user.pseudonym,
          profilePhoto: user.profilePhoto,
        });
      }

      if (!!cursor) {
        const nextData: MembersDto[] = [];

        const nextIdResults =
          await this.usersGroupsService.getTheGroupOfGivenUserAboutGivenRole({
            orderBy: order,
            take: parseInt(limit),
            skip: 1,
            cursor: {
              usersGroupsId: cursor,
            },
            name,
            roleId,
          });

        if (nextIdResults.length > 0) {
          for (const next of nextIdResults) {
            const user: UserDto = await this.usersService.findUser({
              id: next.userId,
            });
            nextData.push({
              usersGroupsId: next.usersGroupsId,
              pseudonym: user.pseudonym,
              profilePhoto: user.profilePhoto,
            });
          }

          await this.cacheManager.set('usersGroups', nextData);
          return nextData;
        }
      } else {
        return firstData;
      }
    }
  }

  @Get(':pseudonym')
  @UseGuards(new AuthGuard())
  async oneUser(@Param('pseudonym') pseudonym: string) {
    const getCache: UserDto = await this.cacheManager.get('userOne');

    if (!!getCache) {
      return getCache;
    } else {
      return await this.usersService.findUser({ pseudonym });
    }
  }

  @Post()
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(UsersPipe))
  async newUser(
    @Session() session: SessionContainer,
    @Body('userData') userData: Prisma.UsersCreateInput,
  ) {
    const id = session.getUserId();

    return this.usersService.createUser({
      ...userData,
      all_auth_recipe_users: {
        connect: {
          user_id: id,
        },
      },
    });
  }

  @Patch(':pseudonym')
  @UseGuards(new AuthGuard())
  @UsePipes(new JoiValidationPipe(UsersPipe))
  @UseInterceptors(FilesPipe)
  async update(
    @Session() session: SessionContainer,
    @Param('pseudonym') pseudonym: string,
    @Body('data')
    data: Prisma.UsersUpdateInput | Prisma.UsersUncheckedUpdateInput,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ statusCode: number; message: string } | BadRequestException> {
    const id = session.getUserId();

    const updatedUser = await this.usersService.updateUser({
      where: { pseudonym },
      data: { ...data, file },
    });

    if (!!updatedUser) {
      await ses.revokeAllSessionsForUser(id);
      await session.revokeSession();
      return {
        statusCode: 200,
        message: 'Your password was updated',
      };
    } else {
      throw new BadRequestException('You have given the wrong data.');
    }
  }

  @Delete(':pseudonym')
  @UseGuards(new AuthGuard())
  async delete(
    @Session() session: SessionContainer,
    @Param('pseudonym') pseudonym: string,
  ) {
    return this.usersService.deleteUser(
      { pseudonym },
      session.getUserId(),
      ses,
      session,
    );
  }
}
