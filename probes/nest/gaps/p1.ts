import 'reflect-metadata';
import { Module, DynamicModule, Injectable, Inject, Global, OnModuleInit, OnApplicationBootstrap, ConfigurableModuleBuilder, Controller, Get, Post, Body, UseGuards, CanActivate, ExecutionContext, SetMetadata, applyDecorators, createParamDecorator, Catch, ExceptionFilter, ArgumentsHost, Req, ValidationPipe } from '@nestjs/common';
import { Reflector, APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { IsEmail } from 'class-validator';
let fails = 0; const ok = (c: any, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
ok(false, 'SANITY should fail');

// 1. dynamic module via forRoot
const MAIL_OPTIONS = 'MAIL_OPTIONS';
@Injectable() class MailService { constructor(@Inject(MAIL_OPTIONS) public opts: any) {} }
@Module({}) class MailModule { static forRoot(opts: any): DynamicModule { return { module: MailModule, providers: [{ provide: MAIL_OPTIONS, useValue: opts }, MailService], exports: [MailService] }; } }
const m1 = await Test.createTestingModule({ imports: [MailModule.forRoot({ from: 'hi@x.com' })] }).compile();
ok(m1.get(MailService).opts.from === 'hi@x.com', 'forRoot dynamic module provides MailService with opts');
let threw = false; try { m1.get(MailModule.forRoot({}) as any) } catch { threw = true }
ok(threw, 'the forRoot result is not an injectable provider');

// 2. forRootAsync via ConfigurableModuleBuilder, factory gets ConfigService
@Injectable() class ConfigService { get(k: string) { return k === 'KEY' ? 'secret' : undefined } }
@Global() @Module({ providers: [ConfigService], exports: [ConfigService] }) class CfgModule {}
const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<{ apiKey: string }>().setClassMethodName('forRoot').build();
@Injectable() class Mail2 { constructor(@Inject(MODULE_OPTIONS_TOKEN) public o: any) {} }
@Module({ providers: [Mail2], exports: [Mail2] }) class Mail2Module extends ConfigurableModuleClass {}
const m2 = await Test.createTestingModule({ imports: [CfgModule, (Mail2Module as any).forRootAsync({ useFactory: (c: ConfigService) => ({ apiKey: c.get('KEY') }), inject: [ConfigService] })] }).compile();
ok(m2.get(Mail2).o.apiKey === 'secret', 'forRootAsync factory got ConfigService');

// 3. lifecycle order
const log: string[] = [];
@Injectable() class Hooked implements OnModuleInit, OnApplicationBootstrap {
  constructor() { log.push('ctor') }
  async onModuleInit() { await new Promise(r => setTimeout(r, 30)); log.push('onModuleInit done') }
  onApplicationBootstrap() { log.push('onApplicationBootstrap') }
}
const m3 = await Test.createTestingModule({ providers: [Hooked] }).compile(); log.push('compiled');
await m3.createNestApplication({ logger: false }).init(); log.push('init returned');
console.log('   order:', log.join(' > '));
ok(log.join() === 'ctor,compiled,onModuleInit done,onApplicationBootstrap,init returned', 'ctor, then awaited onModuleInit, then onApplicationBootstrap');

// 4. Reflector.createDecorator
const Roles = Reflector.createDecorator<string[]>();
const Seen: any = {};
@Injectable() class RG implements CanActivate { constructor(private r: Reflector) {} canActivate(ctx: ExecutionContext) { Seen.typed = this.r.get(Roles, ctx.getHandler()); Seen.byString = this.r.get('roles', ctx.getHandler()); return true } }
// 5. applyDecorators
const Auth = (...roles: string[]) => applyDecorators(SetMetadata('roles2', roles), UseGuards(RG));
const Seen2: any = {};
// 6. createParamDecorator data
const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => { const u = ctx.switchToHttp().getRequest().user; return data ? u?.[data] : u; });
@Controller() class C {
  @Get('a') @Roles(['admin']) @UseGuards(RG) a() { return 1 }
  @Get('b') @Auth('admin') b(@Req() r: any) { Seen2.meta = Reflect.getMetadata('roles2', C.prototype.b); return 1 }
  @Get('c') c(@CurrentUser('email') e: string, @CurrentUser() u: any) { return { e, u } }
}
@Module({ controllers: [C] }) class M {}
const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication({ logger: false });
app.use((req: any, _r: any, n: any) => { req.user = { email: 'a@b.co', id: 1 }; n() });
await app.init(); const s = app.getHttpServer();
await request(s).get('/a'); ok(JSON.stringify(Seen.typed) === '["admin"]' && Seen.byString === undefined, 'createDecorator: get(Roles) works, get("roles") is undefined');
Seen.typed = undefined; await request(s).get('/b'); ok(Seen.typed === undefined && JSON.stringify(Seen2.meta) === '["admin"]', 'applyDecorators applied metadata and the guard ran');
const rc = await request(s).get('/c'); ok(rc.body.e === 'a@b.co' && rc.body.u.id === 1, 'createParamDecorator data = email');
await app.close();

// 7. e2e without main.ts pipes
class Dto { @IsEmail() email!: string }
@Controller('u') class UC { @Post() p(@Body() d: Dto) { return d } }
@Module({ controllers: [UC] }) class AppModule {}
const a2 = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication({ logger: false }); await a2.init();
const r7 = await request(a2.getHttpServer()).post('/u').send({ email: 'nope' }); ok(r7.status === 201, 'no pipe in test app -> 201 for bad body'); 
ok(r7.headers['content-type'] && r7.body.email === 'nope', 'supertest send(object) sent JSON that was parsed'); await a2.close();

// 8. APP_FILTER with DI
@Injectable() class LoggerService { lines: string[] = []; log(x: string) { this.lines.push(x) } }
@Catch() class AllF implements ExceptionFilter { constructor(private l: LoggerService) {} catch(e: any, h: ArgumentsHost) { this.l.log(String(e.message)); h.switchToHttp().getResponse().status(500).json({ logged: true }) } }
@Controller('x') class XC { @Get() g() { throw new Error('boom') } }
@Module({ controllers: [XC], providers: [LoggerService, { provide: APP_FILTER, useClass: AllF }] }) class FM {}
const a3 = (await Test.createTestingModule({ imports: [FM] }).compile()).createNestApplication({ logger: false }); await a3.init();
const r8 = await request(a3.getHttpServer()).get('/x'); ok(r8.body.logged && a3.get(LoggerService).lines[0] === 'boom', 'APP_FILTER filter got LoggerService injected');
await a3.close();
console.log('fails', fails);
