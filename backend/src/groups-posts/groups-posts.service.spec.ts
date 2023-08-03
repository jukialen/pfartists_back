import { Test, TestingModule } from '@nestjs/testing';
import { GroupsPostsService } from './groups-posts.service';

describe('GroupsPostsService', () => {
  let service: GroupsPostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsPostsService],
    }).compile();

    service = module.get<GroupsPostsService>(GroupsPostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
