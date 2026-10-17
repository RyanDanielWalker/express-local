import 'reflect-metadata';
import { Body, Controller, Post, Module, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsOptional, IsString } from 'class-validator';
import request from 'supertest';
class D { @IsOptional() @IsString() role: string = 'reader' }
@Controller() class K { @Post() p(@Body() b: D) { return { role: b.role, inst: b instanceof D } } }
@Module({ controllers: [K] }) class M {}
for (const transform of [true, false]) {
  const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ transform })); await app.init();
  console.log('transform', transform, JSON.stringify((await request(app.getHttpServer()).post('/').send({})).body)); await app.close();
}
