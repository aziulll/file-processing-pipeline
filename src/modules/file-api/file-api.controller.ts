import { Controller, Post, Req } from '@nestjs/common';
import { FileApiService } from './file-api.service';

@Controller('files')
export class FileController {

  constructor(
    private readonly fileApiService: FileApiService,
  ) {}

  @Post()
  async upload(@Req() req) {
    return this.fileApiService.createAndEnqueue(req.user.id);
  }
}
