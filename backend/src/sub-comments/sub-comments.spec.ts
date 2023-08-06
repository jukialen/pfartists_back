import { Test, TestingModule } from '@nestjs/testing';
import { SubCommentsService } from './sub-comments-service';

describe('SubComments', () => {
  let provider: SubCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubCommentsService],
    }).compile();

    provider = module.get<SubCommentsService>(SubCommentsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
