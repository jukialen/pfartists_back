import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async isAdmin(roleId: string) {
    const roleType = await this.prisma.roles.findUnique({
      where: { roleId },
      select: {
        type: true,
      },
    });

    return roleType.type === 'ADMIN';
  }

  async isModerator(roleId: string) {
    const roleType = await this.prisma.roles.findUnique({
      where: { roleId },
      select: {
        type: true,
      },
    });

    return roleType.type === 'MODERATOR';
  }
  async isUser(roleId: string) {
    const roleType = await this.prisma.roles.findUnique({
      where: { roleId },
      select: {
        type: true,
      },
    });

    return roleType.type === 'USER';
  }

  async isAuthor(roleId: string) {
    const roleType = await this.prisma.roles.findUnique({
      where: { roleId },
      select: {
        type: true,
      },
    });

    return roleType.type === 'AUTHOR';
  }

  // e. g. addiction | deletion moderator, deletion group
  async canAddDelete(roleId: string) {
    return await this.isAdmin(roleId);
  }

  async canUpdateGroup(roleId: string) {
    return (await this.isAdmin(roleId)) || (await this.isModerator(roleId));
  }

  async canUpdatePostOrComment(roleId: string) {
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
