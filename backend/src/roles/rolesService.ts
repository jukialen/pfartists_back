import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async getRolesId(role: Role, userId: string, postId: string | null) {
    return this.prisma.roles.findMany({
      where: { AND: [{ role }, { userId }, { postId }] },
      select: { id: true, groupId: true },
    });
  }

  async getRole(roleId: string) {
    return this.prisma.roles.findUnique({
      where: { id: roleId },
      select: { role: true },
    });
  }

  async getMembers(where: Prisma.RolesWhereInput) {
    return this.prisma.roles.findMany({
      where: { AND: [where] },
      select: { userId: true },
    });
  }

  async getGroups(userId: string, role: Role) {
    return this.prisma.roles.findMany({
      where: { AND: [{ userId }, { role }] },
      select: { groupId: true },
    });
  }

  async addRole(data: Prisma.RolesCreateInput) {
    return this.prisma.roles.create({ data });
  }

  async isAdmin(id: string) {
    const { role } = await this.prisma.roles.findUnique({
      where: { id },
      select: { role: true },
    });

    return role === Role.ADMIN;
  }

  async isModerator(id: string) {
    const { role } = await this.prisma.roles.findUnique({
      where: { id },
      select: { role: true },
    });

    return role === Role.MODERATOR;
  }

  async isUser(id: string) {
    const { role } = await this.prisma.roles.findUnique({
      where: { id },
      select: { role: true },
    });

    return role === Role.USER;
  }

  async isAuthor(id: string) {
    const { role } = await this.prisma.roles.findUnique({
      where: { id },
      select: { role: true },
    });

    return role === Role.AUTHOR;
  }

  // e. g. addiction | deletion moderator, deletion group
  async canAddDelete(roleId: string) {
    return await this.isAdmin(roleId);
  }

  async canUpdateGroup(roleId: string) {
    return (await this.isAdmin(roleId)) || (await this.isModerator(roleId));
  }

  async deletePostAndComment(roleId: string) {
    return await this.isAuthor(roleId);
  }

  async canDeletePost(roleId: string) {
    return (
      (await this.isAdmin(roleId)) ||
      (await this.isModerator(roleId)) ||
      (await this.isAuthor(roleId))
    );
  }
}
