import 'reflect-metadata';
import { ArgumentsHost, Catch, Controller, ExceptionFilter, Injectable, Module, Post } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// Run as a child process by n.ts. A handler starts a promise without await, and it rejects.
// Prints what the client got, then whether the process survives.
@Injectable() class Mailer {
  send() { return new Promise((_, reject) => setTimeout(() => reject(new Error('smtp down')), 20)); }
}
@Catch() class LogAll implements ExceptionFilter {
  catch(e: unknown, host: ArgumentsHost) {
    console.log('FILTER saw', (e as Error).message);
    host.switchToHttp().getResponse().status(500).json({ filtered: true });
  }
}
@Controller('signup') class C {
  constructor(private mailer: Mailer) {}
  @Post() create() { this.mailer.send(); return { ok: true }; }
}
@Module({ controllers: [C], providers: [Mailer, { provide: APP_FILTER, useClass: LogAll }] }) class AppModule {}

const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = mod.createNestApplication({ logger: false });
await app.init();
if (process.argv[2] === 'catch') process.on('unhandledRejection', (e) => console.log('UNHANDLED', (e as Error).message));
const r = await request(app.getHttpServer()).post('/signup');
console.log('STATUS', r.status, JSON.stringify(r.body));
await new Promise((res) => setTimeout(res, 200));
const r2 = await request(app.getHttpServer()).post('/signup').catch(() => null);
console.log('STILL SERVING', r2?.status);
await app.close();
console.log('EXITED CLEANLY');
