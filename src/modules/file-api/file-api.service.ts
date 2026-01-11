import { Injectable } from "@nestjs/common";

@Injectable()
export class FileApiService {
  async createAndEnqueue(ownerId: string) {
    return { message: `File created and enqueued for owner ${ownerId}` };
  } 
}