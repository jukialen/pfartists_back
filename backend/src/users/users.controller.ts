import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma, Users as UsersModel } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findALl(
    @Query('orderBy') orderBy?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('where') where?: Prisma.UsersWhereInput,
    @Query('cursor') cursor?: Prisma.UsersWhereUniqueInput,
  ) {
    const orderArray: object[] = [];
    const order = orderBy.split(', ');

    for (const or of order) {
      const data = or.replace(/(\w+:)|(\w+ :)/g, function (s) {
        return '"' + s.substring(0, s.length - 1) + '":';
      });

      const obj: Prisma.UsersOrderByWithRelationInput = await JSON.parse(data);

      orderArray.push(obj);
    }

    return await this.usersService.users({
      take: parseInt(limit) || undefined,
      orderBy: orderArray || undefined,
      skip: parseInt(skip) || undefined,
      cursor: cursor || undefined,
      where: where || undefined,
    });
  }

  @Get(':id')
  async getOneUser(@Param('id') id: string): Promise<UsersModel> {
    return this.usersService.findUser({ id });
  }

  @Post()
  async signUp(
    @Body() userData: { email: string; password: string },
  ): Promise<UsersModel> {
    return this.usersService.createUser(userData);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Param('data') data: string,
  ): Promise<UsersModel> {
    return this.usersService.updateUser({
      where: { id },
      data: { username: data },
    });
  }

  @Patch(':id')
  async updatePassword(
    @Param('id') id: string,
    @Param('data') password: string,
  ): Promise<UsersModel> {
    return this.usersService.updateUser({
      where: { id },
      data: { password },
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: UsersModel): Promise<UsersModel> {
    return await this.usersService.deleteUser(id);
  }
}
