import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // Access for the whole project
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Other modules can take PrismaService
})
export class PrismaModule {}
