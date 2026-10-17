import 'reflect-metadata';
import {
  CanActivate, Controller, Delete, ExecutionContext, Get, Injectable, Module, Req, SetMetadata,
  UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard, PassportModule, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

const SECRET = 'test-secret-test-secret-test-secret!!';
const IS_PUBLIC = 'isPublic';
const Public = () => SetMetadata(IS_PUBLIC, true);
const Roles = Reflector.createDecorator<string[]>();
let seenPayload: any;

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: SECRET }); }
  validate(payload: any) {
    seenPayload = payload;
    if (payload.sub === 'deleted') return null;
    return { userId: payload.sub, roles: payload.roles, fromValidate: true };
  }
}

@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }
  canActivate(ctx: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;
    return super.canActivate(ctx);
  }
}
@Injectable()
class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride(Roles, [ctx.getHandler(), ctx.getClass()]);
    if (!roles) return true;
    const user = ctx.switchToHttp().getRequest().user;
    return roles.some(r => user?.roles?.includes(r));
  }
}

@Controller()
class C {
  @Get('projects') list(@Req() req: any) { return { user: req.user }; }
  @Delete('projects/:id') @Roles(['admin']) del() { return 'deleted'; }
  @Public() @Get('health') health(@Req() req: any) { return { ok: true, user: req.user ?? null }; }
}

@Module({
  imports: [PassportModule, JwtModule.register({ secret: SECRET })],
  controllers: [C],
  providers: [JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: RolesGuard }],
})
class AppModule {}

const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = m.createNestApplication({ logger: false });
await app.init();
const jwt = app.get(JwtService);
const s = app.getHttpServer();
const viewer = await jwt.signAsync({ sub: 'u1', roles: ['viewer'] });
const admin = await jwt.signAsync({ sub: 'u2', roles: ['admin'] });
const otherSecret = await jwt.signAsync({ sub: 'u1' }, { secret: 'some-other-secret-some-other-secret' });
const expired = await jwt.signAsync({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 86400 });
const deleted = await jwt.signAsync({ sub: 'deleted' });
const cases: [string, string, string | null][] = [
  ['GET', '/projects', null], ['GET', '/projects', otherSecret], ['GET', '/projects', expired],
  ['GET', '/projects', 'not-a-jwt'], ['GET', '/projects', deleted],
  ['DELETE', '/projects/3', viewer], ['DELETE', '/projects/3', admin], ['GET', '/health', null], ['GET', '/projects', viewer],
];
const names = ['no token', 'other secret', 'expired', 'garbage', 'validate->null', 'viewer DELETE', 'admin DELETE', 'public no token', 'viewer GET'];
for (const [i, [method, path, tok]] of cases.entries()) {
  let r = method === 'GET' ? request(s).get(path) : request(s).delete(path);
  if (tok) r = r.set('Authorization', 'Bearer ' + tok);
  const res = await r;
  console.log(names[i].padEnd(16), res.status, res.headers['www-authenticate'] ?? '', res.text);
}
console.log('validate() received:', seenPayload);
// JWT payload readable without the secret
const [, p] = viewer.split('.');
console.log('decoded without secret:', Buffer.from(p, 'base64url').toString());
await app.close();
