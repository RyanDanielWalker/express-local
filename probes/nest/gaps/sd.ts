import 'reflect-metadata';
import { Module, Injectable, OnApplicationShutdown, OnModuleDestroy } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
@Injectable() class Q implements OnApplicationShutdown, OnModuleDestroy {
  onModuleDestroy() { console.log('HOOK onModuleDestroy') }
  onApplicationShutdown(sig?: string) { console.log('HOOK onApplicationShutdown', sig) }
}
@Module({ providers: [Q] }) class M {}
const app = await NestFactory.create(M, { logger: false });
if (process.argv[2] === 'on') app.enableShutdownHooks();
await app.listen(0); console.log('READY');
setTimeout(() => { console.log('timeout exit'); process.exit(0) }, 3000);
