import 'reflect-metadata';
import { Controller, Get, Module, BadRequestException, UnauthorizedException, Post, ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
@Controller() class K {
  @Get('plain') a() { throw new Error('connection lost') }
  @Get('httperr') b() { const e: any = new Error('Teapot here'); e.statusCode = 418; e.status = 418; throw e }
  @Get('code-msg') c() { throw new BadRequestException('Password is too weak', { errorCode: 'WEAK_PASSWORD' } as any) }
  @Get('code-obj') d() { throw new BadRequestException({ message: 'x' }, { errorCode: 'WEAK_PASSWORD' } as any) }
  @Get('code-none') e() { throw new BadRequestException(undefined, { errorCode: 'WEAK_PASSWORD' } as any) }
  @Get('unauth') f() { throw new UnauthorizedException('token expired') }
  @Post('p') p() { return { ok: 1 } }
}
@Module({ controllers: [K] }) class M {}
const logs: string[] = [];
class L extends ConsoleLogger { error(m: any, ...r: any[]) { logs.push('ERROR ' + String(m)) } }
const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication({ logger: new L() });
await app.init(); const s = app.getHttpServer();
for (const p of ['plain', 'httperr', 'code-msg', 'code-obj', 'code-none', 'unauth']) { const r = await request(s).get('/' + p); console.log(p, r.status, JSON.stringify(r.body)); }
console.log('POST returns', (await request(s).post('/p')).status);
console.log('logged:', logs);
