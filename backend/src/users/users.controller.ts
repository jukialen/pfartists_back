import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Users as UsersModel } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findALl(@Param('limit') limit: number) {
    return this.usersService.users({ take: limit });
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
