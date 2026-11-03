// Prints the inferred type in the error message.
declare function first<T>(items: T[]): T | undefined;
const x = first([1, "a"]);
export const show: null = x;
declare function both<T>(a: T, b: T): T;
both(1, "a");
