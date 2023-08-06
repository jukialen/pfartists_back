import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubCommentsService {
  constructor(private prisma: PrismaService) {}

  async findAllSubComments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SubCommentsWhereUniqueInput;
    where?: Prisma.SubCommentsWhereInput;
    orderBy?: Prisma.SubCommentsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.subComments.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async addSubComment(data: Prisma.SubCommentsCreateInput) {
    return this.prisma.subComments.create({ data });
  }

  async removeSubComment(subCommentId: string) {
    return this.prisma.subComments.delete({ where: { subCommentId } });
  }
}
