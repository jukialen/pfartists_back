enum Type {
  ADMIN,
  MODERATOR,
  USER,
  AUTHOR,
}
class RolesDto {
  name: string;
  type: Type;
  userId?: string;
  groupId?: string;
  postId?: string;
  authorId?: string;
}
