import 'reflect-metadata';
import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, Req, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// ---- snippet verbatim ----
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
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException();
    }
    try {
      req.user = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
// ---- end snippet ----

@Controller()
class C {
  @Get('me') me(@Req() req: any) { return req.user; }
  @Public() @Get('open') open() { return 'open'; }
}
@Module({ imports: [JwtModule.register({ secret: 's3cret' })], controllers: [C], providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }] })
class AppModule {}

const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = mod.createNestApplication({ logger: false });
await app.init();
const s = app.getHttpServer();
const jwt = app.get(JwtService);
const good = await jwt.signAsync({ sub: 7 });
const bad = await new JwtService({ secret: 'other' }).signAsync({ sub: 7 });
const cases: [string, string | undefined][] = [
  ['no header', undefined], ['Bearer good', `Bearer ${good}`], ['bearer good', `bearer ${good}`],
  ['Basic good', `Basic ${good}`], ['Bearer bad', `Bearer ${bad}`], ['Bearer only', 'Bearer'], ['Bearer + space', 'Bearer '],
  ['raw token', good],
];
for (const [label, h] of cases) {
  const req = request(s).get('/me');
  if (h !== undefined) req.set('Authorization', h);
  const r = await req;
  console.log(label.padEnd(15), r.status, r.status === 200 ? JSON.stringify(r.body) : '');
}
console.log('public no header', (await request(s).get('/open')).status);
await app.close();
