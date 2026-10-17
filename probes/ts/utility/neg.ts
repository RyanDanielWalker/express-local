type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { id: string; name: string; email: string; passwordHash: string };

// Partial
type P = Partial<User>;
declare const p: P; const n = p.name; const t1: Expect<typeof n, string | undefined> = true;
// @ts-expect-error no built-in Optional
type O1 = Optional<User>;
// @ts-expect-error Pick needs keys
type O2 = Pick<User>;

// Omit vs Exclude on an object
const t2: Expect<Omit<User, 'passwordHash'>, { id: string; name: string; email: string }> = true;
const t3: Expect<Exclude<User, 'passwordHash'>, User> = true;
// @ts-expect-error no Without
type O3 = Without<User, 'passwordHash'>;

// Record vs Map, no Index
const r: Record<string, User> = {}; const m: Map<string, User> = new Map();
// @ts-expect-error no built-in Index
type O4 = Index<string, User>;

// ReturnType / Parameters / Awaited
declare function getStatus(x: number): 'on' | 'off';
const t4: Expect<ReturnType<typeof getStatus>, 'on' | 'off'> = true;
const t5: Expect<Parameters<typeof getStatus>, [x: number]> = true;
declare function getUser(): Promise<User>;
const t6: Expect<ReturnType<typeof getUser>, Promise<User>> = true;
const t7: Expect<Awaited<ReturnType<typeof getUser>>, User> = true;
const t8: Expect<Awaited<Promise<Promise<number>>>, number> = true;

// ROLES
const ROLES = ['admin', 'editor'] as const;
type Role = typeof ROLES[number];
const t9: Expect<Role, 'admin' | 'editor'> = true;
const t10: Expect<'length' extends keyof typeof ROLES ? true : false, true> = true;

// NonNullable vs Exclude null vs Required
const t11: Expect<NonNullable<string | null | undefined>, string> = true;
const t12: Expect<Exclude<string | null | undefined, null>, string | undefined> = true;

// Exclude / Extract on unions
type Status = 'active' | 'banned' | 'internal';
const t13: Expect<Exclude<Status, 'internal'>, 'active' | 'banned'> = true;
type Ev = { type: 'click'; x: number } | { type: 'keydown'; key: string };
const t14: Expect<Extract<Ev, { type: 'click' }>, { type: 'click'; x: number }> = true;

// Mapped type
type Flags<T> = { [K in keyof T]: boolean };
const t15: Expect<Flags<{ a: string; b: number }>, { a: boolean; b: boolean }> = true;

// Pick syntax and typos
const t16: Expect<Pick<User, 'id' | 'email'>, { id: string; email: string }> = true;
// @ts-expect-error array is not a key union
type O5 = Pick<User, ['id', 'email']>;
// @ts-expect-error typo in Pick
type O6 = Pick<User, 'emial'>;
type O7 = Omit<User, 'pasword'>; // compiles
const t17: Expect<O7, User> = true;

// Readonly, shallow
type Settings = { theme: string; nested: { size: number } };
declare const s: Readonly<Settings>;
// @ts-expect-error readonly
s.theme = 'dark';
s.nested.size = 3; // shallow: allowed
const frozen = Object.freeze({ theme: 'x' }); const t18: Expect<typeof frozen, Readonly<{ theme: string }>> = true;
// @ts-expect-error no Frozen
type O8 = Frozen<Settings>;
// @ts-expect-error no Immutable
type O9 = Immutable<Settings>;

// Record with key union requires all
// @ts-expect-error missing editor
const rc: Record<'admin' | 'editor', number> = { admin: 1 };
const rc2: Partial<Record<'admin' | 'editor', number>> = { admin: 1 };

// Omit on a union, Exclude on an object compile
type OU = Omit<Ev, 'x'>;
const t19: Expect<OU, { type: 'click' | 'keydown' }> = true;
export {};
const bad: Expect<Role, 'admin'> = true;
