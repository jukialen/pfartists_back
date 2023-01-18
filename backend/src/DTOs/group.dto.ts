export class GroupDto {
  name: string;
  description: string;
  adminId: string;
  moderatorsId: string | null;
  usersId: string | null;
  logoUrl: string | null;
}
