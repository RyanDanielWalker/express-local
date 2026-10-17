import 'reflect-metadata';
import { Body, Controller, Get, Module, Param, ParseIntPipe, Post, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsEmail } from 'class-validator';
import request from 'supertest';

// Copy this folder to start a new probe. ok() records a check; done() prints the count.
// Every probe keeps one check that should fail (the SANITY line), so a pass means something.
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);

class CreateUserDto { @IsEmail() email!: string; }

@Controller('users')
class UsersController {
  @Post() create(@Body() dto: CreateUserDto) { return dto; }
  @Get(':id') one(@Param('id', ParseIntPipe) id: number) { return { id, type: typeof id }; }
}
@Module({ controllers: [UsersController] }) class AppModule {}

const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = mod.createNestApplication();
app.useGlobalPipes(new ValidationPipe());
await app.init();
const s = app.getHttpServer();
const r1 = await request(s).post('/users').send({ email: 'nope' });
console.log('POST bad email ->', r1.status, JSON.stringify(r1.body));
const r2 = await request(s).post('/users').send({ email: 'a@b.co' });
console.log('POST good email ->', r2.status, JSON.stringify(r2.body));
const r3 = await request(s).get('/users/42');
console.log('GET /users/42 ->', r3.status, JSON.stringify(r3.body));
const r4 = await request(s).get('/users/abc');
console.log('GET /users/abc ->', r4.status, JSON.stringify(r4.body));
ok(r1.status === 400, 'ValidationPipe rejects a bad email with 400');
ok(r2.status === 201 && r2.body.email === 'a@b.co', 'a good email passes, and POST defaults to 201');
ok(r3.body.type === 'number', 'ParseIntPipe turns the id into a number');
ok(r4.status === 400, 'ParseIntPipe rejects a non-numeric id with 400');
ok(false, 'SANITY should fail');
await app.close();
done();
