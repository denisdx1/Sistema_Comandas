import { Module } from '@nestjs/common';
import { CombosService } from './combos.service';
import { CombosController } from './combos.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CombosController],
  providers: [CombosService, PrismaService],
  exports: [CombosService]
})
export class CombosModule {} 