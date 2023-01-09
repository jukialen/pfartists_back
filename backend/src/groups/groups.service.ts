import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Groups, Prisma } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findGroup(
    groupWhereUniqueInput: Prisma.GroupsWhereUniqueInput,
  ): Promise<Groups | null> {
    return this.prisma.groups.findUnique({
      where: groupWhereUniqueInput,
    });
  }

  async groups(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GroupsWhereUniqueInput;
    where?: Prisma.GroupsWhereInput;
    orderBy?: Prisma.GroupsOrderByWithRelationInput;
  }): Promise<Groups[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.groups.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createGroup(data: Prisma.GroupsCreateInput): Promise<Groups> {
    return this.prisma.groups.create({
      data,
    });
  }

  async updateGroup(params: {
    where: Prisma.GroupsWhereUniqueInput;
    data: Prisma.GroupsUpdateInput;
  }): Promise<Groups> {
    const { where, data } = params;
    return this.prisma.groups.update({
      data,
      where,
    });
  }

  async deleteGroup(where: Prisma.GroupsWhereUniqueInput): Promise<Groups> {
    return this.prisma.groups.delete({
      where,
    });
  }
}
