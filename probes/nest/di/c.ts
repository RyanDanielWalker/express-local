import 'reflect-metadata';
import { Injectable, Inject, forwardRef, Module, Global } from '@nestjs/common';
import { Test } from '@nestjs/testing';
@Injectable() class Auth { constructor(@Inject(forwardRef(() => Users)) public u: any) {} }
@Injectable() class Users { constructor(@Inject(forwardRef(() => Auth)) public a: Auth) {} }
@Injectable() class Auth2 { constructor(@Inject('U') public u: any) {} }
@Injectable() class Users2 { constructor(@Inject('A') public a: any) {} }
async function t(name: string, providers: any[]) {
  try { const m = await Test.createTestingModule({ providers }).compile(); console.log(name, '-> ok', !!m.get(providers[0].provide ?? providers[0]).u || !!m.get(providers[0]).a) }
  catch (e: any) { console.log(name, '->', e.message.split('\n')[0].slice(0, 110)) }
}
await t('one module, no forwardRef', [{ provide: 'A', useClass: Auth2 }, { provide: 'U', useClass: Users2 }]);
await t('forwardRef both sides', [Auth, Users]);
