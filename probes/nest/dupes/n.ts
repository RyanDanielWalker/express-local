import 'reflect-metadata';
import { CallHandler, CanActivate, Controller, ExecutionContext, Get, Injectable, Module, NestInterceptor, ParseArrayPipe, Query } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tap } from 'rxjs';
import request from 'supertest';

// Proves the three replacement questions from the last NestJS near-duplicate pairs.
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);

// --- Fault Line: an un-awaited promise rejects after the handler returned.
const crashApp = fileURLToPath(new URL('./crash-app.js', import.meta.url));
const plain = spawnSync(process.execPath, [crashApp], { encoding: 'utf8' });
console.log('--- no handler, exit', plain.status, '\n' + plain.stdout + plain.stderr.split('\n').slice(0, 6).join('\n'));
ok(/STATUS 201 \{"ok":true\}/.test(plain.stdout), 'the client already got its 201');
ok(!/FILTER saw/.test(plain.stdout), 'the exception filter never sees the rejection');
ok(plain.status !== 0 && !/STILL SERVING/.test(plain.stdout), 'the Node process crashes, so nothing keeps serving');
ok(/smtp down/.test(plain.stderr), 'the crash reports the rejection');
// Wrong option "Nest logs it and keeps serving": only true if someone adds an unhandledRejection listener.
const caught = spawnSync(process.execPath, [crashApp, 'catch'], { encoding: 'utf8' });
console.log('--- with a listener, exit', caught.status, '\n' + caught.stdout);
ok(caught.status === 0 && /UNHANDLED smtp down/.test(caught.stdout) && /STILL SERVING 201/.test(caught.stdout),
  'control: the same app survives once something handles the rejection');

// --- Dispatch Desk: ?ids=1,2,3 into an array of numbers is a pipe job (ParseArrayPipe).
const order: string[] = [];
@Injectable() class Spy implements CanActivate { canActivate() { order.push('guard'); return true; } }
@Injectable() class Wrap implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler) { order.push('interceptor before'); return next.handle().pipe(tap(() => order.push('interceptor after'))); }
}
@Controller('posts') class Posts {
  @Get() list(@Query('ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]) {
    order.push('handler');
    return { ids, types: ids.map((i) => typeof i) };
  }
}
@Module({ controllers: [Posts], providers: [Spy, Wrap] }) class PipeModule {}
{
  const m = await Test.createTestingModule({ imports: [PipeModule] }).compile();
  const app = m.createNestApplication({ logger: false });
  app.useGlobalGuards(app.get(Spy));
  app.useGlobalInterceptors(app.get(Wrap));
  await app.init();
  const good = await request(app.getHttpServer()).get('/posts?ids=1,2,3');
  const bad = await request(app.getHttpServer()).get('/posts?ids=1,x');
  console.log('ids=1,2,3 ->', good.status, JSON.stringify(good.body), '| ids=1,x ->', bad.status, JSON.stringify(bad.body));
  console.log('order', order.join(' > '));
  ok(good.status === 200 && JSON.stringify(good.body.ids) === '[1,2,3]' && good.body.types.every((t: string) => t === 'number'),
    'ParseArrayPipe turns ?ids=1,2,3 into [1, 2, 3], all numbers');
  ok(bad.status === 400, 'ParseArrayPipe rejects ?ids=1,x with a 400 before the handler');
  ok(order.indexOf('guard') < order.indexOf('handler'), 'a guard only answers yes or no before the handler; it hands the handler no value');
  await app.close();
}

// --- Tool Shed: an APP_GUARD listed in UsersModule guards every route in the app.
@Injectable() class DenyAll implements CanActivate { canActivate() { return false; } }
@Controller('users') class Users { @Get() all() { return []; } }
@Controller('orders') class Orders { @Get() all() { return []; } }
@Module({ controllers: [Users], providers: [{ provide: APP_GUARD, useClass: DenyAll }] }) class UsersModule {}
@Module({ controllers: [Orders] }) class OrdersModule {} // does not import UsersModule
@Module({ imports: [UsersModule, OrdersModule] }) class AppModule {}
@Module({ imports: [OrdersModule] }) class AppWithoutUsers {}
{
  const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = m.createNestApplication({ logger: false });
  await app.init();
  const u = await request(app.getHttpServer()).get('/users');
  const o = await request(app.getHttpServer()).get('/orders');
  console.log('GET /users ->', u.status, '| GET /orders ->', o.status);
  ok(u.status === 403, 'the guard covers UsersModule routes');
  ok(o.status === 403, 'it also covers OrdersModule, which never imports UsersModule');
  await app.close();
  // Control: when nothing loads UsersModule, the guard never runs.
  const m2 = await Test.createTestingModule({ imports: [AppWithoutUsers] }).compile();
  const app2 = m2.createNestApplication({ logger: false });
  await app2.init();
  const o2 = await request(app2.getHttpServer()).get('/orders');
  console.log('without UsersModule, GET /orders ->', o2.status);
  ok(o2.status === 200, 'control: no UsersModule loaded, no guard');
  await app2.close();
}

// The module that lists the APP_GUARD decides what it can inject.
@Injectable() class UsersService { allowed() { return true; } }
@Injectable() class NeedsUsers implements CanActivate {
  constructor(private users: UsersService) {}
  canActivate() { return this.users.allowed(); }
}
@Module({ controllers: [Users], providers: [UsersService, { provide: APP_GUARD, useClass: NeedsUsers }] }) class HomeModule {}
@Module({ controllers: [Orders], providers: [{ provide: APP_GUARD, useClass: NeedsUsers }] }) class AwayModule {}
@Module({ providers: [UsersService] }) class Other {}
{
  const m = await Test.createTestingModule({ imports: [HomeModule] }).compile();
  const app = m.createNestApplication({ logger: false });
  await app.init();
  ok((await request(app.getHttpServer()).get('/users')).status === 200, 'listed next to UsersService, the guard gets it injected');
  await app.close();
  let err = '';
  try { await Test.createTestingModule({ imports: [AwayModule, Other] }).compile(); } catch (e) { err = (e as Error).message; }
  console.log('away:', err.split('\n')[0]);
  ok(/can't resolve dependencies/i.test(err), 'listed in a module without UsersService, Nest cannot build it');
}

ok(false, 'SANITY should fail');
done();
