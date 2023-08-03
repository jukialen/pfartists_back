export class PostsDto {
  title: string;
  content: string;
  pseudonym: string;
  profilePhoto: string;
  likes: number;
  liked: boolean;
  shared: number;
  commented: number;
  groupsPostsId: string;
  groupId: string;
  authorId: string;
  postId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}
