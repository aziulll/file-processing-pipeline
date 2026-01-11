import { NestFactory } from '@nestjs/core';
import { ApiModule } from '../api.module';

export async function bootstrapApi() {
  const app = await NestFactory.create(ApiModule);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`API is running on: http://localhost:${port}`);
}