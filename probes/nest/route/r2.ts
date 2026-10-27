import 'reflect-metadata';
import { Controller, Delete, Get, HttpCode, Module, NotFoundException, Param } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// Platform Signs: @HttpCode(204) next to a thrown exception, and wildcard routes on Express 5.
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);

@Controller('users')
class UsersController {
  @Delete(':id') @HttpCode(204)
  remove(@Param('id') id: string) {
    if (id !== '1') throw new NotFoundException('No such user');
    return { deleted: id };
  }
}

@Controller('files')
class FilesController {
  @Get('*path') named(@Param('path') path: unknown) { return { route: 'named', path }; }
}
@Controller('one')
class OneController {
  @Get(':path') one(@Param('path') path: string) { return { path }; }
}
@Controller('old')
class OldController {
  @Get('*') bare() { return { route: 'bare' }; }
}

@Module({ controllers: [UsersController, FilesController, OneController, OldController] }) class AppModule {}

const warnings: string[] = [];
const logger = { log() {}, error: (m: unknown) => warnings.push(String(m)), warn: (m: unknown) => warnings.push(String(m)), debug() {}, verbose() {} };
const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = mod.createNestApplication({ logger });
await app.init();
const s = app.getHttpServer();

const a = await request(s).delete('/users/1');
const b = await request(s).delete('/users/2');
console.log('DELETE /users/1 ->', a.status, JSON.stringify(a.body), '| DELETE /users/2 ->', b.status, JSON.stringify(b.body));
ok(a.status === 204 && a.text === '', 'success: @HttpCode(204) wins, and the returned body is dropped');
ok(b.status === 404 && b.body.message === 'No such user', 'a thrown NotFoundException still sends 404 with its JSON body');
ok(b.status !== 204 && b.status !== 500, 'not 204, not 500');

const c = await request(s).get('/files/docs/2026/plan.pdf');
console.log('GET /files/docs/2026/plan.pdf ->', c.status, JSON.stringify(c.body));
ok(c.status === 200 && JSON.stringify(c.body.path) === '["docs","2026","plan.pdf"]', "'*path' matches every segment and names them path, as an array");

const e1 = await request(s).get('/one/docs/2026/plan.pdf');
const e2 = await request(s).get('/one/docs');
ok(e1.status === 404 && e2.body.path === 'docs', ':path matches one segment only: the long URL is a 404, /one/docs gives docs');
const d = await request(s).get('/old/a/b');
console.log('GET /old/a/b ->', d.status, JSON.stringify(d.body), '| warnings:', warnings.filter(w => /\*|wildcard|path-to-regexp|unnamed/i.test(w)).join(' / '));
ok(d.status === 200 && warnings.some(w => w.includes('auto-convert')), 'a bare * still works, converted with a startup warning');
ok(false, 'SANITY should fail');
await app.close();
done();
