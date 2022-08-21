import { Controller, Get, Post, Body, Patch, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { Users } from './users.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {};

  @Get()
  findALl() {
      return this.usersService.getAll()
    }

  @Get(":id")
    getOneUser(@Body() { ID }: Users) {
      return this.usersService.getOne(ID)
    }

  @Post()
  async create(@Body() user: Users) {
    return this.usersService.createUser(user)
  }

  @Patch(':id')
  async update(@Body() user: Users) {
    return this.usersService.updateUser(user)
  }

  @Delete(':id')
 async delete(@Body() { ID }: Users) {
  return await this.usersService.deleteUser(ID)
 }
}
