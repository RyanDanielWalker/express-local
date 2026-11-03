// Prints the inferred type in the error message.
declare function first<T>(items: T[]): T | undefined;
const x = first([1, "a"]);
export const show: null = x;
declare function both<T>(a: T, b: T): T;
both(1, "a");
const scores = new Map<string, number>();
export const showMap: null = scores.get("ann");
type User = { name: string };
declare function getUser(): Promise<User>;
declare function getCount(): Promise<number>;
export const showAll: null = await Promise.all([getUser(), getCount()]);
declare function pluck<T, K extends keyof T>(obj: T, keys: K[]): T[K][];
export const showPluck: null = pluck({ id: "1", age: 38 }, ["id", "age"]);
