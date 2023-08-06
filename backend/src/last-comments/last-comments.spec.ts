import { Test, TestingModule } from '@nestjs/testing';
import { LastCommentsService } from './last-comments-service';

describe('LastComments', () => {
  let provider: LastCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LastCommentsService],
    }).compile();

    provider = module.get<LastCommentsService>(LastCommentsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
