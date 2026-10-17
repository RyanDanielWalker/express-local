import 'reflect-metadata';
import { Injectable, Module, Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Real } from './real.js';
import { Real as RealV } from './real.js';
interface Store { get(): string }
@Injectable() class ViaInterface { constructor(public s: Store) {} }
@Injectable() class ViaTypeImport { constructor(public r: Real) {} }
class NoDecoNoDeps { v = 1 }
@Injectable() class UsesNoDeco { constructor(public n: NoDecoNoDeps) {} }
@Controller('x') class NotListed { @Get() g() { return 1 } }
async function tryIt(name: string, meta: any) {
  try { const m = await Test.createTestingModule(meta).compile(); const app = m.createNestApplication({ logger: false }); await app.init(); console.log(name, '-> boots'); return app; }
  catch (e: any) { console.log(name, '->', e.message.split('\n')[0]); }
}
await tryIt('interface token', { providers: [ViaInterface] });
await tryIt('import type token', { providers: [ViaTypeImport, RealV] });
const ok = await tryIt('no-deco class with no deps', { providers: [UsesNoDeco, NoDecoNoDeps] });
console.log('   n is', typeof (ok as any)?.get(UsesNoDeco).n);
// two modules providing the same class
@Injectable() class Svc { id = Math.random() }
@Module({ providers: [Svc], exports: [Svc] }) class M1 {}
@Module({ providers: [Svc], exports: [Svc] }) class M2 {}
const app = await Test.createTestingModule({ imports: [M1, M2] }).compile();
console.log('two modules, same instance?', app.select(M1).get(Svc, { strict: true }) === app.select(M2).get(Svc, { strict: true }));
// @Global must still be imported once
import { Global } from '@nestjs/common';
@Injectable() class Cfg {}
@Global() @Module({ providers: [Cfg], exports: [Cfg] }) class CfgM {}
@Injectable() class NeedsCfg { constructor(public c: Cfg) {} }
@Module({ providers: [NeedsCfg] }) class Feature {}
await tryIt('@Global never imported', { imports: [Feature] });
await tryIt('@Global imported once at root', { imports: [CfgM, Feature] });
@Global() @Module({ providers: [Cfg] }) class CfgNoExport {}
await tryIt('@Global without exports', { imports: [CfgNoExport, Feature] });
