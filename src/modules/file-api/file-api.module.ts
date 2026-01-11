import { Module } from "@nestjs/common";
import { FileApiService } from "./file-api.service";
import { FileController } from "./file-api.controller";

//add s3, sqs 
@Module({
  providers: [FileApiService],
  controllers: [FileController],
  exports: [FileApiService],
})
export class FileApiModule {}