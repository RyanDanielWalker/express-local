import 'reflect-metadata';
import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, Req, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// verbatim from auth fieldGuide.code
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const open = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (open) return true;

    const req = ctx.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    try {
      req.user = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

@Controller() class C {
  @Get('me') me(@Req() r: any) { return r.user; }
  @Public() @Get('health') h() { return 'ok'; }
}
@Module({ imports: [JwtModule.register({ secret: 'x'.repeat(40) })], controllers: [C], providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }] })
class AppModule {}
const app = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication({ logger: false });
await app.init();
const t = await app.get(JwtService).signAsync({ sub: 'u1' });
const s = app.getHttpServer();
for (const [label, h] of [['none', null], ['Bearer', 'Bearer ' + t], ['bearer (lowercase)', 'bearer ' + t], ['raw token, no scheme', t], ['Basic', 'Basic dXNlcjpwYXNz']] as const) {
  let r = request(s).get('/me'); if (h) r = r.set('Authorization', h);
  const res = await r; console.log(label.padEnd(22), res.status, res.text);
}
console.log('health', (await request(s).get('/health')).status);
await app.close();
