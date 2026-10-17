import 'reflect-metadata';
import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, Req, UseGuards } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AuthGuard, PassportModule, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

let ok = 0, bad = 0;
function check(label: string, cond: boolean) { if (cond) { ok++; console.log('PASS', label); } else { bad++; console.log('FAIL', label); } }
const SECRET = 's3cret';
let validateCalls = 0;

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: SECRET, ignoreExpiration: false }); }
  validate(payload: any) { validateCalls++; return payload.sub === 'nobody' ? null : { id: payload.sub, shaped: true }; }
}

@Controller()
class C {
  @Get('me') @UseGuards(AuthGuard('jwt')) me(@Req() req: any) { return req.user; }
}

let globalRan = 0;
@Injectable() class GlobalGuard implements CanActivate { canActivate(_c: ExecutionContext) { globalRan++; return true; } }
@Controller('health') class HealthC { @Get() h() { return 'ok'; } }
@Module({ controllers: [HealthC] }) class HealthModule {}

@Module({ imports: [PassportModule, HealthModule], controllers: [C], providers: [JwtStrategy, { provide: APP_GUARD, useClass: GlobalGuard }] })
class AppModule {}

const app = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication({ logger: false });
await app.init();
const s = app.getHttpServer();

const good = jwt.sign({ sub: 'u1' }, SECRET);
let r = await request(s).get('/me').set('Authorization', 'Bearer ' + good);
check('validate() return value becomes req.user', r.status === 200 && r.body.shaped === true && r.body.id === 'u1');

validateCalls = 0;
r = await request(s).get('/me').set('Authorization', 'Bearer ' + jwt.sign({ sub: 'u1' }, 'other'));
check('bad signature -> 401, validate not called', r.status === 401 && validateCalls === 0);
r = await request(s).get('/me').set('Authorization', 'Bearer ' + jwt.sign({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 60 }, SECRET));
check('expired -> 401, validate not called', r.status === 401 && validateCalls === 0);
const expiredStatus = r.status;
r = await request(s).get('/me').set('Authorization', 'Bearer ' + jwt.sign({ sub: 'nobody' }, SECRET));
console.log('  validate returns null ->', r.status, 'validateCalls', validateCalls);

const payload = JSON.parse(Buffer.from(good.split('.')[1], 'base64url').toString());
check('payload decodes without secret', payload.sub === 'u1');

globalRan = 0;
r = await request(s).get('/health');
check('APP_GUARD runs on route in a module with no providers', globalRan === 1);
check('DELIBERATE FAIL: expired token -> 200', expiredStatus === 200);
await app.close();
console.log(`ok=${ok} bad=${bad}`);
