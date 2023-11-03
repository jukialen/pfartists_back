import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

import { deleted } from '../constants/allCustomsHttpMessages';
import { MembersDto } from '../DTOs/user.dto';
import { GroupDto } from '../DTOs/group.dto';

import { PostsService } from '../posts/posts.service';
import { RolesService } from '../roles/rolesService';
import { UsersGroupsService } from '../users-groups/users-groups.service';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private usersGroupsService: UsersGroupsService,
    private postsService: PostsService,
    private rolesService: RolesService,
  ) {}

  async findGroup(
    groupWhereUniqueInput: Prisma.GroupsWhereUniqueInput,
    userId: string,
  ) {
    const { name } = groupWhereUniqueInput;

    const join = await this.usersGroupsService.findUserGroup(userId, name);

    const favs = await this.usersGroupsService.getFavsLength(userId);

    if (!!join) {
      const _groupOne = await this.prisma.groups.findUnique({
        where: { groupId: join.groupId },
        select: {
          description: true,
          regulation: true,
          logo: true,
        },
      });

      const { role } = await this.rolesService.getRole(join.roleId);

      const groupDataFromUser: GroupDto = {
        groupId: join.groupId,
        description: _groupOne.description,
        regulation: _groupOne.regulation,
        logo: _groupOne.logo,
        favorites: favs.favLength,
        favorited: join.favorite,
        usersGroupsId: join.usersGroupsId,
        role,
        roleId: join.roleId,
      };

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

      const { roleId, usersGroupsId } =
        await this.usersGroupsService.findUserGroup(userId, name);

      const { role } = await this.rolesService.getRole(roleId);

      const groupData: GroupDto = {
        groupId: _groupOne.groupId,
        description: _groupOne.description,
        regulation: _groupOne.regulation,
        logo: _groupOne.logo,
        favorites: favs.favLength,
        usersGroupsId,
        role,
        roleId,
      };

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

  async findMembers(
    groupId: string,
    role: Role,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.RolesWhereUniqueInput;
    },
  ) {
    const { skip, take, cursor } = params;

    const data = await this.rolesService.getMembers(
      groupId,
      role,
      skip,
      take,
      cursor,
    );

    const membersArray: MembersDto[] = [];

    for (const _d of data) {
      const userData = await this.prisma.users.findUnique({
        where: { id: _d.userId },
        select: {
          pseudonym: true,
          profilePhoto: true,
        },
      });

      const ugId = await this.prisma.usersGroups.findFirst({
        where: { AND: [{ userId: _d.userId }, { groupId }] },
        select: { usersGroupsId: true, roleId: true },
      });

      membersArray.push({
        usersGroupsId: ugId.usersGroupsId,
        pseudonym: userData.pseudonym,
        profilePhoto: userData.profilePhoto,
      });
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
        name: groupData.name,
        logo: groupData.logo,
        groupId: groupData.groupId,
      });
    }

    return groupsArray;
  }

  async findFavoritesGroups(userId: string) {
    const favoritesGroups: {
      name: string;
      description: string;
      logo: string;
    }[] = [];

    const groups = await this.usersGroupsService.findFavoritesGroups(userId);

    for (const _f of groups) {
      const _favGroups = await this.prisma.groups.findUnique({
        where: { name: _f.name },
      });

      favoritesGroups.push({
        description: _favGroups.description,
        logo: _favGroups.logo,
        name: _favGroups.name,
      });
    }
    return favoritesGroups;
  }
  async createGroup(data: Prisma.GroupsCreateInput) {
    const { name, description, regulation, logo, adminId } = data;

    const group = await this.usersGroupsService.findUserGroup(adminId, name);

    if (!!group) {
      throw new NotAcceptableException('The group already exists.');
    } else {
      const userData = await this.prisma.groups.create({
        data: {
          name,
          description,
          regulation,
          logo,
          adminId,
        },
        select: { groupId: true },
      });

      const role = await this.rolesService.addRole({
        groupId: userData.groupId,
        role: Role.ADMIN,
        userId: adminId,
      });

      await this.usersGroupsService.createRelation({
        name,
        groupId: userData.groupId,
        roleId: role.id,
        userId: adminId,
      });

      return `Success!!! The group was created.`;
    }
  }

  async updateGroup(params: {
    data: Prisma.GroupsUpdateInput;
    userId: string;
    name: string;
  }) {
    const { data, userId, name } = params;

    const { roleId, usersGroupsId } =
      await this.usersGroupsService.findUserGroup(userId, name);

    const adminRole = await this.rolesService.isAdmin(roleId);

    if (data.name === name) {
      throw new BadRequestException('only the same group name');
    }

    if (!!adminRole) {
      if (data.name !== name) {
        await this.prisma.groups.update({
          data: { name: data.name },
          where: { name },
        });

        return this.usersGroupsService.updateRelation(
          { name: data.name },
          { usersGroupsId },
        );
      }

      if (data.adminId === userId) {
        throw new UnauthorizedException('the same user id');
      } else {
        await this.updateRole('ADMIN', name, userId);
      }
    } else {
      throw new UnauthorizedException('You are neither admin nor moderator.');
    }
  }

  async updateRole(role: Role, name: string, userId: string) {
    const { roleId } = await this.usersGroupsService.findUserGroup(
      userId,
      name,
    );
    const groupRole = await this.rolesService.canUpdateGroup(roleId);

    if (groupRole) {
      await this.rolesService.updateRole(role, roleId);
    } else {
      throw new UnauthorizedException('You are neither admin nor moderator.');
    }
  }

  async toggleFavs(roleId: string, favs: boolean, usersGroupsId: string) {
    const groupRole = await this.rolesService.canUpdateGroup(roleId);

    if (groupRole) {
      await this.prisma.usersGroups.update({
        data: { favorite: favs },
        where: { usersGroupsId },
      });
    } else {
      throw new UnauthorizedException('You are neither admin nor moderator.');
    }
  }

  async joinUser(name: string, groupId: string, userId: string) {
    const role = await this.rolesService.addRole({
      groupId,
      userId,
    });

    return this.usersGroupsService.createRelation({
      name,
      groupId,
      userId,
      roleId: role.id,
    });
  }

  async deleteGroup(name: string, groupId: string, roleId: string) {
    const role = await this.rolesService.canDeleteGroup(roleId);

    if (!!role) {
      await this.postsService.deletePosts(groupId);
      await this.usersGroupsService.deleteRelationsForOnlyDeletedGroup(name);
      await this.prisma.groups.delete({
        where: { name },
        select: { groupId: true },
      });
      return deleted(name);
    } else {
      throw new UnauthorizedException("You aren't admin.");
    }
  }

  async deleteUserFromGroup(usersGroupsId: string) {
    return this.prisma.usersGroups.delete({ where: { usersGroupsId } });
  }

  async deleteGroups(userId: string) {
    const role = await this.rolesService.canDeleteGroups(Role.ADMIN, userId);

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
