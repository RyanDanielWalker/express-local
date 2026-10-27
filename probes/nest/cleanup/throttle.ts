import 'reflect-metadata';
import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException,
  CallHandler, CanActivate, Controller, ExecutionContext, Get, Injectable, MiddlewareConsumer, Module,
  NestInterceptor, NestMiddleware, NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';

// Proves the @nestjs/throttler claims on Dispatch Desk (a sort card and a question's why),
// and the guard-versus-middleware clause on Main Line's rate-limit flow note.
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);
const seen: string[] = [];

@Controller()
class Ctl {
  @Get('orders') orders() { seen.push('handler'); return 'orders'; }
  @SkipThrottle() @Get('health') health() { seen.push('handler'); return 'ok'; }
}
@Injectable() class Log implements NestInterceptor {
  intercept(_c: ExecutionContext, next: CallHandler) { seen.push('interceptor'); return next.handle(); }
}
// Runs after ThrottlerGuard (APP_GUARDs run in the order they are listed).
@Injectable() class Later implements CanActivate { canActivate() { seen.push('later guard'); return true; } }

async function main() {
  // --- ThrottlerGuard bound globally with APP_GUARD, 2 requests a minute.
  @Module({
    imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 2 }] })],
    controllers: [Ctl],
    providers: [
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: APP_GUARD, useClass: Later },
      { provide: APP_INTERCEPTOR, useClass: Log },
    ],
  })
  class GuardApp {}
  const app = (await Test.createTestingModule({ imports: [GuardApp] }).compile()).createNestApplication();
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  await app.init();
  const s = app.getHttpServer();
  const codes: number[] = [];
  for (let i = 0; i < 3; i++) codes.push((await request(s).get('/orders').set('X-Forwarded-For', '1.1.1.1')).status);
  console.log('/orders x3 from 1.1.1.1 ->', codes.join(' '));
  ok(codes.join() === '200,200,429', 'a global ThrottlerGuard answers 429 once the limit is used up');
  seen.length = 0;
  const blocked = await request(s).get('/orders').set('X-Forwarded-For', '1.1.1.1');
  console.log('blocked request saw:', JSON.stringify(seen), blocked.status, JSON.stringify(blocked.body));
  ok(blocked.status === 429 && seen.length === 0, 'a throttled request stops at the guard: no later guard, interceptor or handler runs');
  const other = await request(s).get('/orders').set('X-Forwarded-For', '2.2.2.2');
  ok(other.status === 200, 'another IP has its own count (the default tracker is req.ip)');
  const health: number[] = [];
  for (let i = 0; i < 5; i++) health.push((await request(s).get('/health').set('X-Forwarded-For', '1.1.1.1')).status);
  console.log('/health x5 from the throttled IP ->', health.join(' '));
  ok(health.every((c) => c === 200), '@SkipThrottle() exempts a route, even for an IP that is already throttled');
  seen.length = 0;
  await request(s).get('/orders').set('X-Forwarded-For', '3.3.3.3');
  console.log('allowed request order:', JSON.stringify(seen));
  ok(seen.join() === 'later guard,interceptor,handler', 'an allowed request goes on through the other guards, then the interceptor');
  await app.close();

  // --- The same limit as plain middleware that answers itself and never calls next().
  const hits = new Map<string, number>();
  class RateLimit implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
      const n = (hits.get(req.ip!) ?? 0) + 1;
      hits.set(req.ip!, n);
      if (n > 2) { res.status(429).send('slow down'); return; }
      next();
    }
  }
  @Module({ controllers: [Ctl], providers: [{ provide: APP_GUARD, useClass: Later }, { provide: APP_INTERCEPTOR, useClass: Log }] })
  class MwApp implements NestModule { configure(c: MiddlewareConsumer) { c.apply(RateLimit).forRoutes('*path'); } }
  const app2 = (await Test.createTestingModule({ imports: [MwApp] }).compile()).createNestApplication();
  await app2.init();
  const s2 = app2.getHttpServer();
  await request(s2).get('/orders'); await request(s2).get('/orders');
  seen.length = 0;
  const mw = await request(s2).get('/orders');
  console.log('middleware block saw:', JSON.stringify(seen), mw.status, mw.text);
  ok(mw.status === 429 && seen.length === 0, 'middleware that answers itself: no guard, interceptor or handler runs');
  const mwHealth = await request(s2).get('/health');
  console.log('middleware /health ->', mwHealth.status);
  ok(mwHealth.status === 429, '@SkipThrottle() means nothing to middleware: /health is blocked too');
  await app2.close();

  // --- Main Line note: no filter runs when the middleware sends, but one does if it throws instead.
  @Catch() class Filter implements ExceptionFilter {
    catch(e: unknown, host: ArgumentsHost) {
      seen.push('filter');
      host.switchToHttp().getResponse<Response>().status(e instanceof HttpException ? e.getStatus() : 500).json({ by: 'filter' });
    }
  }
  class Sends implements NestMiddleware { use(_q: Request, res: Response) { res.status(429).send('slow'); } }
  class Throws implements NestMiddleware { use() { throw new HttpException('slow', 429); } }
  for (const [label, Mw] of [['sends', Sends], ['throws', Throws]] as const) {
    @Module({ controllers: [Ctl], providers: [{ provide: APP_FILTER, useClass: Filter }, { provide: APP_INTERCEPTOR, useClass: Log }] })
    class FApp implements NestModule { configure(c: MiddlewareConsumer) { c.apply(Mw).forRoutes('*path'); } }
    const a = (await Test.createTestingModule({ imports: [FApp] }).compile()).createNestApplication({ logger: false });
    await a.init();
    seen.length = 0;
    const r = await request(a.getHttpServer()).get('/orders');
    console.log(`middleware ${label}:`, r.status, JSON.stringify(seen));
    if (label === 'sends') ok(r.status === 429 && seen.length === 0, 'middleware that sends the 429: no exception filter runs, because nothing was thrown');
    else ok(r.status === 429 && seen.join() === 'filter', 'middleware that throws the 429: the global exception filter does catch it');
    await a.close();
  }

  // --- Middleware can still skip a route, by path, with exclude().
  hits.clear();
  @Module({ controllers: [Ctl] })
  class ExApp implements NestModule { configure(c: MiddlewareConsumer) { c.apply(RateLimit).exclude('health').forRoutes('*path'); } }
  const app3 = (await Test.createTestingModule({ imports: [ExApp] }).compile()).createNestApplication();
  await app3.init();
  const s3 = app3.getHttpServer();
  const ex: number[] = [];
  for (const path of ['/orders', '/orders', '/orders', '/health', '/health']) ex.push((await request(s3).get(path)).status);
  console.log('exclude(health): orders x3, health x2 ->', ex.join(' '));
  ok(ex.join() === '200,200,429,200,200', 'exclude() skips a route by path, so the limiter never sees /health');
  await app3.close();

  ok(false, 'SANITY should fail');
  done();
}
main();
