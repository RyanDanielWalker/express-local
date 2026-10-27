import 'reflect-metadata';
import { ArgumentsHost, CallHandler, CanActivate, Catch, Controller, ExecutionContext, ForbiddenException, Get, Injectable, Module, NestInterceptor, Param, ParseIntPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, BaseExceptionFilter } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { catchError, throwError } from 'rxjs';
import request from 'supertest';

// Dispatch Desk t2: count failed requests, including ones a global guard rejects.
// A filter sees the guard's exception; an interceptor never does, because the guard runs first.
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);

const counted = { filter: [] as string[], interceptor: [] as string[] };
const url = (c: ArgumentsHost) => c.switchToHttp().getRequest().originalUrl;
@Injectable() class Gate implements CanActivate {
  canActivate(c: ExecutionContext) { if (url(c).startsWith('/admin')) throw new ForbiddenException(); return true; }
}
@Injectable() class CountI implements NestInterceptor {
  intercept(c: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(catchError((e) => { counted.interceptor.push(url(c)); return throwError(() => e); }));
  }
}
@Catch() class CountF extends BaseExceptionFilter {
  catch(e: unknown, host: ArgumentsHost) { counted.filter.push(url(host)); super.catch(e, host); }
}
@Controller() class C {
  @Get('admin') admin() { return 'secret'; }
  @Get('boom') boom() { throw new Error('boom'); }
  @Get('n/:id') n(@Param('id', ParseIntPipe) id: number) { return id; }
}
@Module({ controllers: [C], providers: [
  { provide: APP_GUARD, useClass: Gate }, { provide: APP_INTERCEPTOR, useClass: CountI }, { provide: APP_FILTER, useClass: CountF },
] }) class AppModule {}

const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = m.createNestApplication({ logger: false });
await app.init();
const s = app.getHttpServer();
const a = await request(s).get('/admin');
const b = await request(s).get('/boom');
const c = await request(s).get('/n/abc');
const d = await request(s).get('/no-such-page');
console.log('/admin', a.status, JSON.stringify(a.body), '| /boom', b.status, '| /n/abc', c.status, JSON.stringify(counted));
ok(a.status === 403 && a.body.message === 'Forbidden', 'super.catch() keeps the normal 403 response');
ok(counted.filter.includes('/admin'), 'the filter counts the guard rejection');
ok(!counted.interceptor.includes('/admin'), 'the interceptor never sees the guard rejection');
ok(counted.filter.includes('/boom') && counted.interceptor.includes('/boom'), 'control: both see an error from the handler');
ok(counted.filter.includes('/n/abc'), 'the filter also counts a pipe rejection');
console.log('interceptor saw the pipe rejection:', counted.interceptor.includes('/n/abc'));
// Dispatch Desk t1's why: an interceptor never runs for a URL no route matches; a global filter sees the 404.
ok(d.status === 404 && counted.filter.includes('/no-such-page'), 'the global filter catches the 404 for an unmatched URL');
ok(!counted.interceptor.includes('/no-such-page'), 'the interceptor never sees it');
ok(false, 'SANITY should fail');
await app.close();
done();
