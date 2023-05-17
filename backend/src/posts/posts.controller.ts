import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { AuthGuard } from '../auth/auth.guard';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
  ) {}

  @Patch(':title')
  @UseGuards(new AuthGuard())
  async update(
    @Body('data') data: Prisma.PostsUpdateInput,
    @Param('title') title: string,
  ) {
    return this.postsService.updatePost(data, { title });
  }
}
