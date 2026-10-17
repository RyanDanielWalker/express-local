import 'reflect-metadata';
import { Body, Controller, Post, Module, ValidationPipe, Get, Param, Query } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString, ValidateNested, IsObject, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import request from 'supertest';
class AddressDto { @IsString() city!: string }
class A { @ValidateNested() @Type(() => AddressDto) address!: AddressDto }
class B { @ValidateNested() address!: AddressDto }
class C { @IsObject() @Type(() => AddressDto) address!: AddressDto }
class Age { @IsInt() age!: number }
@Controller() class K {
  @Post('a') a(@Body() b: A) { return 'ok' } @Post('b') b(@Body() b: B) { return 'ok' } @Post('c') c(@Body() b: C) { return 'ok' }
  @Post('age') age(@Body() b: Age) { return { t: typeof b.age } }
  @Get('q') q(@Query('n') n: number) { return { t: typeof n } }
}
@Module({ controllers: [K] }) class M {}
for (const opts of [{ transform: true }, { transform: true, transformOptions: { enableImplicitConversion: true } }, { transformOptions: { enableImplicitConversion: true } }]) {
  const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe(opts)); await app.init(); const s = app.getHttpServer();
  console.log(JSON.stringify(opts));
  for (const p of ['a', 'b', 'c']) { const r = await request(s).post('/' + p).send({ address: { city: 5 } }); console.log('  nested', p, r.status, JSON.stringify(r.body.message ?? r.body)); }
  const r = await request(s).post('/age').send({ age: '30' }); console.log('  age "30"', r.status, JSON.stringify(r.body));
  const q = await request(s).get('/q?n=5'); console.log('  @Query n', q.status, JSON.stringify(q.body));
  await app.close();
}
