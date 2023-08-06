import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';

describe('Comments', () => {
  let provider: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentsService],
    }).compile();

    provider = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
