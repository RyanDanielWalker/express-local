import 'reflect-metadata';
import { Injectable, Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
@Injectable() class UsersService { who() { return 'real' } }
@Controller('u') class UsersController { constructor(public s: UsersService) {} }
const fake = { who: () => 'fake' };
const a = await Test.createTestingModule({ controllers: [UsersController], providers: [UsersService] }).useMocker(() => fake).compile();
console.log('useMocker when provided ->', a.get(UsersController).s.who());
const b = await Test.createTestingModule({ controllers: [UsersController], providers: [UsersService] }).overrideProvider(UsersService).useValue(fake).compile();
console.log('overrideProvider ->', b.get(UsersController).s.who());
const ob = Test.createTestingModule({}).overrideModule(class X {});
console.log('overrideModule builder methods ->', Object.keys(ob));
