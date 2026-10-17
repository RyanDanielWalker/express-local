import 'reflect-metadata';
import { Module, Injectable, CanActivate, ExecutionContext, UseGuards } from '@nestjs/common';
import { GraphQLModule, Resolver, Query, GqlExecutionContext } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Test } from '@nestjs/testing';
import request from 'supertest';
const seen: any = {};
@Injectable() class G implements CanActivate { canActivate(ctx: ExecutionContext) {
  seen.type = ctx.getType();
  seen.httpReq = ctx.switchToHttp().getRequest();
  seen.gqlReqHasHeaders = !!GqlExecutionContext.create(ctx).getContext().req?.headers;
  seen.rpc = typeof ctx.switchToRpc().getData();
  return true;
} }
@Resolver() class R { @Query(() => String) @UseGuards(G) hello() { return 'hi' } }
@Module({ imports: [GraphQLModule.forRoot<ApolloDriverConfig>({ driver: ApolloDriver, autoSchemaFile: true })], providers: [R] }) class M {}
process.on("unhandledRejection", e => { console.log("ERR", e); process.exit(1) });
const app = (await Test.createTestingModule({ imports: [M] }).compile()).createNestApplication(); await app.init();
const r = await request(app.getHttpServer()).post('/graphql').send({ query: '{ hello }' });
console.log(r.status, JSON.stringify(r.body), JSON.stringify({ ...seen, httpReq: seen.httpReq === undefined ? 'undefined' : typeof seen.httpReq }));
await app.close();
