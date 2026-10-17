import 'reflect-metadata';
import { Controller, Get, Module, MiddlewareConsumer, NestModule, Catch, ExceptionFilter, ArgumentsHost, UseFilters, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
@Catch() class RouteF implements ExceptionFilter { catch(e: any, h: ArgumentsHost) { h.switchToHttp().getResponse().status(418).json({ by: 'route filter' }) } }
@Catch() class GlobalF implements ExceptionFilter { catch(e: any, h: ArgumentsHost) { h.switchToHttp().getResponse().status(499).json({ by: 'global filter' }) } }
@UseFilters(RouteF) @Controller('x') class C { @Get() g() { return 'ok' } }
@Module({ controllers: [C] }) class M implements NestModule { configure(c: MiddlewareConsumer) { c.apply((_q: any, _r: any, _n: any) => { throw new BadRequestException('mw') }).forRoutes('*') } }
for (const g of [false, true]) {
  const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication({ logger: false });
  if (g) app.useGlobalFilters(new GlobalF()); await app.init();
  const r = await request(app.getHttpServer()).get('/x'); console.log('global filter?', g, '->', r.status, JSON.stringify(r.body)); await app.close();
}
