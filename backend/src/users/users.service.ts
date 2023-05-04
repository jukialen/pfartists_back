import {
  CACHE_MANAGER,
  HttpStatus,
  Inject,
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Users } from '@prisma/client';
import { Cache } from 'cache-manager';
import { deleteUser } from 'supertokens-node';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { FriendsService } from '../friends/friends.service';
import { GroupsService } from '../groups/groups.service';
import { FilesService } from '../files/files.service';

import { FriendDto } from '../DTOs/friend.dto';
import { GroupDto } from '../DTOs/group.dto';
import { FileDto } from '../DTOs/file.dto';
import { deleted } from '../constants/allCustomsHttpMessages';
import { s3Client } from '../config/aws';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly friendsService: FriendsService,
    private readonly groupsService: GroupsService,
    private readonly filesService: FilesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findUser(userWhereUniqueInput: Prisma.UsersWhereUniqueInput) {
    const _findOne = await this.prisma.users.findUnique({
      where: userWhereUniqueInput,
      select: {
        pseudonym: true,
        emailpassword_users: {
          select: {
            email: true,
          },
        },
        description: true,
        profilePhoto: true,
        plan: true,
      },
    });

    await this.cacheManager.set('userOne', _findOne);
    return _findOne || null;
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsersWhereUniqueInput;
    where?: Prisma.UsersWhereInput;
    orderBy?: Prisma.UsersOrderByWithRelationInput[];
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.users.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      select: {
        username: true,
        pseudonym: true,
        profilePhoto: true,
      },
    });
  }

  async createUser(
    data: Prisma.UsersCreateInput,
  ): Promise<string | NotAcceptableException> {
    const user = await this.users({ where: { pseudonym: data.pseudonym } });

    if (user.length > 0) {
      throw new NotAcceptableException('The user already exists.');
    } else {
      await this.prisma.users.create({ data });
      await this.cacheManager.del('users');
      return 'Success!!! User was created.';
    }
  }
  async updateUser(params: {
    where: Prisma.UsersWhereUniqueInput;
    data: Prisma.UsersUpdateInput;
  }): Promise<Users> {
    const { where, data } = params;
    return this.prisma.users.update({ data, where });
  }

  async deleteUser(
    where: Prisma.UsersWhereUniqueInput,
    userId: string,
    ses,
    session: SessionContainer,
  ): Promise<{ statusCode: number; message: string } | UnauthorizedException> {
    const { pseudonym } = where;

    if (userId) {
      await this.cacheManager.reset();
      await this.prisma.users.delete({ where });
      const friendData: FriendDto[] = await this.friendsService.friends({
        where: { OR: [{ usernameId: userId }, { friendId: userId }] },
      });
      if (friendData.length !== 0) {
        for (const data of friendData) {
          await this.friendsService.deleteFriend({ id: data.id });
        }
      }
      const groups: GroupDto[] = await this.groupsService.groups({
        where: { usersGroups: { every: { userId } } },
      });
      if (groups.length !== 0) {
        for (const group of groups) {
          await this.groupsService.deleteGroup({ name: group.name });
        }
      }
      const files: FileDto[] = await this.filesService.files({
        where: { ownerFile: userId },
      });
      if (files.length !== 0) {
        for (const file of files) {
          await this.filesService.removeFile(file.name);
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AMAZON_BUCKET,
              Key: file.name,
            }),
          );
        }
      }
      await deleted(pseudonym);
      await deleteUser(userId);
      await ses.revokeAllSessionsForUser(userId);
      await session.revokeSession();
      return {
        statusCode: HttpStatus.OK,
        message: 'User was deleted.',
      };
    } else {
      throw new UnauthorizedException(`User isn't logged in.`);
    }
  }
}
