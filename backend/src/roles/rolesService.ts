import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async getGroupRoleId(groupId: string, userId: string) {
    return this.prisma.roles.findFirst({
      where: { AND: [{ groupId }, { userId }, { postId: null }] },
      select: { id: true },
    });
  }

  async getRole(roleId: string) {
    return this.prisma.roles.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        role: true,
        userId: true,
        groupId: true,
        postId: true,
      },
    });
  }

  async getCommentsRoleId(userId: string, fileId?: string, postId?: string) {
    return this.prisma.roles.findFirst({
      where: {
        AND: [{ fileId }, { postId }, { userId }],
      },
      select: { id: true, groupId: !!postId },
    });
  }

  async addRole(data: Prisma.RolesCreateInput) {
    return this.prisma.roles.create({ data });
  }

  async isAdmin(id: string) {
    const { role } = await this.getRole(id);

    return role === Role.ADMIN;
  }

  async isModerator(id: string) {
    const { role } = await this.getRole(id);
    return role === Role.MODERATOR;
  }

  async isAuthor(id: string) {
    const { role } = await this.getRole(id);

    return role === Role.AUTHOR;
  }

  //GROUPS
  async getGroupRole(roleId: string) {
    return this.prisma.roles.findUnique({
      where: { id: roleId },
      select: { role: true },
    });
  }

  async getMembers(
    groupId: string,
    role: Role,
    skip?: number,
    take?: number,
    cursor?: Prisma.RolesWhereUniqueInput,
  ) {
    return this.prisma.roles.findMany({
      skip,
      take,
      cursor,
      where: { AND: [{ groupId }, { role }, { postId: null }] },
      select: {
        userId: true,
      },
    });
  }

  async getGroups(userId: string, role: Role) {
    return this.prisma.roles.findMany({
      where: { AND: [{ userId }, { role }] },
      select: { groupId: true },
    });
  }

  async canUpdateGroup(roleId: string) {
    return (await this.isAdmin(roleId)) || (await this.isModerator(roleId));
  }

  async canDeleteGroup(roleId: string) {
    return await this.isAdmin(roleId);
  }

  async canDeleteGroups(role: Role, userId: string) {
    return this.prisma.roles.findMany({
      where: { AND: [{ role }, { userId }, { postId: null }] },
      select: { id: true, groupId: true },
    });
  }

  //POSTS
  async deleteAuthorPostAndComment(roleId: string) {
    return await this.isAuthor(roleId);
  }

  async canDeletePost(groupId: string, userId: string, postId: string) {
    const { id } = await this.getGroupRoleId(groupId, userId);
    const roleId = await this.prisma.roles.findFirst({
      where: {
        AND: [{ groupId }, { postId }, { userId }, { role: Role.AUTHOR }],
      },
    });

    return (await this.canUpdateGroup(id)) || (await this.isAuthor(roleId.id));
  }
}
