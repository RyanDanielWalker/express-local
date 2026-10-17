import 'reflect-metadata';
import { Controller, Get, Module, Injectable, CanActivate, ExecutionContext, OnModuleInit, Scope, Req } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
@Injectable() class JwtAuthGuard implements CanActivate { canActivate() { return false } }
@Controller('me') class C { @Get() g(@Req() r: any) { return { user: r.user ?? null } } }
@Module({ controllers: [C], providers: [JwtAuthGuard, { provide: APP_GUARD, useExisting: JwtAuthGuard }] }) class M {}
const fake = { canActivate: (ctx: ExecutionContext) => { ctx.switchToHttp().getRequest().user = { id: 1 }; return true } };
let app = (await Test.createTestingModule({ imports: [M] }).overrideProvider(JwtAuthGuard).useValue(fake).compile()).createNestApplication({ logger: false });
await app.init(); let r = await request(app.getHttpServer()).get('/me'); console.log('useExisting + overrideProvider', r.status, JSON.stringify(r.body)); await app.close();
app = (await Test.createTestingModule({ imports: [M] }).overrideGuard(JwtAuthGuard).useValue(fake).compile()).createNestApplication({ logger: false });
await app.init(); r = await request(app.getHttpServer()).get('/me'); console.log('useExisting + overrideGuard', r.status); await app.close();
// onModuleInit timing
@Injectable() class Hooked implements OnModuleInit { ran = false; onModuleInit() { this.ran = true } }
const tm = await Test.createTestingModule({ providers: [Hooked] }).compile();
console.log('after compile, onModuleInit ran?', tm.get(Hooked).ran, '| TestingModule has init?', typeof (tm as any).init);
await tm.init(); console.log('after tm.init()', tm.get(Hooked).ran);
// resolve freshness
@Injectable({ scope: Scope.REQUEST }) class R {}
const tm2 = await Test.createTestingModule({ providers: [R] }).compile();
console.log('two resolve() calls same?', (await tm2.resolve(R)) === (await tm2.resolve(R)));
const { ContextIdFactory } = await import('@nestjs/core'); const cid = ContextIdFactory.create();
console.log('same contextId same?', (await tm2.resolve(R, cid)) === (await tm2.resolve(R, cid)));
