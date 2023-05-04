enum Type {
  ADMIN,
  MODERATOR,
  USER,
}
class RolesDto {
  name: string;
  type: Type;
  userId?: string;
  groupId?: string;
  postId?: string;
  authorId?: string;
}
