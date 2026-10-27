import 'reflect-metadata';
import { Controller, Get, Injectable, Module } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';

// Proves Wiring Yard's forwardRef question and the forwardRef sentence in its rehearse answer.
// Nest's forwardRef comes from @nestjs/common. It has nothing to do with React's forwardRef.
// This folder compiles to CommonJS (see package.json), like a default `nest new` project.
// Under ES modules the two-file pair crashes on load even with forwardRef: the emitted
// design:paramtypes metadata reads the other class before it exists (a TDZ ReferenceError).
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);

async function main() {
const boot = async (providers: any[]) => {
  try {
    const mod = await Test.createTestingModule({ providers }).compile();
    return { mod };
  } catch (e) { return { err: String((e as Error).message) }; }
};

// Two files that import each other, each side wrapped in forwardRef.
const fwd = { ...(await import('./fwd-auth.js')), ...(await import('./fwd-users.js')) };
const a = await boot([fwd.AuthService, fwd.UsersService]);
ok(a.mod, 'two files importing each other boot when both sides use forwardRef');
const auth = a.mod?.get(fwd.AuthService);
const users = a.mod?.get(fwd.UsersService);
ok(auth?.users?.name() === 'users' && users?.auth?.name() === 'auth', 'each service really holds the other');

// The same files without forwardRef.
let raw: any;
try {
  raw = { ...(await import('./raw-auth.js')), ...(await import('./raw-users.js')) };
} catch (e) { raw = { loadErr: String((e as Error).message) }; }
if (raw.loadErr) {
  console.log('raw pair failed to load:', raw.loadErr);
  ok(true, 'without forwardRef, the pair fails before Nest even starts');
} else {
  const r = await boot([raw.AuthService, raw.UsersService]);
  console.log('raw pair:', r.err?.split('\n').slice(0, 4).join(' | '));
  ok(r.err && /can't resolve dependencies/i.test(r.err), 'without forwardRef, Nest cannot resolve the pair');
}

// One file, forwardRef on both sides.
const one = await import('./one-file.js');
const b = await boot([one.AuthService, one.UsersService]);
ok(b.mod?.get(one.AuthService).users instanceof one.UsersService, 'one file, forwardRef on both sides: boots');
// Only one side wrapped: the docs say both sides need it.
const c = await boot([one.AuthOnly, one.UsersOnly]);
console.log('one side only:', c.err ? c.err.split('\n').slice(0, 3).join(' | ') : 'booted');
// Observation, not content: in one file, Nest builds the pair with forwardRef on one side only.
// The docs still say to wrap both sides, which is what the answer says, so that is kept.
const ao = c.mod?.get(one.AuthOnly), uo = c.mod?.get(one.UsersOnly);
console.log('one side only: auth.users is UsersOnly?', ao?.users instanceof one.UsersOnly, '| users.auth is AuthOnly?', uo?.auth instanceof one.AuthOnly);

// Wrong options: @Global() and "one module, drop the imports" do not break the circle.
const { Global } = await import('@nestjs/common');
@Global() @Module({ providers: [raw.AuthService, raw.UsersService], exports: [raw.AuthService, raw.UsersService] }) class G {}
let gErr = '';
try { await Test.createTestingModule({ imports: [G] }).compile(); } catch (e) { gErr = String((e as Error).message); }
console.log('global, one module:', gErr.split('\n')[0] || 'booted');
ok(gErr, 'one @Global() module holding both still fails without forwardRef');

// Rehearse answer: the class doing the injecting has no @Injectable(). Nest boots, the dependency
// is undefined, and the first request that uses it fails with a 500.
@Injectable() class Repo { find() { return 'row'; } }
class OrdersService { constructor(readonly repo: Repo) {} one() { return this.repo.find(); } }
@Controller('orders') class Orders { constructor(readonly svc: OrdersService) {} @Get() get() { return this.svc.one(); } }
let bootErr = '';
let app: any;
try {
  app = (await Test.createTestingModule({ controllers: [Orders], providers: [Repo, OrdersService] }).compile()).createNestApplication({ logger: false });
  await app.init();
} catch (e) { bootErr = String(e); }
ok(!bootErr, 'missing @Injectable() on the injecting class: Nest starts without an error');
const r = await request(app.getHttpServer()).get('/orders');
console.log('GET /orders ->', r.status, JSON.stringify(r.body));
ok(r.status === 500, 'the first request that uses the dependency fails with a 500');
await app.close();

ok(false, 'SANITY should fail');
done();
}
main();
