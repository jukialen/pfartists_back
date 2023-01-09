import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';

describe('Files', () => {
  let provider: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    provider = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
