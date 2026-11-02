import 'reflect-metadata';
import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// Run as a child process by s.ts: Fault Line's signup handler, as the question shows it.
class SignupDto { email!: string; }
@Injectable() class UsersService { async create(dto: SignupDto) { return { id: 1, email: dto.email }; } }
@Injectable() class Mailer {
  send(_user: unknown) { return new Promise((_, reject) => setTimeout(() => reject(new Error('smtp down')), 20)); }
}
@Controller() class SignupController {
  constructor(private users: UsersService, private mailer: Mailer) {}
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const user = await this.users.create(dto);
    this.mailer.send(user); // no await
    return user;
  }
}
@Module({ controllers: [SignupController], providers: [UsersService, Mailer] }) class AppModule {}

const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = mod.createNestApplication({ logger: false });
await app.init();
const r = await request(app.getHttpServer()).post('/signup').send({ email: 'ada@example.com' });
console.log('STATUS', r.status, JSON.stringify(r.body));
await new Promise((res) => setTimeout(res, 200));
const r2 = await request(app.getHttpServer()).post('/signup').send({ email: 'b@example.com' }).catch(() => null);
console.log('STILL SERVING', r2?.status);
await app.close();
