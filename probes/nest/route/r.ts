import 'reflect-metadata';
import { Controller, Get, Module, MiddlewareConsumer, NestModule, Catch, ExceptionFilter, ArgumentsHost, HttpException, CanActivate, Injectable, UseGuards, UsePipes, PipeTransform, Res, Param } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
const log: string[] = [];
@Catch() class F implements ExceptionFilter { catch(e: any, h: ArgumentsHost) { log.push('filter ' + (e as HttpException).getStatus?.()); h.switchToHttp().getResponse().status(e.getStatus?.() ?? 500).json({ seen: 'filter' }); } }
@Injectable() class G implements CanActivate { canActivate() { log.push('guard'); return true } }
@Injectable() class P implements PipeTransform { transform(v: any) { log.push('pipe ' + v); return v } }
@Controller('users') class C { @Get(':id') @UseGuards(G) one(@Param('id', P) id: string, @Res() res: any) { res.json({ id }) } }
@Module({ controllers: [C], providers: [{ provide: APP_FILTER, useClass: F }] })
class M implements NestModule { configure(c: MiddlewareConsumer) { c.apply((req: any, _r: any, n: any) => { log.push('mw ' + req.url); n() }).forRoutes('*') } }
const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication({ logger: false });
await app.init();
let r = await request(app.getHttpServer()).get('/userz'); console.log('/userz', r.status, r.body, log.splice(0));
r = await request(app.getHttpServer()).get('/users/5'); console.log('/users/5 with @Res', r.status, r.body, log.splice(0));
