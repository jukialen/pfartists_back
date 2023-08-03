import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Cache } from 'cache-manager';

import { PostsDto } from '../DTOs/posts.dto';

import { PostsService } from '../posts/posts.service';
import { RolesService } from '../roles/rolesService';
import { LikedService } from '../liked/liked.service';

@Injectable()
export class GroupsPostsService {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
    private rolesService: RolesService,
    private likedService: LikedService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findRelations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GroupsPostsWhereUniqueInput;
    where?: Prisma.GroupsPostsWhereInput;
    orderBy?: Prisma.GroupsPostsOrderByWithRelationInput;
    userId: string;
  }) {
    const { skip, take, cursor, where, orderBy, userId } = params;

    const relationsArray: PostsDto[] = [];
    const rels = await this.prisma.groupsPosts.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        posts: true,
        liked: {
          select: {
            userId: true,
          },
        },
        users: {
          select: {
            pseudonym: true,
            profilePhoto: true,
          },
        },
      },
    });

    for (const rel of rels) {
      relationsArray.push({
        title: rel.posts.title,
        content: rel.posts.content,
        pseudonym: rel.users.pseudonym,
        profilePhoto: rel.users.profilePhoto,
        likes: rel.posts.likes,
        liked: await this.likedService.liked(userId, rel.postId),
        shared: rel.posts.shared,
        commented: rel.posts.commented,
        groupsPostsId: rel.groupsPostsId,
        groupId: rel.groupId,
        authorId: rel.authorId,
        postId: rel.postId,
        roleId: rel.roleId,
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt,
      });
    }

    return relationsArray;
  }

  async findRegulation(postId: string) {
    const post = await this.postsService.findPost(postId);
    const groupPost = await this.prisma.groupsPosts.findUnique({
      where: { postId },
      include: {
        liked: {
          where: { postId },
          select: { userId: true },
        },
        users: {
          select: {
            pseudonym: true,
            profilePhoto: true,
          },
        },
      },
    });

    const postArray: PostsDto = {
      title: post.title,
      content: post.content,
      commented: post.commented,
      pseudonym: groupPost.users.pseudonym,
      profilePhoto: groupPost.users.profilePhoto,
      likes: post.likes,
      liked: await this.likedService.liked(groupPost.authorId, postId),
      shared: post.shared,
      groupId: groupPost.groupId,
      authorId: groupPost.authorId,
      roleId: groupPost.roleId,
      createdAt: groupPost.createdAt,
      updatedAt: groupPost.updatedAt,
      postId,
      groupsPostsId: groupPost.groupsPostsId,
    };

    await this.cacheManager.set('groups-posts-one', postArray);
    return postArray;
  }

  async createRelation(
    data: Prisma.GroupsPostsUncheckedCreateInput & Prisma.PostsCreateInput,
    userId: string,
  ) {
    const { title, content, groupId } = data;
    const post = await this.postsService.createPost({
      title,
      content,
    });
    const role = await this.rolesService.getRoleId('AUTHOR');

    return this.prisma.groupsPosts.create({
      data: {
        groupId,
        postId: post.postId,
        authorId: userId,
        roleId: role.roleId,
      },
    });
  }

  async updateRelation(
    data: Prisma.GroupsPostsUpdateInput,
    where: Prisma.GroupsPostsWhereUniqueInput,
  ) {
    await this.cacheManager.del('groups-posts');
    await this.cacheManager.del('groups-posts-one');
    return this.prisma.groupsPosts.update({ data, where });
  }

  async deleteRelation(where: Prisma.GroupsPostsWhereUniqueInput) {
    await this.cacheManager.del('groups-posts');
    await this.cacheManager.del('groups-posts-one');

    await this.postsService.deletePost({ postId: where.postId });
    return this.prisma.groupsPosts.delete({ where });
  }
}
