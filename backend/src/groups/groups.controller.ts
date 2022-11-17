import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Groups as GroupsModel, Prisma } from '@prisma/client';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {};

  @Get()
  findALl(@Param('limit') limit: number) {
    return this.groupsService.groups({ take: limit })
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GroupsModel> {
    return this.groupsService.findGroup({ groupId: id })
  }

  @Post()
  async createGroup(@Body() groupData: { name: string, description: string, adminId: string, owner: Prisma.UsersCreateNestedOneWithoutOwnerInput }): Promise<GroupsModel> {
    return this.groupsService.createGroup(groupData)
  }

  @Patch()
  async updateDescription(@Param('id') id: string, @Param('data') description: string): Promise<GroupsModel> {
    return this.groupsService.updateGroup({
      where: { groupId: id },
      data: { description }
    })
  }

  @Patch()
  async updateLogo(@Param('id') id: string, @Param('data') logoUrl: string): Promise<GroupsModel> {
    return this.groupsService.updateGroup({
      where: { groupId: id },
      data: { logoUrl }
    })
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: GroupsModel): Promise<GroupsModel> {
    return this.groupsService.deleteGroup(id)
  }
}
