import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({  name: "GROUPS" })
export class Groups {
  @PrimaryGeneratedColumn('uuid')
  GROUP_ID: string;

  @Column({ type: 'varchar2', length: 20, unique: true })
  NAME: string;

  @Column({ type: 'varchar2', length: 300 })
  DESCRIPTION: string;

  @Column({ type: 'varchar2', length: 36 })
  ADMIN_ID: string;

  @Column({ type: 'varchar2', length: 36, default: null })
  MODERATORS_ID: string;

  @Column({ type: 'varchar2', length: 36, default: null })
  USERS_ID: string;

  @Column({ type: 'varchar2',length: 36, default: null })
  LOGO_URL: string;
}