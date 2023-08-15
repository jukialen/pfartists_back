import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { Cache } from 'cache-manager';

import { UsersGroupsService } from '../users-groups/users-groups.service';

import { deleted } from '../constants/allCustomsHttpMessages';
import { RolesService } from '../roles/rolesService';
import { UserDto } from '../DTOs/user.dto';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private usersGroupsService: UsersGroupsService,
    private postsService: PostsService,
    private rolesService: RolesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findGroup(
    groupWhereUniqueInput: Prisma.GroupsWhereUniqueInput,
    userId: string,
  ) {
    const { name } = groupWhereUniqueInput;
    const join = await this.usersGroupsService.findUserGroup(userId, name);

    if (!!join) {
      const favs = await this.usersGroupsService.getFavsLength(userId);

      const _groupOne = await this.prisma.groups.findUnique({
        where: { groupId: join.groupId },
        select: {
          description: true,
          regulation: true,
          logo: true,
        },
      });

      const { role } = await this.rolesService.getRole(join.roleId);

      const groupDataFromUser = {
        groupId: join.groupId,
        description: _groupOne.description,
        regulation: _groupOne.regulation,
        logo: _groupOne.logo,
        favorites: favs.favLength,
        favorited: join.favorite,
        usersGroupId: join.usersGroupsId,
        role,
        roleId: join.roleId,
      };

      await this.cacheManager.set(`groupOne: ${name}`, groupDataFromUser);

      return groupDataFromUser;
    } else {
      const _groupOne = await this.prisma.groups.findUnique({
        where: { name },
        select: {
          groupId: true,
          description: true,
          regulation: true,
          logo: true,
        },
      });

      const { roleId, usersGroupsId, favorite } =
        await this.usersGroupsService.findUserGroup(userId, name);

      const { role } = await this.rolesService.getRole(roleId);

      const groupData = {
        groupId: _groupOne.groupId,
        description: _groupOne.description,
        regulation: _groupOne.regulation,
        logo: _groupOne.logo,
        favorite,
        usersGroupsId,
        role,
        roleId,
      };

      await this.cacheManager.set(
        `groupOne: ${groupWhereUniqueInput.name}`,
        groupData,
      );
      return groupData;
    }
  }

  async groups(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GroupsWhereUniqueInput;
    where?: Prisma.GroupsWhereInput;
    orderBy?: Prisma.GroupsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    const groupsArray: {
      name: string;
      logo: string;
      usersGroupsId: string;
      groupId: string;
    }[] = [];

    const _groupsArray = await this.prisma.groups.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      select: {
        name: true,
        logo: true,
        groupId: true,
        usersGroups: {
          select: {
            usersGroupsId: true,
          },
        },
      },
    });

    for (const _g of _groupsArray) {
      groupsArray.push({
        name: _g.name,
        logo: _g.logo,
        usersGroupsId: _g.usersGroups[0].usersGroupsId,
        groupId: _g.groupId,
      });
    }
    return groupsArray;
  }

  async findMembers(groupId: string, role: Role) {
    const data = await this.rolesService.getMembers({
      AND: [{ groupId }, { role }, { postId: null }],
    });

    const membersArray: UserDto[] = [];

    for (const _d of data) {
      const userData = await this.prisma.users.findUnique({
        where: { id: _d.userId },
        select: {
          pseudonym: true,
          profilePhoto: true,
        },
      });
      membersArray.push(userData);
    }

    return membersArray;
  }

  async findMyGroups(userId: string, role: Role) {
    const groupsArray: { name: string; logo: string; groupId: string }[] = [];
    const data = await this.rolesService.getGroups(userId, role);

    for (const _g of data) {
      const groupData = await this.prisma.groups.findUnique({
        where: { groupId: _g.groupId },
      });
      groupsArray.push({
        name: groupData.groupId,
        logo: groupData.logo,
        groupId: groupData.groupId,
      });
    }

    return groupsArray;
  }

  async createGroup(
    data: Prisma.GroupsCreateInput &
      Prisma.UsersGroupsUncheckedCreateInput & { userId: string },
  ) {
    const { name, description, logo, userId } = data;

    const group = await this.findGroup({ name }, userId);

    if (!!group) {
      throw new NotAcceptableException('The group already exists.');
    } else {
      const userData = await this.prisma.groups.create({
        data: {
          name,
          description,
          logo,
          adminId: userId,
        },
        select: { name: true, groupId: true },
      });

      const role = await this.rolesService.addRole({
        groupId: userData.groupId,
        role: Role.ADMIN,
        userId: data.userId,
      });

      await this.usersGroupsService.createRelation({
        name,
        groupId: userData.groupId,
        roleId: role.id,
        userId,
      });

      return `Success!!! The group was created.`;
    }
  }

  async updateGroup(params: {
    data: Prisma.GroupsUpdateInput & Prisma.UsersGroupsUncheckedUpdateInput;
    userId: string;
    name: string;
  }) {
    const { data, userId, name } = params;

    const { usersGroupsId, roleId } =
      await this.usersGroupsService.findUserGroup(userId, name);

    const role = await this.rolesService.canUpdateGroup(roleId);

    if (role) {
      const upUsGr = this.usersGroupsService.updateRelation(data, {
        usersGroupsId,
      });

      const upGr = this.prisma.groups.update({
        data,
        where: { name: data.name.toString() },
      });

      if (data === data.name && data.name === name) {
        throw new BadRequestException('only the same group name');
      }

      if (data === data.name && data.name !== name) {
        await upUsGr;
        return upGr;
      }

      if (data.roleId || data.favorite) return upUsGr;

      return upGr;
    } else {
      throw new UnauthorizedException('You are neither admin nor moderator.');
    }
  }

  async deleteGroup(name: string, roleId: string) {
    const role = await this.rolesService.canAddDelete(roleId);

    if (!!role) {
      await this.cacheManager.del('groups');
      await this.cacheManager.del('groupOne');
      await this.cacheManager.del('usersGroupOne');
      const { groupId } = await this.prisma.groups.delete({
        where: { name },
        select: { groupId: true },
      });
      await this.usersGroupsService.deleteRelationsForOnlyDeletedGroup(name);
      await this.postsService.deletePosts(groupId);
      return deleted(name);
    } else {
      throw new UnauthorizedException("You aren't admin.");
    }
  }

  async deleteGroups(userId: string) {
    const role = await this.rolesService.getRolesId(Role.ADMIN, userId, null);

    if (!!role) {
      for (const _r of role) {
        await this.postsService.deletePosts(_r.groupId);
        await this.usersGroupsService.deleteRelations(_r.groupId, userId);
      }
      await this.prisma.groups.deleteMany({ where: { adminId: userId } });
    } else {
      throw new UnauthorizedException("You aren't admin.");
    }
  }
}
