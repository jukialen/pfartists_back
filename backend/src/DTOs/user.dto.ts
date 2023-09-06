export class UserDto {
  id?: string;
  username?: string;
  pseudonym: string;
  email?: string;
  description?: string;
  profilePhoto?: string;
  plan?: string;
}

export class MembersDto {
  usersGroupsId?: string;
  pseudonym: string;
  profilePhoto?: string;
}
