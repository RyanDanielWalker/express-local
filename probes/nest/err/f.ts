import 'reflect-metadata';
import { Controller, Get, Module, NotFoundException, Catch, ExceptionFilter, ArgumentsHost, HttpException, Logger, ConsoleLogger, BadRequestException } from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(err: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;
    const ctx = host.switchToHttp();
    const isHttp = err instanceof HttpException;
    const status = isHttp ? err.getStatus() : 500;
    if (!isHttp) this.logger.error(err); // this filter replaces Nest's logging
    httpAdapter.reply(ctx.getResponse(), {
      ok: false,
      status,
      detail: isHttp ? err.getResponse() : 'Internal server error',
    }, status);
  }
}

@Controller() class K {
  @Get('nf') a() { throw new NotFoundException('User 7 not found') }
  @Get('boom') b() { throw new Error('db password is hunter2') }
  @Get('val') c() { throw new BadRequestException(['email must be an email']) }
}
@Module({ controllers: [K], providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }] }) class M {}
const logs: string[] = [];
class L extends ConsoleLogger { error(m: any) { logs.push('ERROR ' + String(m)) } log() {} }
const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication({ logger: new L() });
await app.init(); const s = app.getHttpServer();
for (const p of ['nf', 'boom', 'val']) { const r = await request(s).get('/' + p); console.log(p, r.status, JSON.stringify(r.body)); }
console.log(logs);
