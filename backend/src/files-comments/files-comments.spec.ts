import { Test, TestingModule } from '@nestjs/testing';
import { FilesCommentsService } from './files-comments.service';

describe('FilesComments', () => {
  let provider: FilesCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesCommentsService],
    }).compile();

    provider = module.get<FilesCommentsService>(FilesCommentsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
