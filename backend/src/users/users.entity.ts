import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({  name: 'USERS' })
export class Users {
  @PrimaryGeneratedColumn('uuid')
  ID: string;

  @Column({ type: 'varchar2', length: 20, default: null })
  USERNAME: string;
  
  @Column({ type: 'varchar2', length: 30, unique: true, default: null })
  PSEUDONYM: string;
  
  @Column({ type: 'varchar2', length: 50, unique: true })
  EMAIL: string;

  @Column({ type: 'varchar2', length: 100 })
  PASSWORD: string;

  @Column({ type: 'varchar2', length: 300, default: null })
  DESCRIPTION: string;
  
  @Column({ type: 'varchar2', length: 200, default: null })
  PROFILE_PHOTO: string;
}