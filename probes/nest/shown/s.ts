import 'reflect-metadata';
import { Body, Controller, Injectable, Module, Post, Req, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsEmail, IsInt } from 'class-validator';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import request from 'supertest';

// The code shown in NestJS questions that used to describe it in a sentence.
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);
ok(false, 'SANITY should fail');

const build = async (mod: any, pipe?: ValidationPipe) => {
  const m = await Test.createTestingModule({ imports: [mod] }).compile();
  const app = m.createNestApplication({ logger: false });
  if (pipe) app.useGlobalPipes(pipe);
  await app.init();
  return app;
};

// --- Ticket Check: whitelist, then whitelist plus forbidNonWhitelisted, on the shown DTO and body.
export class CreateUserDto {
  @IsEmail() email!: string;
}
const body = { email: 'ada@example.com', isAdmin: true };
@Controller('users') class UsersController { @Post() create(@Body() dto: CreateUserDto) { return { seen: dto, keys: Object.keys(dto) }; } }
@Module({ controllers: [UsersController] }) class UsersModule {}
{
  const app = await build(UsersModule, new ValidationPipe({ whitelist: true }));
  const r = await request(app.getHttpServer()).post('/users').send(body);
  console.log('whitelist ->', r.status, JSON.stringify(r.body));
  ok(r.status === 201 && JSON.stringify(r.body.keys) === '["email"]', 'whitelist: isAdmin is stripped, the handler sees only email');
  await app.close();
}
{
  const app = await build(UsersModule, new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  const r = await request(app.getHttpServer()).post('/users').send(body);
  console.log('forbid ->', r.status, JSON.stringify(r.body));
  ok(r.status === 400 && JSON.stringify(r.body.message) === '["property isAdmin should not exist"]', 'forbidNonWhitelisted: 400 naming isAdmin');
  await app.close();
}

// --- Ticket Check: @IsInt() age with a plain ValidationPipe, body { "age": "30" }.
class AgeDto { @IsInt() age!: number; }
@Controller('ages') class AgeController { @Post() create(@Body() dto: AgeDto) { return { age: dto.age, type: typeof dto.age }; } }
@Module({ controllers: [AgeController] }) class AgeModule {}
{
  const app = await build(AgeModule, new ValidationPipe());
  const r = await request(app.getHttpServer()).post('/ages').send({ age: '30' });
  console.log('age "30" ->', r.status, JSON.stringify(r.body));
  ok(r.status === 400 && JSON.stringify(r.body.message).includes('age must be an integer number'), 'plain pipe: "30" is a 400');
  const n = await request(app.getHttpServer()).post('/ages').send({ age: 30 });
  ok(n.status === 201 && n.body.type === 'number', 'control: the number 30 passes');
  await app.close();
}

// --- Test Track: main.ts sets the pipe; the e2e test builds its own app from AppModule and never runs main.ts.
@Controller('signup') class SignupController {
  @Post() create(@Body() dto: CreateUserDto, @Req() req: any) { return { ct: req.headers['content-type'] }; }
}
@Module({ controllers: [SignupController] }) class AppModule {}
{
  process.env.NODE_ENV = 'test';
  // The test file, as shown: no useGlobalPipes, because that line lives in main.ts.
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();
  const r = await request(app.getHttpServer()).post('/signup').send({ email: 'nope' });
  console.log('e2e without main.ts ->', r.status, JSON.stringify(r.body));
  ok(r.status === 201, 'the bad body gets a 201, since no pipe is set');
  ok(/application\/json/.test(r.body.ct), 'supertest .send() with an object sends JSON');
  await app.close();
  // Control: the same app with the pipe from main.ts, still under NODE_ENV=test, rejects it.
  const app2 = await build(AppModule, new ValidationPipe());
  const r2 = await request(app2.getHttpServer()).post('/signup').send({ email: 'nope' });
  ok(r2.status === 400, 'control: with the pipe applied, NODE_ENV=test still gets a 400');
  await app2.close();
}

// --- Wiring Yard: UsersModule exports UsersService, OrdersModule imports nothing, the root imports both.
{
  @Injectable() class UsersService {}
  @Injectable() class OrdersService { constructor(public users: UsersService) {} }
  @Module({ providers: [UsersService], exports: [UsersService] })
  class UsersMod {}
  @Module({ providers: [OrdersService] })   // no imports
  class OrdersMod {}
  let err = '';
  try { await Test.createTestingModule({ imports: [UsersMod, OrdersMod] }).compile(); } catch (e) { err = (e as Error).message; }
  console.log('exports, no import ->', err.split('\n')[0]);
  ok(/can't resolve dependencies of the OrdersService/.test(err), 'it fails at startup, though UsersModule exports it and the app loads it');
  @Module({ imports: [UsersMod], providers: [OrdersService] }) class OrdersWithImport {}
  const m = await Test.createTestingModule({ imports: [UsersMod, OrdersWithImport] }).compile();
  ok(m.get(OrdersService).users instanceof UsersService, 'control: once OrdersModule imports UsersModule, it boots');
}

// --- Fault Line: the signup handler as shown, in its own process because the claim is that it dies.
{
  const crash = fileURLToPath(new URL('./crash.js', import.meta.url));
  const run = spawnSync(process.execPath, [crash], { encoding: 'utf8' });
  console.log('signup exit', run.status, '|', run.stdout.trim().replace(/\n/g, ' | '));
  ok(/STATUS 201 \{"id":1,"email":"ada@example.com"\}/.test(run.stdout), 'the client gets its 201 with the user');
  ok(run.status !== 0 && !/STILL SERVING/.test(run.stdout), 'then the process crashes, so nothing keeps serving');
  ok(/smtp down/.test(run.stderr), 'the crash reports the rejection');
}

done();
