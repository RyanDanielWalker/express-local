import 'reflect-metadata';
import { CallHandler, CanActivate, Controller, ExecutionContext, Get, Injectable, MiddlewareConsumer, Module, NestInterceptor, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';

// Dispatch Desk: which building block sees a request that matches no route?
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);
const seen = { scoped: [] as string[], middleware: [] as string[], guard: [] as string[], interceptor: [] as string[] };

function scopedLog(req: Request, _res: Response, next: NextFunction) { seen.scoped.push(req.originalUrl); next(); }
function logRequests(req: Request, _res: Response, next: NextFunction) { seen.middleware.push(`${req.method} ${req.originalUrl}`); next(); }
@Injectable() class LogGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) { const r = ctx.switchToHttp().getRequest<Request>(); seen.guard.push(r.originalUrl); return true; }
}
@Injectable() class LogInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) { const r = ctx.switchToHttp().getRequest<Request>(); seen.interceptor.push(r.originalUrl); return next.handle(); }
}
@Controller('users') class UsersController { @Get() all() { return []; } }

@Module({
  controllers: [UsersController],
  providers: [{ provide: APP_GUARD, useClass: LogGuard }, { provide: APP_INTERCEPTOR, useClass: LogInterceptor }],
})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(logRequests).forRoutes('*');
    consumer.apply(scopedLog).forRoutes(UsersController); }
}

const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = mod.createNestApplication({ logger: false });
await app.init();
const s = app.getHttpServer();
const a = await request(s).get('/users');
const b = await request(s).get('/nope/at/all');
console.log('/users ->', a.status, '| /nope/at/all ->', b.status, '|', JSON.stringify(seen));
ok(a.status === 200 && b.status === 404, 'the matched route answers 200, the unmatched one 404');
ok(seen.middleware.includes('GET /users') && seen.middleware.includes('GET /nope/at/all'), 'middleware logs both requests, including the 404');
ok(seen.scoped.length === 1 && seen.scoped[0] === '/users', 'middleware bound to one controller never sees the 404');
ok(seen.guard.length === 1 && seen.guard[0] === '/users', 'a global guard only sees the matched route');
ok(seen.interceptor.length === 1 && seen.interceptor[0] === '/users', 'a global interceptor only sees the matched route');
ok(false, 'SANITY should fail');
await app.close();
done();
