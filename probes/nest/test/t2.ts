import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';

// Test Track: what a useValue fake for PaymentsService has to contain.
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const done = () => console.log('fails', fails);

@Injectable() class PaymentsService {
  charge(amount: number) { return `real charge ${amount}`; }
  refund(id: string) { return `real refund ${id}`; }
  history() { return []; }
}
@Injectable() class OrdersService {
  constructor(private payments: PaymentsService) {}
  checkout(total: number) { return this.payments.charge(total); }
  cancel(id: string) { return this.payments.refund(id); }
}

const calls: number[] = [];
const fake = { charge: (amount: number) => { calls.push(amount); return 'fake'; } };
const mod = await Test.createTestingModule({
  providers: [OrdersService, { provide: PaymentsService, useValue: fake }],
}).compile();
const orders = mod.get(OrdersService);
ok(orders.checkout(50) === 'fake' && calls[0] === 50, 'a fake with only charge() compiles, and checkout uses it');
ok(!(mod.get(PaymentsService) instanceof PaymentsService), 'the fake is a plain object, not an instance of the real class');
let err = '';
try { orders.cancel('o1'); } catch (e) { err = String(e); }
console.log('calling a method the fake lacks:', err);
ok(err.includes('TypeError') && err.includes('refund'), 'only a method the test actually calls has to exist; a missing one throws when called');
ok(false, 'SANITY should fail');
done();
