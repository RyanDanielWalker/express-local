import { slugify } from 'tiny-slug';
const s: string = slugify('Hello World');
// @ts-expect-error not declared
import { other } from 'tiny-slug';
export {};
