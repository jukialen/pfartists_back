import {
  BadRequestException,
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Users } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { deleteUser } from 'supertokens-node';

import { deleted } from '../constants/allCustomsHttpMessages';
import { UserDto } from '../DTOs/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findUser(
    userWhereUniqueInput: Prisma.UsersWhereUniqueInput,
  ): Promise<UserDto | null> {
    const _findOne = await this.prisma.users.findUnique({
      where: userWhereUniqueInput,
    });

    const usersArray: UserDto = {
      id: _findOne.id,
      username: _findOne.username,
      pseudonym: _findOne.pseudonym,
      email: _findOne.email,
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
        email: _u.email,
        description: _u.description,
        profilePhoto: _u.profilePhoto,
        plan: _u.plan,
      });
    }

    return usersArray;
  }

  async createUser(
    data: Prisma.UsersCreateInput,
  ): Promise<string | NotAcceptableException> {
    const salt = await bcrypt.genSalt(15);
    const password = await bcrypt.hash(data.password, salt);

    const user = await this.users({
      where: {
        OR: [
          { email: data.email },
          { pseudonym: data.pseudonym },
          { username: data.username },
        ],
      },
    });

    if (user.length > 0) {
      throw new NotAcceptableException('The user already exists.');
    } else {
      await this.prisma.users.create({ data: { ...data, password } });
      await this.cacheManager.del('users');
      return 'Success!!! User was created.';
    }
  }

  async validateUser(
    data: Prisma.UsersCreateInput,
  ): Promise<UserDto | BadRequestException> {
    try {
      const { email, password } = data;

      console.log('data', data);

      let userData: UserDto | BadRequestException;
      const salt = await bcrypt.genSalt(15);
      const passwordUser = await bcrypt.hash(password, salt);

      const user = () =>
        this.users({
          where: {
            AND: [{ email }, { password: passwordUser }],
          },
        });

      console.log(user);

      await bcrypt.compare(password, passwordUser, function (err, result) {
        console.log(result);
        console.log(err);
        if (!!result) {
          userData[0] = user();
          console.log(userData);
          return userData;
        } else {
          console.error(err);
          userData = new BadRequestException(`Passwords don't pass`);
        }
      });

      console.log(userData);
      return userData;
    } catch (e) {
      console.error(e);
      throw new BadRequestException('bad');
    }
  }

  async updateUser(params: {
    where: Prisma.UsersWhereUniqueInput;
    data: Prisma.UsersUpdateInput;
  }): Promise<Users> {
    const { where, data } = params;

    if (!!data.password) {
      const salt = await bcrypt.genSalt(15);
      const password = await bcrypt.hash(data.password.toString(), salt);

      return this.prisma.users.update({ data: { ...data, password }, where });
    }
    return this.prisma.users.update({ data, where });
  }

  async deleteUser(
    where: Prisma.UsersWhereUniqueInput,
    userId: string,
  ): Promise<HttpException> {
    await this.prisma.users.delete({ where });
    await deleteUser(userId);
    await this.cacheManager.reset();
    return deleted(where.pseudonym);
  }
}
