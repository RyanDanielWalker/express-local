import 'reflect-metadata';
import { Controller, Get, Module, NotFoundException, Catch, ExceptionFilter, ArgumentsHost, ConsoleLogger } from '@nestjs/common';
import { BaseExceptionFilter, APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
@Catch() class Ext extends BaseExceptionFilter { catch(e: any, h: ArgumentsHost) { super.catch(e, h) } }
@Catch() class Rethrow implements ExceptionFilter { catch(e: any) { throw e } }
@Controller() class K { @Get('nf') a() { throw new NotFoundException('Order 99 not found') } }
@Module({ controllers: [K] }) class M {}
class L extends ConsoleLogger { error() {} log() {} }
async function go(name: string, setup: (app: any) => void, providers: any[] = []) {
  @Module({ imports: [M], providers }) class Root {}
  const app = (await Test.createTestingModule({ imports: [Root] }).compile()).createNestApplication({ logger: new L() });
  setup(app); await app.init();
  const r = await request(app.getHttpServer()).get('/nf'); console.log(name, r.status, r.type, JSON.stringify(r.body).slice(0, 80), r.text.slice(0, 60).replace(/\n/g, ' ')); await app.close();
}
await go('bare new Ext', a => a.useGlobalFilters(new Ext()));
await go('new Ext(httpAdapter)', a => a.useGlobalFilters(new Ext(a.get(HttpAdapterHost).httpAdapter)));
await go('APP_FILTER Ext', () => {}, [{ provide: APP_FILTER, useClass: Ext }]);
await go('rethrow', a => a.useGlobalFilters(new Rethrow()));
