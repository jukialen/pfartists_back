import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LastCommentsService {
  constructor(private prisma: PrismaService) {}

  async findAllLastComments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.LastCommentsWhereUniqueInput;
    where?: Prisma.LastCommentsWhereInput;
    orderBy?: Prisma.LastCommentsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.lastComments.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async addLastComment(data: Prisma.LastCommentsCreateInput) {
    return this.prisma.lastComments.create({ data });
  }

  async removeLastComment(lastCommentId: string) {
    return this.prisma.lastComments.delete({ where: { lastCommentId } });
  }
}
