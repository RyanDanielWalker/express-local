import type { Guide, Line, TsLineId } from '../engine/types';

/**
 * The TypeScript division: the half of the job that shows up in every code
 * review. Behavior follows TypeScript 5 with `strict` on, which is what both
 * the NestJS and the Vite React templates ship with.
 */
export const TS_LINES: Line[] = [
  {
    id: 'narrow',
    division: 'ts',
    kind: 'quiz',
    bullet: 'T',
    color: '--blue',
    short: 'Narrowing',
    name: 'Narrow Gauge',
    topic: 'Narrowing and type guards',
    pitch: 'Narrowing is TypeScript reading your if statements. Once that clicks, most red squiggles start to make sense, and the fix turns out to be a check, not a cast.',
    rules: [
      'Each question asks what TypeScript knows at one spot in the code.',
      'Your if statements are what teach it.',
      'Watch for the things that make it forget, like a callback that runs later.',
    ],
    hook: 'Which check to use: typeof for strings, numbers and other primitives. instanceof for things made from a class. `in` for objects with different keys. A shared field like `kind` or `ok` for unions you design yourself.',
    par: 95,
    drill: 'First ask what kinds of things are in the union. Strings and numbers? Objects made from classes? Objects with different keys? Objects with a shared field like `kind`? Then ask: at this line, which checks have already passed or failed?',
    sorts: [
      {
        t: 1,
        title: 'Which check would you use to tell these apart?',
        buckets: ['typeof', 'instanceof', 'Property check (in)', 'Shared field'],
        items: [
          { name: 'Is it a string or a number?', bucket: 'typeof', why: 'typeof is made for primitives: strings, numbers, booleans and the like.' },
          { name: 'A boolean flag, or a callback function', bucket: 'typeof', why: 'typeof returns \'function\' for a function, so it can tell one apart from a boolean.' },
          { name: 'Did save() throw a ValidationError class you wrote?', bucket: 'instanceof', why: 'The error was made with new ValidationError(...). instanceof checks exactly that.' },
          { name: 'Fish has swim(), Bird has fly(), no field in common', bucket: 'Property check (in)', why: 'There is no field both have, so check for a key only one of them has: \'swim\' in pet.' },
          { name: 'An Admin has permissions, a Guest does not', bucket: 'Property check (in)', why: '\'permissions\' in user tells them apart. instanceof will not work: these are plain objects, often straight from JSON, not made from a class.' },
          { name: 'Every event has type: "click" or type: "keydown"', bucket: 'Shared field', why: 'Every event has a type field, with a different value in each. Check it and you know exactly which event you have.' },
          { name: 'A Result that is ok: true or ok: false', bucket: 'Shared field', why: 'ok is true in one member and false in the other. Check it, and you know whether you have data or an error.' },
        ],
        note: 'typeof for primitives and functions. instanceof for things made from a class. A property check for objects with different keys and nothing in common. A shared field when you design the type yourself: one check tells you exactly which member you have.',
      },
      {
        t: 1,
        title: '`value` is `string | number`. What is its type at each spot?',
        buckets: ['Just string', 'Just number', 'Both still', 'never'],
        items: [
          { name: 'The first line of the function', bucket: 'Both still', why: 'No check has run yet, so value could still be either one.' },
          { name: 'Inside if (typeof value === \'string\')', bucket: 'Just string', why: 'The check passed, so value is a string.' },
          { name: 'In the else of that same if', bucket: 'Just number', why: 'The check failed, so string is ruled out. Only number is left.' },
          { name: 'After if (typeof value === \'string\') return;', bucket: 'Just number', why: 'If value was a string, the function already returned. So every line below knows it is a number. This is called a guard clause.' },
          { name: 'Inside if (typeof value !== \'string\')', bucket: 'Just number', why: 'The same check, flipped with !==. TypeScript follows the logic, not the wording.' },
          { name: 'Inside if (typeof value === \'boolean\')', bucket: 'never', why: 'Nothing in string | number is a boolean, so nothing can get in here. TypeScript gives this branch the type never: the type with no values.' },
        ],
        note: 'Every check splits the code in two: the branch where it passed, and the branch where it failed. An early return means everything below it is the failed branch. A check nothing can pass leaves never.',
      },
    ],
    questions: [
      { t: 1, q: 'What is the type of `value` inside the if?', code: `function f(value: string | number) {\n  if (typeof value === 'string') {\n    // value is ???\n  }\n}`, opts: ['string', 'string | number', 'unknown'], a: 'string', why: 'TypeScript reads the typeof check. Inside the if, value can only be a string, so you can call string methods on it with no cast. It is not still string | number: the check already ruled out number.' },
      { t: 1, q: 'You have `user: User | null`. What is the cleanest way to deal with the null?', opts: ['Return early if user is null', 'Cast it with `user as User`', 'Reach for user!.name instead'], a: 'Return early if user is null', why: 'Check once at the top: `if (!user) return;`. Below that line, TypeScript knows user is a User. A cast or a ! also makes the warning go away, but neither one handles the null. If user really is null, the app still crashes.' },
      { t: 1, q: 'What does narrowing mean?', opts: ['TypeScript following the checks you write', 'Making a type smaller by hand, with a cast', 'Removing properties from an object'], a: 'TypeScript following the checks you write', why: 'When you write a check like typeof or instanceof, TypeScript uses it. Inside that branch, the type gets more specific. A cast is the opposite: you tell TypeScript what the type is, and it takes your word for it without checking.' },
      { t: 2, q: 'How do you tell these two apart in code?', code: `type Result =\n  | { ok: true; data: string }\n  | { ok: false; error: string };`, opts: ['Check result.ok, the shared field', 'Check if data is undefined', 'Use instanceof on the result'], a: 'Check result.ok, the shared field', why: 'Both members have an ok field, with a different value in each: true in one, false in the other. Check ok and TypeScript knows which one you have. This is called a discriminated union, and ok is the discriminant. Checking data does not work, because TypeScript will not let you read data until it knows which member you have. instanceof does not work either: these are types, not classes.' },
      { t: 2, q: 'What does the `in` operator do here?', code: `if ('role' in account) { ... }`, opts: ['Narrows to the member with that key', 'Checks that the value is not null', 'Checks that account.role is truthy'], a: 'Narrows to the member with that key', why: '`\'role\' in account` asks one question: does this object have a role key? TypeScript keeps only the members of the union that have one. Use it when the members have no shared field to check. It does not look at the value: a role set to undefined still passes.' },
      { t: 2, q: 'Why does TypeScript forget the check inside the callback?', code: `if (obj.user) {\n  doSomething(() => obj.user.name);\n}`, opts: ['A callback can run later, when obj.user may have changed', 'Arrow functions throw away the types of whatever they capture', 'obj.user is readonly inside the callback'], a: 'A callback can run later, when obj.user may have changed', why: 'Inside the if, TypeScript knows obj.user exists. But the arrow function might run later, after something has set obj.user back to undefined. TypeScript cannot rule that out, so inside the callback it forgets your check. The fix: save it first with `const user = obj.user`, and use user in the callback. A const cannot change, so the check still holds.' },
      { t: 2, q: 'Why put this `never` line in the default of a switch?', code: `default: {\n  const _exhaustive: never = kind;\n  throw new Error(kind);\n}`, opts: ['It fails to compile when a case is missed', 'It turns off type checking in default', 'It marks the switch as complete'], a: 'It fails to compile when a case is missed', why: 'never is the type with no values. If every case above is handled, nothing is left for the default, so kind is never there and the line compiles. Add a new member to the union and forget this switch, and that member ends up in the default. It does not fit in a never, so the build fails right here. The throw is a backup for bad data that slips past the types at runtime.' },
      { t: 3, q: 'Which part makes this a type predicate?', code: `function isCat(pet: Pet): pet is Cat {\n  return 'meow' in pet;\n}`, opts: ['The `pet is Cat` return type', 'The `in` check in the body', 'Returning a boolean value'], a: 'The `pet is Cat` return type', why: 'A type predicate is a function that tells TypeScript what a true result proves. `pet is Cat` is that promise. The `in` check is just how the function decides. Since TypeScript 5.5, if you leave the return type off, TypeScript can work out `pet is Cat` from a simple body like this one. But write `: boolean` as the return type, and callers get no narrowing at all.' },
      { t: 3, q: 'What is wrong with this type predicate?', code: `function isUser(x: unknown): x is User {\n  return true;\n}`, opts: ['You promised what the code never checks', 'Predicates cannot take unknown', 'It should return x instead of true'], a: 'You promised what the code never checks', why: 'TypeScript does not check that the body keeps the promise in the return type. It just believes `x is User`. This one returns true for anything, so a number or a string would pass as a User. That is as dangerous as a cast, and harder to spot in a code review. Taking unknown is fine, and is exactly what predicates are for.' },
      { t: 3, q: 'strictNullChecks is on. What does `string | undefined` make you do?', opts: ['Handle the undefined case before using it', 'Initialize every variable at declaration', 'Stop using optional properties and default parameters'], a: 'Handle the undefined case before using it', why: 'With this setting on, undefined is its own type, separate from string. So a string | undefined is not a string until you check. You have to handle the missing case before you use it. Optional properties are still fine: they just come with that check. The setting is part of strict, which is on by default since TypeScript 6.0.' },
      { t: 1, q: 'What is `err` inside the if?', code: `try {\n  await save();\n} catch (err) {\n  if (err instanceof Error) {\n    console.log(err.message); // err is ???\n  }\n}`, opts: ['Error', 'unknown', 'any'], a: 'Error', why: 'In JavaScript you can throw anything, even a string, so TypeScript does not know what landed in catch. With strict on, the default since TypeScript 6.0, err starts as unknown. The instanceof check proves it is an Error, so inside the if you can read err.message.' },
      { t: 1, q: '`count` is `number | undefined`. Why is `if (count)` a risky check?', opts: ['It skips 0 as well as undefined', 'It does not narrow out undefined', 'It only works when count is a string'], a: 'It skips 0 as well as undefined', why: 'An if treats 0 the same as false. So `if (count)` skips undefined, which you wanted, and also skips a real count of 0, which you did not. When 0 is a valid value, write `if (count !== undefined)` instead. An empty string has the same trap.' },
      { t: 1, q: '`input` is `string | string[]`. Which check narrows it to string[]?', opts: ['Array.isArray(input)', 'typeof input === \'array\'', 'input.length > 0'], a: 'Array.isArray(input)', why: 'Array.isArray is the built-in check for arrays, and in the else, input is a string. typeof never returns \'array\'. For an array it returns \'object\', and TypeScript flags the comparison because it can never be true. Checking length does nothing, because strings have a length too.' },
      { t: 1, q: 'What is `value` in the else?', code: `function f(value: string | number | boolean) {\n  if (typeof value === 'string') {\n    // ...\n  } else {\n    // value is ???\n  }\n}`, opts: ['number | boolean', 'string | boolean', 'string | number | boolean'], a: 'number | boolean', why: 'Narrowing works in both directions. In the else, TypeScript knows value is not a string. So it takes string out of the union and keeps the rest. That leaves number and boolean. string is the one thing it cannot be.' },
      { t: 1, q: 'Inside `case \'circle\':`, what can you read off shape?', code: `type Shape =\n  | { kind: 'circle'; radius: number }\n  | { kind: 'square'; side: number };\n\nswitch (shape.kind) {\n  case 'circle':\n    // ???\n}`, opts: ['shape.radius, but not shape.side', 'Both shape.radius and shape.side', 'Neither, until you cast shape'], a: 'shape.radius, but not shape.side', why: 'Every Shape has a kind field, with a different value in each. Inside case \'circle\', TypeScript knows kind is \'circle\', so shape must be the circle, and only circles have radius. This pattern is called a discriminated union. It is the most common kind of narrowing in real code.' },
      { t: 1, q: 'A teammate writes `(pet as Cat).meow()` to clear a red squiggle. What does the `as` do when the code runs?', opts: ['Nothing. It is gone after compiling', 'Checks that pet really is a Cat', 'Converts pet into a Cat object'], a: 'Nothing. It is gone after compiling', why: '`as` only exists for TypeScript, and it is deleted when the code compiles. Nothing checks that pet is a Cat, and nothing turns it into one. If pet is a Dog, .meow() crashes. A real check like `if (\'meow\' in pet)` gives TypeScript the same information and is actually true.' },
      { t: 2, q: 'What is `value` inside the if?', code: `function f(value: object | null | string) {\n  if (typeof value === 'object') {\n    // value is ???\n  }\n}`, opts: ['object | null', 'object', 'Record<string, unknown>'], a: 'object | null', why: 'In JavaScript, typeof null is \'object\'. It is a bug from the very first version of the language, and fixing it now would break old websites. TypeScript copies the real behavior, so null gets through this check. Add `value !== null` before you read a property.' },
      { t: 2, q: 'TypeScript 5.5 or later. What is the type of `ids`?', code: `const ids = [1, undefined, 3].filter(x => x !== undefined);`, opts: ['number[]', '(number | undefined)[]', 'unknown[]'], a: 'number[]', why: 'Since TypeScript 5.5, TypeScript can tell that `x => x !== undefined` only keeps numbers, so filter returns number[]. Before 5.5 you got (number | undefined)[], and had to spell it out yourself: `.filter((x): x is number => x !== undefined)`.' },
    ],
  },
  {
    id: 'generics',
    division: 'ts',
    kind: 'quiz',
    bullet: 'G',
    color: '--purple',
    short: 'Generics',
    name: 'Generic Line',
    topic: 'Generics and inference',
    pitch: 'A generic is a placeholder for a type. Once you can read one, code like `Promise<User>` and `useState<T>` stops being noise and tells you exactly what comes back.',
    rules: [
      'Each question asks what T turns into, or what a signature promises.',
      'Look for T in the arguments. That is where TypeScript finds it.',
      'Whatever comes after `extends` is the minimum T has to have.',
    ],
    hook: 'T is a placeholder for a type, filled in when the function is called. TypeScript usually works it out from the arguments. `extends` sets the minimum T has to have, and `keyof T` is the list of T\'s keys.',
    par: 100,
    drill: 'Ask what T stands for here. Where can TypeScript find it: in the arguments, or nowhere? Then ask what comes after `extends`: what does T have to have, and what is it free to keep?',
    sorts: [
      {
        t: 1,
        title: 'Can TypeScript work out the type, or do you write it?',
        buckets: ['Inferred', 'Write it'],
        items: [
          { name: 'first([\'a\', \'b\'])', bucket: 'Inferred', why: 'The array is a string[], so T is string. Writing first<string> would just repeat it.' },
          { name: '[1, 2, 3].map(n => String(n))', bucket: 'Inferred', why: 'map works out its output from what the callback returns. String(n) is a string, so you get string[].' },
          { name: 'Promise.resolve(42)', bucket: 'Inferred', why: 'The value is a number, so you get Promise<number>.' },
          { name: 'new Set(), to fill with ids later', bucket: 'Write it', why: 'An empty Set has nothing to infer from, so you get Set<unknown>. Write new Set<number>().' },
          { name: 'new Map(), empty to start', bucket: 'Write it', why: 'Worse than Set: an empty Map is Map<any, any>, so TypeScript quietly stops checking what goes in or comes out. Write new Map<string, User>().' },
          { name: 'useState(null) for a user loaded later', bucket: 'Write it', why: 'From null alone, the state type is just null, so setUser(user) is an error. Write useState<User | null>(null).' },
        ],
        note: 'TypeScript works out the type from the arguments you pass. When there is nothing to work from, like an empty collection or a null placeholder, write the type yourself.',
      },
      {
        t: 1,
        title: '`byId<T extends { id: string }>(items: T[], id: string)`. Which calls compile?',
        buckets: ['Compiles', 'Error: no id', 'Error: id is not a string'],
        items: [
          { name: 'byId(users, \'7\'), where users have id and name', bucket: 'Compiles', why: 'Every user has a string id. The extra name is fine, because the constraint is a minimum.' },
          { name: 'byId(orders, \'A1\'), where orders have id and total', bucket: 'Compiles', why: 'Same rule. And what comes back is typed as an order, total included, not a bare { id }.' },
          { name: 'byId([{ id: \'1\', tags: [] }], \'1\')', bucket: 'Compiles', why: 'Extra fields of any kind are fine.' },
          { name: 'byId([{ name: \'Ana\' }], \'7\')', bucket: 'Error: no id', why: 'These objects have no id at all, so they do not meet the minimum.' },
          { name: 'byId([\'a\', \'b\'], \'a\')', bucket: 'Error: no id', why: 'Strings do not have an id.' },
          { name: 'byId([{ id: 7 }], \'7\')', bucket: 'Error: id is not a string', why: 'There is an id, but it is a number. The constraint asks for a string.' },
        ],
        note: 'T extends { id: string } sets a minimum: every item needs an id, and it has to be a string. Anything extra is fine, and T keeps it, so you get back the full type you passed in.',
      },
    ],
    questions: [
      { t: 1, q: 'What does this signature promise?', code: `function first<T>(items: T[]): T | undefined`, opts: ['The type the array holds, or undefined', 'A value typed any, which skips all checks', 'Unknown, so you have to check it first'], a: 'The type the array holds, or undefined', why: 'Call first with a string[] and T becomes string, so you get back string | undefined. Call it with User[] and you get User | undefined. The undefined is there because the array might be empty. Nothing in the signature says any or unknown: T carries the real type through.' },
      { t: 1, q: 'Do you have to write the type argument here?', code: `const names = first(['a', 'b']);`, opts: ['No, it is inferred from the argument', 'Yes, every generic call needs one', 'Only when strict mode is turned on'], a: 'No, it is inferred from the argument', why: 'TypeScript sees a string[] going in and works out that T is string. That is called inference. Writing first<string>([\'a\', \'b\']) also works, but it repeats what TypeScript already knows. Strict mode has nothing to do with it.' },
      { t: 1, q: 'Why use a generic instead of any?', opts: ['The type you pass in comes back', 'It compiles faster on big projects', 'It accepts fewer argument types'], a: 'The type you pass in comes back', why: 'With any, the return value is any, and TypeScript stops checking everything that touches it. With a generic, the type you passed in comes back out, so the rest of your code stays checked. Speed is the same either way: generics are deleted when the code compiles.' },
      { t: 1, q: 'What is `Array<string>`?', opts: ['The same type as string[]', 'An array of strings, or of anything', 'A special array class from TypeScript'], a: 'The same type as string[]', why: 'Array<string> and string[] are two ways to write the exact same type. Array is a generic, and string is the type that fills it in. You will see the long form in library code and in error messages, so it helps to read both.' },
      { t: 1, q: '`getUser()` returns `Promise<User>`. What does that mean?', opts: ['You get a User once you await it', 'It hands you a User right away, no await needed', 'It can resolve to any type at all'], a: 'You get a User once you await it', why: 'Promise is a generic, and User fills it in. Promise<User> means a promise that will give you a User later. await it, or call .then on it, and you have the User. Before that, all you have is the promise.' },
      { t: 1, q: 'Why write `new Set<number>()` instead of `new Set()`?', opts: ['An empty Set has nothing to infer from', 'Set always needs a type argument', 'It stops duplicate values'], a: 'An empty Set has nothing to infer from', why: 'TypeScript works out the type from what you pass in. An empty Set has nothing in it, so you get Set<unknown>, and everything you take out has to be checked. Write the type when there is nothing to infer from. new Set([1, 2]) works it out as Set<number> on its own, and a Set never holds duplicates either way.' },
      { t: 1, q: 'Which signature keeps the type of what you pass in?', opts: ['function identity<T>(x: T): T', 'function identity(x: any): any', 'function identity(x: unknown): unknown'], a: 'function identity<T>(x: T): T', why: 'With <T>, pass in a User and you get a User back. Pass in a number and you get a number. With any, you get any back, and TypeScript stops checking it. With unknown, you get unknown back, and you have to check it all over again.' },
      { t: 1, q: 'In `function wrap<T>(value: T)`, what is T?', opts: ['A placeholder for the type of value', 'A type named T you have to define', 'Another name for the type any'], a: 'A placeholder for the type of value', why: 'T is a type parameter. It works like a function parameter, but it holds a type. Call wrap(user) and T is User for that call. Call wrap(5) and T is a number. It is not another name for any: T is a real type, just a different one each call. The name T is only a habit. You could call it Value.' },
      { t: 1, q: 'What happens here?', code: `first<number>(['a', 'b']);`, opts: ['A compile error: those are strings', 'It works, and T becomes string', 'It works, and the strings become numbers'], a: 'A compile error: those are strings', why: 'Writing <number> sets T to number, so items has to be a number[]. You passed strings, so TypeScript reports an error. A type argument never converts anything. It only tells TypeScript what to expect.' },
      { t: 2, q: 'What does the constraint do?', code: `function byId<T extends { id: string }>(items: T[], id: string)`, opts: ['Requires an id, keeps the rest of the shape', 'Converts the items into { id: string }', 'Allows objects with only an id'], a: 'Requires an id, keeps the rest of the shape', why: 'T extends { id: string } means every item needs a string id. That is a minimum, not a conversion. Everything else on the object is still there, so pass in User[] and T is User, with name, email and the rest.' },
      { t: 2, q: 'Why is `x.length` an error here?', code: `function len<T>(x: T) {\n  return x.length;\n}`, opts: ['T could be anything, even a number', 'Generics are not allowed to have any properties', 'length only exists on arrays, not on strings'], a: 'T could be anything, even a number', why: 'Inside the function, T could be any type at all, including a number, which has no length. Add a minimum: <T extends { length: number }>. Now strings, arrays and anything else with a length are allowed, and x.length works.' },
      { t: 2, q: 'What does `K extends keyof T` give you here?', code: `function get<T, K extends keyof T>(obj: T, key: K): T[K]`, opts: ['Real keys, with the matching value type', 'Any string at all as a key, with an any value', 'Real keys, with the whole object type'], a: 'Real keys, with the matching value type', why: 'keyof T is the list of T\'s keys, so K has to be one of them, and a typo is a compile error. T[K] is the type stored at that key, so get(user, \'age\') returns number. Libraries like lodash use this pattern for get and pick.' },
      { t: 2, q: 'What is the type of `config`?', code: `const config = { mode: 'dark' } as const;`, opts: ['{ readonly mode: "dark" }', '{ mode: string }', '{ mode: "dark" | "light" }'], a: '{ readonly mode: "dark" }', why: 'Normally TypeScript turns "dark" into plain string, because the value could change later. as const keeps the exact value as the type, and marks it readonly. It is only a type: nothing is frozen when the code runs. Handy for config objects and lists of allowed values.' },
      { t: 2, q: 'A generic function compiles, but every call gives back unknown. What is the likely cause?', opts: ['Nothing in the arguments mentions T', 'The constraint is far too loose', 'The function is missing async'], a: 'Nothing in the arguments mentions T', why: 'TypeScript works out T from the arguments. If T only appears in the return type, there is nothing to work it out from, so it falls back to unknown. Now the caller has to write T, which usually means the generic is really a cast.' },
      { t: 3, q: 'What does the default type do?', code: `interface ApiResponse<T = unknown> {\n  data: T;\n}`, opts: ['Lets callers skip the type argument', 'Forces every caller to pass unknown', 'Makes T optional when the code runs'], a: 'Lets callers skip the type argument', why: 'With a default, ApiResponse on its own means ApiResponse<unknown>, so callers can skip the angle brackets. unknown is a safer default than any, because you have to check the data before you use it. Nothing changes when the code runs: generics do not exist by then.' },
      { t: 3, q: 'How do you type a React component that takes a list of anything?', code: `function List<T>({ items, render }: {\n  items: T[];\n  render: (item: T) => ReactNode;\n})`, opts: ['A generic component, T inferred from items', 'Type items as any[] and cast inside', 'One copy of the component per item type'], a: 'A generic component, T inferred from items', why: 'Make the component generic. TypeScript works out T from the items you pass, and render gets the same T, so item inside render is fully typed. any[] loses that, and one component per type is copy and paste. In a .tsx file, a generic arrow function needs a comma, <T,>(props) => ..., so it is not read as a JSX tag.' },
      { t: 3, q: 'What is wrong with this signature?', code: `function parse<T>(json: string): T`, opts: ['Callers claim any shape, nothing checks', 'Generics are not allowed to return object types', 'T has to extend object or it will not compile'], a: 'Callers claim any shape, nothing checks', why: 'T only appears in the return type, so the caller picks it, and nothing checks that the JSON matches. It looks type safe, but it is a cast. For data from outside the app, check it with a validation library like zod, and return a type that was actually checked.' },
    ],
  },
  {
    id: 'utility',
    division: 'ts',
    kind: 'quiz',
    bullet: 'U',
    color: '--teal',
    short: 'Utility types',
    name: 'Utility Yard',
    topic: 'Built-in utility types',
    pitch: 'Most type duplication in a codebase is a utility type nobody reached for. These are the ones that come up in review every week.',
    rules: ['Pick the type that does the job.', 'Derive types instead of retyping them.', 'One source of truth per shape.'],
    hook: 'Partial, Required, Pick, Omit, Record, ReturnType and Awaited cover most of it. Derive from the thing you already have so the two cannot drift apart.',
    par: 90,
    questions: [
      { t: 1, q: 'Every field optional, for a PATCH body:', opts: ['Partial<User>', 'Optional<User>', 'Pick<User>'], a: 'Partial<User>', why: 'Required<T> is the opposite. Both are one line instead of a second hand-written interface.' },
      { t: 1, q: 'A User without passwordHash:', opts: ['Omit<User, "passwordHash">', 'Exclude<User, "passwordHash">', 'Without<User, "passwordHash">'], a: 'Omit<User, "passwordHash">', why: 'Omit and Pick work on object keys. Exclude works on union members, which is a different job.' },
      { t: 1, q: 'A lookup of user id to User:', opts: ['Record<string, User>', 'Map<string, User>', 'Index<string, User>'], a: 'Record<string, User>', why: 'Record builds the object type. Map is the runtime structure, which is a separate decision.' },
      { t: 2, q: 'What does this give you?', code: `type Status = ReturnType<typeof getStatus>;`, opts: ['What getStatus returns, kept in sync', 'The parameter types of getStatus', 'The function type of getStatus'], a: 'What getStatus returns, kept in sync', why: 'typeof lifts the value into the type world, ReturnType reads its result. Change the function and the type follows.' },
      { t: 2, q: 'getUser returns Promise<User>. How do you name the resolved type?', opts: ['Awaited<ReturnType<typeof getUser>>', 'ReturnType<typeof getUser>', 'Promise<ReturnType<typeof getUser>>'], a: 'Awaited<ReturnType<typeof getUser>>', why: 'Awaited unwraps the promise, including nested ones. This shows up constantly around API clients.' },
      { t: 2, q: 'Union of the allowed values from this object:', code: `const ROLES = ['admin', 'editor'] as const;`, opts: ['typeof ROLES[number]', 'keyof typeof ROLES', 'ROLES[number] as const'], a: 'typeof ROLES[number]', why: 'Indexing the tuple type by number gives "admin" | "editor", so the list and the type cannot drift.' },
      { t: 2, q: 'Drop null and undefined from a type:', opts: ['NonNullable<T>', 'Exclude<T, null>', 'Required<T>'], a: 'NonNullable<T>', why: 'Required removes optionality on properties, which is a different thing from removing null from a union.' },
      { t: 3, q: 'What does Exclude do here?', code: `type Public = Exclude<Status, 'internal'>;`, opts: ['Removes that member from the union', 'Removes that key from an object', 'Marks the member deprecated'], a: 'Removes that member from the union', why: 'Exclude and Extract filter unions. Omit and Pick filter object keys. Mixing them up is a classic review comment.' },
      { t: 3, q: 'What does this mapped type produce?', code: `type Flags<T> = { [K in keyof T]: boolean };`, opts: ['The same keys, all boolean', 'A union of the key names', 'An array of boolean values'], a: 'The same keys, all boolean', why: 'Mapped types are how Partial and Readonly are written. Being able to read one is enough for most interviews.' },
      { t: 3, q: 'Your DTO and your entity drift apart constantly. What helps?', opts: ['Derive one from the other with Pick', 'Copy the fields and add a comment', 'Make both extend a loose interface'], a: 'Derive one from the other with Pick', why: 'Derivation makes the compiler catch the drift. Comments do not.' },
    ],
  },
  {
    id: 'unknown',
    division: 'ts',
    kind: 'quiz',
    bullet: 'X',
    color: '--magenta',
    short: 'any vs unknown',
    name: 'Unknown Territory',
    topic: 'any, unknown, never and assertions',
    pitch: 'Every codebase leaks types somewhere: a fetch response, a library without types, a quick cast at 5pm. Knowing the difference between any and unknown is the difference between a boundary and a hole.',
    rules: ['Pick what the compiler actually does.', 'Casts are claims, not checks.', 'Prefer the one that makes you prove it.'],
    hook: 'any turns checking off and spreads. unknown accepts anything but makes you narrow before use. never is the empty type, which is why it powers exhaustiveness checks.',
    par: 90,
    questions: [
      { t: 1, q: 'What is the difference between any and unknown?', opts: ['unknown makes you narrow before use', 'unknown is just a stricter alias', 'any is checked, unknown is not'], a: 'unknown makes you narrow before use', why: 'any disables checking and spreads through everything it touches. unknown stays safe at the boundary.' },
      { t: 1, q: 'What does `as User` actually do?', code: `const user = data as User;`, opts: ['Tells the compiler to trust you', 'Validates the shape at runtime', 'Converts the object to a User'], a: 'Tells the compiler to trust you', why: 'It is a claim, not a check. If the server sends something else, the error shows up far from the cast.' },
      { t: 1, q: 'What does the non-null `!` do here?', code: `const el = document.getElementById('root')!;`, opts: ['Promises it is not null, no check', 'Throws if the element is missing', 'Narrows it after a runtime check'], a: 'Promises it is not null, no check', why: 'Convenient in a bootstrap file, a landmine anywhere a value can legitimately be missing.' },
      { t: 2, q: 'A fetch returns JSON. What type should it start as?', opts: ['unknown, then validate', 'any, then use it', 'The DTO type, by assertion'], a: 'unknown, then validate', why: 'The network is untyped. Parse it with zod or class-validator and the type you return is one you earned.' },
      { t: 2, q: 'What does `satisfies` do?', code: `const config = { port: 3000 } satisfies Config;`, opts: ['Checks it against Config, keeps literals', 'Widens the value to the Config type', 'Asserts it is a Config at runtime'], a: 'Checks it against Config, keeps literals', why: 'You get the error if a field is wrong, and config.port stays 3000 rather than widening to number.' },
      { t: 2, q: 'What is `never` good for?', opts: ['Proving a case cannot happen', 'Marking a value as optional', 'Typing an empty object'], a: 'Proving a case cannot happen', why: 'It is the type with no values. Assigning to it in a default branch is how exhaustiveness checks work.' },
      { t: 2, q: 'What does a return type of `never` tell you?', opts: ['It throws or loops instead of returning', 'It returns undefined to every caller', 'It can return a value of any type'], a: 'It throws or loops instead of returning', why: 'void means the function returns nothing useful. never means control does not come back at all, which the compiler uses for reachability.' },
      { t: 3, q: 'A library has no types. What is the safest shim?', opts: ['Declare a module with the bits you call', 'Add a blanket any for the package', 'Turn noImplicitAny off for the file'], a: 'Declare a module with the bits you call', why: 'Type the three functions you actually call. Blanket any spreads into every call site that touches it.' },
      { t: 3, q: 'Why does a double assertion smell?', code: `const x = value as unknown as User;`, opts: ['It silences a mismatch the compiler flagged', 'Double assertions are a syntax error', 'It converts the value twice at runtime'], a: 'It silences a mismatch the compiler flagged', why: 'You needed two steps because the types genuinely do not overlap. It is fine in a test factory, suspicious in production code.' },
      { t: 3, q: 'What does `strict: true` actually turn on?', opts: ['A family of flags, strictNullChecks included', 'Only noImplicitAny, nothing else changes', 'Runtime type checks on function inputs'], a: 'A family of flags, strictNullChecks included', why: 'strictNullChecks, noImplicitAny, strictFunctionTypes and friends. It is the baseline worth insisting on in a new project.' },
    ],
  },
  {
    id: 'shapes',
    division: 'ts',
    kind: 'quiz',
    bullet: 'Y',
    color: '--slate',
    short: 'Shapes',
    name: 'Shape Yard',
    topic: 'Structural typing, interfaces and types',
    pitch: 'TypeScript compares shapes, not names. That one rule explains excess property checks, why interfaces and types are mostly interchangeable, and why a stray extra field is sometimes an error and sometimes not.',
    rules: ['Decide what the compiler allows.', 'Shape beats name, every time.', 'Notice when an object literal is treated differently.'],
    hook: 'If the shape fits, it is assignable. Object literals get an extra check for unknown properties, which is why the error appears on assignment but not through a variable.',
    par: 90,
    questions: [
      { t: 1, q: 'Does this compile?', code: `interface Point { x: number; y: number }\nconst p = { x: 1, y: 2, z: 3 };\nconst q: Point = p;`, opts: ['Yes, the shape fits', 'No, z is not on Point', 'Only with a cast'], a: 'Yes, the shape fits', why: 'Structural typing: extra properties are fine when they arrive through a variable.' },
      { t: 1, q: 'And this one?', code: `const q: Point = { x: 1, y: 2, z: 3 };`, opts: ['No, the literal gets an excess property check', 'Yes, the shape still fits the interface', 'Yes, unless strict mode is turned on'], a: 'No, the literal gets an excess property check', why: 'The literal check catches typos like onClik. Assigning through a variable skips it, which surprises everyone once.' },
      { t: 1, q: 'interface or type, for an object shape?', opts: ['Either. Pick one and be consistent', 'interface, types cannot describe objects', 'type, interfaces are deprecated'], a: 'Either. Pick one and be consistent', why: 'Interfaces merge across declarations and read well in errors. Types do unions and mapped types. Most teams default to one.' },
      { t: 2, q: 'What can a type alias do that an interface cannot?', opts: ['Describe a union', 'Describe an object', 'Be used as a React prop type'], a: 'Describe a union', why: 'type Result = A | B has no interface equivalent. Interfaces get declaration merging in return.' },
      { t: 2, q: 'What is the difference?', code: `type A = { name?: string };\ntype B = { name: string | undefined };`, opts: ['B requires the key to be present', 'They behave exactly the same way', 'A also allows null as a value'], a: 'B requires the key to be present', why: 'Optional means the key can be missing. A union with undefined means the key must exist, even if the value is undefined.' },
      { t: 2, q: 'What does `readonly` give you?', code: `interface Props { readonly items: string[] }`, opts: ['No reassigning items, but push works', 'A deeply frozen array at runtime', 'An error if anything mutates it'], a: 'No reassigning items, but push works', why: 'Use readonly string[] for the elements too. It is a compile-time hint, nothing is frozen at runtime.' },
      { t: 2, q: 'What does an index signature cost you?', code: `interface Bag { [key: string]: string }`, opts: ['Any key type-checks, typos included', 'Nothing, it is strictly an upgrade', 'Known keys stop being checked'], a: 'Any key type-checks, typos included', why: 'Record with a key union, or a Map, keeps the typo protection you gave up.' },
      { t: 3, q: 'Why does this fail?', code: `function render(props: { onClick: () => void }) {}\nrender({ onClick: () => {}, onHover: () => {} });`, opts: ['Excess property check on the literal', 'Handlers are compared by their name', 'Both handlers must be optional here'], a: 'Excess property check on the literal', why: 'Same rule as before, now at a call site. Assigning the object to a variable first would compile.' },
      { t: 3, q: 'Two different interfaces with identical fields. Assignable?', opts: ['Yes, names do not matter', 'No, nominal typing applies', 'Only if one extends the other'], a: 'Yes, names do not matter', why: 'That is structural typing. Branded types are the workaround when you want UserId and OrderId to stay apart.' },
      { t: 3, q: 'How do you make impossible props impossible?', code: `type Props =\n  | { status: 'loading' }\n  | { status: 'done'; data: string };`, opts: ['A discriminated union of valid shapes', 'Optional fields plus a code comment', 'A separate component for each case'], a: 'A discriminated union of valid shapes', why: 'Now data cannot be read while loading, and the compiler enforces it instead of a code review.' },
    ],
  },
  {
    id: 'reactts',
    division: 'ts',
    kind: 'quiz',
    bullet: 'Z',
    color: '--lime',
    darkText: true,
    short: 'TS + React',
    name: 'Typed Components',
    topic: 'TypeScript in React code',
    pitch: 'This is where the two halves of your day meet: props, events, refs and hooks. The questions here are the ones that actually come up while writing a component.',
    rules: ['Pick what you would really write.', 'Props, events, refs and hook generics.', 'Modern React types, not the 2019 ones.'],
    hook: 'Type the props object directly, use ReactNode for children, name events by their element, and give useState or useRef a type argument when the first value cannot tell the compiler enough.',
    par: 95,
    questions: [
      { t: 1, q: 'How do you type a component with props?', opts: ['function Card({ title }: { title: string })', 'const Card: React.FC = ({ title }) => ...', 'function Card(props: any) { ... }'], a: 'function Card({ title }: { title: string })', why: 'Plain annotation. React.FC lost its main advantage when implicit children went away in the React 18 types.' },
      { t: 1, q: 'What type do you give children?', opts: ['ReactNode', 'JSX.Element', 'string'], a: 'ReactNode', why: 'ReactNode covers elements, strings, numbers, arrays, null. JSX.Element is only a single element.' },
      { t: 1, q: 'What is the type of this state?', code: `const [user, setUser] = useState<User | null>(null);`, opts: ['User | null, as written', 'User, narrowed after load', 'null, forever and always'], a: 'User | null, as written', why: 'Without the argument it infers null and nothing else can be set. This is the most common useState annotation.' },
      { t: 2, q: 'How do you type this handler?', code: `<input onChange={e => ...} />`, opts: ['ChangeEvent<HTMLInputElement>', 'InputEvent<HTMLInputElement>', 'DOMEvent<HTMLInputElement>'], a: 'ChangeEvent<HTMLInputElement>', why: 'Inline handlers get it for free. You only name the type when the function lives outside the JSX.' },
      { t: 2, q: 'What is the type of a DOM ref?', code: `const inputRef = useRef<HTMLInputElement>(null);`, opts: ['current is HTMLInputElement | null', 'current is HTMLInputElement always', 'current is any until it mounts'], a: 'current is HTMLInputElement | null', why: 'React fills it after mount, so you check it before use. That null is honest, not an inconvenience.' },
      { t: 2, q: 'How do you reuse a prop type from another component?', opts: ['ComponentProps<typeof Button>', 'ReturnType<typeof Button>', 'InferProps<typeof Button>'], a: 'ComponentProps<typeof Button>', why: 'Great for wrappers: take everything Button takes, add one prop, pass the rest through.' },
      { t: 2, q: 'How do you type a component that takes children plus props?', opts: ['{ title: string; children: ReactNode }', 'React.FC, which adds children for you', 'PropsWithChildren is now required'], a: '{ title: string; children: ReactNode }', why: 'Just declare it. PropsWithChildren<Props> works too, but spelling it out reads better in errors.' },
      { t: 3, q: 'How do you type a reducer action?', code: `type Action =\n  | { type: 'add'; text: string }\n  | { type: 'remove'; id: string };`, opts: ['A discriminated union on type', 'An interface with optional fields', 'Record<string, unknown>'], a: 'A discriminated union on type', why: 'Inside the switch each case narrows to exactly its payload, which is the whole reason useReducer feels good in TypeScript.' },
      { t: 3, q: 'What does this generic component give you?', code: `function Select<T>({ options, onPick }: { options: T[]; onPick: (value: T) => void })`, opts: ['onPick knows the option type', 'Fewer re-renders of the list', 'Automatic memoization of options'], a: 'onPick knows the option type', why: 'Without the generic you end up with any in the callback, which is exactly where a wrong assumption hides.' },
      { t: 3, q: 'A prop should be required only when another is set. How?', opts: ['Union of the valid prop shapes', 'Make both optional and check at runtime', 'Use any for both'], a: 'Union of the valid prop shapes', why: 'Same discriminated union trick as state. The compiler rejects the combination instead of a runtime warning.' },
    ],
  },
];

/** Field guide for the TypeScript division, including interview talking points. */
export const TS_GUIDE: Record<TsLineId, Guide> = {
  narrow: {
    plain: 'Narrowing is TypeScript reading your if statements. Check `typeof value === \'string\'`, and inside that if, TypeScript knows `value` is a string.\n\nThis matters most with types like `User | null`. When TypeScript warns that `user` might be null, the fix is almost never a cast like `user as User`. A cast hides the warning, but the crash is still there. The fix is a check: `if (!user) return;`. You needed that check anyway, because your app has to do something when there is no user. The red squiggle was pointing at a real gap.',
    words: [
      ['union', 'A type that can be one of several things, like `string | number` or `User | null`.'],
      ['narrowing', 'TypeScript making a type more specific inside an if, because of the check you wrote.'],
      ['discriminated union', 'A union of objects that all share one field, like `kind` or `ok`, with a different value in each. Check that field, and TypeScript knows which object you have.'],
      ['type predicate', 'A function whose return type is `x is Thing`. When it returns true, TypeScript treats x as a Thing at the place you called it.'],
      ['never', 'The type with no values. It shows up when every possibility has been ruled out.'],
      ['exhaustiveness check', 'A `never` line in the default of a switch. If someone adds a member to the union and forgets this switch, the build fails.'],
    ],
    code: {
      label: 'a union you can trust',
      snippet: `type Result =\n  | { ok: true; data: User }\n  | { ok: false; error: string };\n\nfunction show(result: Result) {\n  if (result.ok) {\n    return result.data.name; // ok is true here\n  }\n  return result.error; // ok is false here\n}`,
    },
    say: [
      'Narrowing is TypeScript reading my if statements. So when it warns me that something might be null, I write the check instead of a cast.',
      'For unions I design myself, I give every member a shared field like `kind`. A switch on it, with a `never` line in the default, makes the build fail if I miss a case.',
      'A type predicate is a promise TypeScript takes at face value. If the function checks less than it claims, it is a cast with a nicer name.',
      'TypeScript forgets a check on an object property inside a callback, because the callback might run after the property changed. I copy it into a const first.',
    ],
    gotcha: 'The `!` after a value and `as Something` both tell TypeScript to stop checking. Neither one changes what happens when the code runs. The warning goes away, and the crash moves to production.',
    rehearse: [
      { prompt: 'What is narrowing, and how do you use it day to day?', answer: 'Narrowing is TypeScript following the checks I already write. If I check typeof value === \'string\', then inside that if, TypeScript knows value is a string. Same for instanceof, `in`, and a switch on a shared field. So when TypeScript warns me that something might be null, I write the check that handles it, instead of a cast that hides it.' },
      { prompt: 'How do you make sure a switch handles every case of a union?', answer: 'I put a never in the default case, like const unhandled: never = value. If every case is handled, nothing is left over, so it compiles. If someone adds a member to the union and forgets this switch, the leftover member does not fit in a never, so the build fails and points right at it.' },
      { prompt: 'When would you write a type predicate, and what is the risk?', answer: 'When a check gets reused, or is too long to write inline. For example, isUser for a response from an API. Its return type is `x is User`, so anywhere it returns true, TypeScript treats x as a User. The risk is that TypeScript believes it completely. If the function checks less than it promises, it is a cast with a nicer name. Since TypeScript 5.5, simple ones like x => x !== undefined in a filter get inferred, so I only write one by hand when TypeScript cannot work it out.' },
    ],
  },
  generics: {
    plain: 'A generic is a placeholder for a type. Look at `function first<T>(items: T[]): T | undefined`. Call it with an array of strings, and T becomes string, so you get a string back. Call it with an array of users, and you get a user back.\n\nThat is the whole point: the type that goes in decides the type that comes out. With `any`, you would get `any` back, and TypeScript would stop checking it. You almost never write T yourself. TypeScript works it out from the arguments, which is called inference.\n\nYou can also set a minimum. `T extends { id: string }` means T can be any object, as long as it has a string id. Pass in a User and you still get a User back, with all its other fields.',
    words: [
      ['type parameter', 'The placeholder in angle brackets, usually called T. It gets filled in with a real type each time the function is called.'],
      ['type argument', 'The real type that fills the placeholder, like string in `first<string>`. Usually inferred, so you rarely write it.'],
      ['inference', 'TypeScript working out T from the arguments you passed, so you do not have to write it.'],
      ['constraint', '`T extends { id: string }`: the minimum T has to have. Anything extra is fine, and T keeps it.'],
      ['keyof', '`keyof User` is the list of User\'s keys as a type, like `\'id\' | \'name\'`.'],
      ['indexed access', '`User[\'name\']` is the type of the name field, like string. With a key type K, `T[K]` is the type stored at that key.'],
      ['as const', 'Keeps exact values as types. `\'dark\'` stays `\'dark\'` instead of becoming plain string. Only a type: nothing is frozen at runtime.'],
    ],
    code: {
      label: 'the signature worth memorizing',
      snippet: `function get<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}\n\nconst user = { id: '1', age: 38 };\nget(user, 'age');   // number\nget(user, 'nope');  // error: 'nope' is not a key of user`,
    },
    say: [
      'A generic keeps the link between what goes in and what comes out. any throws that link away.',
      'I let TypeScript infer the type argument. I only write it when there is nothing to infer from, like an empty Set or useState(null).',
      'A constraint is a minimum, not a conversion. Pass a User to a function that needs an id, and you still get a User back.',
      'A generic that only shows up in the return type, like parse<T>(json): T, is a cast in disguise. I check the data instead.',
    ],
    gotcha: 'Generics only exist for TypeScript. They are deleted when the code compiles, so `parse<User>(json)` checks nothing. If data comes from outside your code, like an API response or a form, check it with real code.',
    rehearse: [
      { prompt: 'Explain generics to someone who has only used them by accident.', answer: 'A generic is a placeholder for a type. Take a function first<T> that returns the first item of an array. Pass it an array of strings and you get a string back. Pass it users and you get a user back. The type that goes in decides the type that comes out. With any, that link is gone, and you just get any back.' },
      { prompt: 'When is a generic the wrong tool?', answer: 'When it is really a cast. parse<T>(json: string): T lets the caller pick any T, and nothing checks that the JSON matches. It looks type safe and is not. For data from outside the app, I validate it with something like zod, and return a type that was actually checked.' },
      { prompt: 'Walk me through get<T, K extends keyof T>(obj: T, key: K): T[K].', answer: 'T is the object\'s type, worked out from obj. keyof T is the list of its keys, so K extends keyof T means key has to be one of them, and a typo is a compile error. T[K] is the type stored at that key. So get(user, \'age\') returns a number, not any. It ties the key you pass in to the type you get back.' },
    ],
  },
  utility: {
    plain: "Utility types let you build one type out of another instead of writing it twice. Partial makes everything optional, Pick and Omit take or drop keys, Record builds a lookup, ReturnType and Awaited read a function's result, and typeof lifts a value you already have into the type world. The real win is that derived types cannot drift: change the source and everything built on it follows or fails to compile.",
    words: [
      ['Partial / Required', 'Make every property optional, or every property required.'],
      ['Pick / Omit', 'Keep or drop keys of an object type.'],
      ['Record<K, V>', 'An object type with those keys and that value type.'],
      ['Exclude / Extract', 'Filter members of a union (not keys of an object).'],
      ['ReturnType / Awaited', "A function's return type, and that type with the promise unwrapped."],
      ['typeof value', 'Use a runtime value as a type.'],
    ],
    code: { label: 'derive, do not retype', snippet: `type User = { id: string; email: string; passwordHash: string };

type PublicUser = Omit<User, 'passwordHash'>;
type UserPatch = Partial<PublicUser>;
type UsersById = Record<string, PublicUser>;

const ROLES = ['admin', 'editor'] as const;
type Role = typeof ROLES[number];   // 'admin' | 'editor'` },
    say: [
      'I derive types from the one source of truth, so a change breaks the build instead of drifting quietly.',
      'Pick and Omit work on object keys, Exclude and Extract work on union members. Mixing them up is the common mistake.',
      'typeof ROLES[number] turns a real array into its union type, so the list and the type stay in sync.',
      'For API clients, Awaited<ReturnType<typeof fn>> saves writing the response type twice.',
    ],
    gotcha: 'Omit does not warn you when the key you removed no longer exists. Rename the field and the Omit quietly does nothing, so prefer Pick when the list is short.',
    rehearse: [
      { prompt: 'How do you keep a DTO and an entity from drifting apart?', answer: 'Derive one from the other with Pick or Omit instead of writing both by hand. Then renaming or removing a field is a compile error everywhere it matters, rather than something a reviewer has to notice.' },
      { prompt: 'Which utility types do you actually reach for, and for what?', answer: 'Partial for a patch body, Pick and Omit to derive a public shape from an entity, Record for a lookup, and Awaited of ReturnType to name what an async function resolves to. The point is one source of truth, so a change breaks the build instead of drifting.' },
    ],
  },
  unknown: {
    plain: "Every app has places where types come from outside: a fetch response, a JSON file, a library with no types. The question is what you do at that edge. `any` turns off checking and spreads to everything it touches. `unknown` accepts anything but refuses to let you use it until you narrow or validate, which is what you want at a boundary. A cast with `as` is a promise, not a check, so it moves the failure to runtime.",
    words: [
      ['any', 'Checking off. It spreads silently through every value it touches.'],
      ['unknown', 'Anything goes in, nothing comes out until you narrow it.'],
      ['never', 'The type with no values, used to prove a case cannot happen.'],
      ['assertion (as)', 'A claim the compiler accepts without checking.'],
      ['satisfies', 'Check a value against a type without widening it.'],
      ['strict', 'The flag family (strictNullChecks, noImplicitAny and friends).'],
    ],
    code: { label: 'a boundary worth copying', snippet: `const raw: unknown = await res.json();

const parsed = UserSchema.safeParse(raw);   // zod, or class-validator in Nest
if (!parsed.success) throw new BadRequestException();

const user = parsed.data;  // a type you earned, not one you claimed

const config = { port: 3000 } satisfies Config;  // port stays 3000` },
    say: [
      'At a boundary I start with unknown and validate, so the type I end up with is one I earned instead of one I claimed.',
      'any is contagious: it spreads through every value it touches and quietly turns off checking downstream.',
      '`as` is a promise to the compiler, not a runtime check, so I keep it out of code that handles real input.',
      'satisfies gives me the error if the shape is wrong while keeping the literal types, which is great for config objects.',
    ],
    gotcha: 'A double assertion (`value as unknown as User`) is the compiler telling you the types do not overlap. Fine in a test factory, a smell in production code.',
    rehearse: [
      { prompt: 'What is the difference between any and unknown, and when do you use each?', answer: 'any turns off checking and spreads to everything it touches. unknown accepts any value but will not let me use it until I narrow or validate it, so unknown is what I want at a boundary like a fetch response and any is a last resort.' },
      { prompt: 'Someone casts an API response with `as User`. What do you say in review?', answer: 'The cast is a promise, not a check, so if the server sends something else the failure shows up far away from the cast. I would parse the response and return a type the validation earned.' },
    ],
  },
  shapes: {
    plain: "TypeScript compares types by shape, not by name. If an object has the right properties, it fits, even if it was never declared as that type. One exception trips everyone once: an object literal assigned straight into a typed slot also gets checked for properties nobody asked for, which is how typos like onClik get caught. Interfaces and type aliases both describe shapes; interfaces merge across declarations, aliases can express unions.",
    words: [
      ['structural typing', 'Fit by shape, not by name. No implements needed.'],
      ['excess property check', 'The extra check applied to object literals at assignment.'],
      ['optional vs undefined', '`name?: string` can be missing. `name: string | undefined` cannot.'],
      ['readonly', 'No reassignment at compile time. Nothing is frozen at runtime.'],
      ['index signature', '`[key: string]: T`, which also lets typos through.'],
    ],
    code: { label: 'the literal check in action', snippet: `interface Point { x: number; y: number }

const loose = { x: 1, y: 2, z: 3 };
const a: Point = loose;                 // fine, shape fits
const b: Point = { x: 1, y: 2, z: 3 };  // error: z is excess

// impossible states, made impossible
type Fetch =
  | { status: 'loading' }
  | { status: 'done'; data: User };` },
    say: [
      'TypeScript is structural: if the shape fits it is assignable, which is why you rarely write implements.',
      'Object literals get an excess property check, which is why the error appears on a literal but not through a variable.',
      'Optional and "or undefined" are different: one lets the key be missing, the other requires it to be there.',
      'For props with rules, I use a discriminated union so the bad combination will not compile rather than warning at runtime.',
    ],
    gotcha: 'An index signature buys flexibility by giving up typo protection. A Record with a union of keys, or a Map, usually gets you what you wanted without the hole.',
    rehearse: [
      { prompt: 'What does structural typing mean, and where does it surprise people?', answer: 'Types match by shape rather than by name, so an object with the right properties fits without declaring anything. The surprise is the excess property check: an object literal assigned straight in is also checked for extra properties, which catches typos, but assigning through a variable skips that check.' },
      { prompt: 'When do you use an interface and when do you use a type alias?', answer: 'Either works for an object shape, so I follow whatever the codebase already does. I reach for a type alias when I need a union or a mapped type, and for an interface when something is meant to be extended or merged by consumers.' },
    ],
  },
  reactts: {
    plain: "Typing React is mostly four things: the props object, the children, the events, and the hook generics. Annotate the props parameter directly rather than reaching for React.FC. Use ReactNode for children. Event types are named after the element, and you usually get them for free on inline handlers. useState and useRef need a type argument when the first value cannot tell the compiler the whole story, which is why useState<User | null>(null) shows up everywhere.",
    words: [
      ['ReactNode', 'Anything renderable: elements, strings, numbers, arrays, null.'],
      ['ComponentProps<typeof X>', "Reuse another component's props, great for wrappers."],
      ['ChangeEvent<HTMLInputElement>', 'Event types are named by the element they came from.'],
      ['useRef<HTMLInputElement>(null)', 'current is the element or null, so you check before use.'],
      ['generic component', '<T,> so a render prop or callback keeps the item type.'],
    ],
    code: { label: 'the shapes you write all day', snippet: `type CardProps = {
  title: string;
  children: ReactNode;
  onSave?: (value: string) => void;
};

function Card({ title, children, onSave }: CardProps) {
  const [user, setUser] = useState<User | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value);
  return <section>{children}</section>;
}` },
    say: [
      'I annotate the props object directly. React.FC lost its main benefit when implicit children went away in the React 18 types.',
      'children is ReactNode, because JSX.Element only covers a single element.',
      'useState<User | null>(null) is the common one: without the argument it infers null and nothing else can be set.',
      'For props with rules, like a status that only sometimes has data, a discriminated union makes the bad combination fail to compile.',
    ],
    gotcha: 'useRef<HTMLInputElement>(null) gives you `current: HTMLInputElement | null`, and that null is real: the ref is empty until after mount, so effects are where you touch it.',
    rehearse: [
      { prompt: 'How do you type a React component and its props?', answer: 'I annotate the destructured props directly with a type alias, use ReactNode for children, and skip React.FC since it lost its advantage in the React 18 types. Events get their element-specific type, and hooks like useState take a type argument when the initial value cannot describe the whole state.' },
      { prompt: 'How would you stop a component from being used in an invalid way?', answer: 'Model the props as a discriminated union of the valid shapes, so loading has no data field and done requires it. Then the wrong combination fails to compile instead of being caught by a reviewer or a runtime warning.' },
    ],
  },
};
