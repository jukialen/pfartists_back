import {
  CACHE_MANAGER,
  HttpStatus,
  Inject,
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { deleteUser } from 'supertokens-node';
import { SessionContainer } from 'supertokens-node/recipe/session';

import { FriendsService } from '../friends/friends.service';
import { GroupsService } from '../groups/groups.service';
import { FilesService } from '../files/files.service';

import { FriendDto } from '../DTOs/friend.dto';
import { deleted } from '../constants/allCustomsHttpMessages';

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
        id: true,
        pseudonym: true,
        all_auth_recipe_users: {
          select: {
            user_id: true,
          },
        },
        description: true,
        profilePhoto: true,
        plan: true,
      },
    });

    await this.cacheManager.set('userOne', _findOne);
    return _findOne;
  }

  async findAllUsers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UsersWhereUniqueInput;
    where?: Prisma.UsersWhereInput;
    orderBy?: Prisma.UsersOrderByWithRelationInput;
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
    const user = await this.findAllUsers({
      where: { pseudonym: data.pseudonym },
    });

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
    data: Prisma.UsersUpdateInput & { file?: Express.Multer.File };
  }) {
    const { where, data } = params;

    const user = await this.prisma.users.findUnique({
      where: { pseudonym: data.pseudonym.toString() },
    });

    if (!!data.profilePhoto) {
      const _file = await this.filesService.findProfilePhoto({
        AND: [{ name: user.profilePhoto }, { profileType: true }],
      });

      await this.filesService.updateProfilePhoto(
        data.file,
        _file.fileId,
        user.id,
        _file.shortDescription,
      );

      return this.prisma.users.update({
        where: { id: user.id },
        data: { profilePhoto: data.file.originalname },
      });
    } else {
      return this.prisma.users.update({ data, where });
    }
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
      await this.groupsService.deleteGroups(userId);

      await this.prisma.files.deleteMany({ where: { authorId: userId } });

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
