import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

import { UsersService } from '../users/users.service';

import { UserDto } from 'src/DTOs/user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(
    res: Response,
    data: Prisma.UsersCreateInput,
  ): Promise<{ message: string }> {
    try {
      console.log(data);
      console.log(this.usersService);
      // console.log(res);
      // const userData = await this.usersService.validateUser(data);
      // console.log(userData);

      // if (!(userData instanceof BadRequestException)) {
      // const session = await createNewSession(res, userData.id);
      // console.log(session);
      // }

      return { message: 'User logged in!' };
    } catch (e) {
      console.error('e', e);
    }
  }
}
