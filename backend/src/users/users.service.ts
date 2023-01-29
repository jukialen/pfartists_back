import {
  CACHE_MANAGER,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Users } from '@prisma/client';
import { Cache } from 'cache-manager';
import { deleteUser } from 'supertokens-node';
import { SessionContainer } from 'supertokens-node/recipe/session';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { deleted } from '../constants/allCustomsHttpMessages';
import { UserDto } from '../DTOs/user.dto';
import { FriendsService } from '../friends/friends.service';
import { GroupsService } from '../groups/groups.service';
import { FilesService } from '../files/files.service';
import { FriendDto } from '../DTOs/friend.dto';
import { GroupDto } from '../DTOs/group.dto';
import { FileDto } from '../DTOs/file.dto';
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

  async findUser(
    session: SessionContainer,
    userWhereUniqueInput: Prisma.UsersWhereUniqueInput,
  ): Promise<UserDto | null> {
    const accessTokenPayload = session.getAccessTokenPayload();
    const { email } = accessTokenPayload.customClaim;

    const _findOne = await this.prisma.users.findUnique({
      where: userWhereUniqueInput,
    });

    const usersArray: UserDto = {
      id: _findOne.id,
      username: _findOne.username,
      pseudonym: _findOne.pseudonym,
      email,
      description: _findOne.description,
      profilePhoto: _findOne.profilePhoto,
      plan: _findOne.plan,
    };

    await this.cacheManager.set('userOne', usersArray, 0);
    return usersArray || null;
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsersWhereUniqueInput;
    where?: Prisma.UsersWhereInput;
    orderBy?: Prisma.UsersOrderByWithRelationInput[];
  }): Promise<UserDto[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const usersArray: UserDto[] = [];

    const _users = await this.prisma.users.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });

    for (const _u of _users) {
      usersArray.push({
        id: _u.id,
        username: _u.username,
        pseudonym: _u.pseudonym,
        description: _u.description,
        profilePhoto: _u.profilePhoto,
        plan: _u.plan,
      });
    }

    return usersArray;
  }

  async updateUser(params: {
    where: Prisma.UsersWhereUniqueInput;
    data: Prisma.UsersUpdateInput;
  }): Promise<Users> {
    const { where, data } = params;
    return this.prisma.users.update({ data, where });
  }

  async updatePassword(userId: string, newPassword: string) {
    await ThirdPartyEmailPassword.updateEmailOrPassword({
      userId,
      password: newPassword,
    });
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
        where: { adminId: userId },
      });
      if (groups.length !== 0) {
        for (const group of groups) {
          await this.groupsService.deleteGroup({ adminId: group.adminId });
        }
      }
      const files: FileDto[] = await this.filesService.files({
        where: { ownerFile: userId },
      });
      if (files.length !== 0) {
        for (const file of files) {
          await this.filesService.removeFile(file.name, { ownerFile: userId });
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
