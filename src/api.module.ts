import { Module } from '@nestjs/common';
import { FileApiModule } from './modules/file-api/file-api.module';

@Module({
    imports: [FileApiModule]
})

export class ApiModule { }