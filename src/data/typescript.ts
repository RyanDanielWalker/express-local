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
    pitch: 'TypeScript follows your runtime checks. Once you see narrowing as "the compiler reading your if statements", half of the red squiggles explain themselves.',
    rules: ['Say what the type is at that line.', 'The checks you already write are the tool.', 'Watch where narrowing gets thrown away.'],
    hook: 'typeof for primitives, instanceof for classes, `in` for properties, and a literal field for unions. A switch on that field plus a never case makes the compiler check you handled everything.',
    par: 95,
    questions: [
      { t: 1, q: 'What is the type of `value` inside the if?', code: `function f(value: string | number) {\n  if (typeof value === 'string') {\n    // value is ???\n  }\n}`, opts: ['string', 'string | number', 'any'], a: 'string', why: 'A typeof check narrows the union. Inside the branch you get string methods with no cast.' },
      { t: 1, q: 'You have `user: User | null`. What is the cleanest guard?', opts: ['Return early if user is null', 'Cast it with `user as User`', 'Reach for user!.name instead'], a: 'Return early if user is null', why: 'Narrow once at the top and the rest of the function has a plain User. Casts and ! silence the compiler instead of answering it.' },
      { t: 1, q: 'What does narrowing mean?', opts: ['The compiler reading your runtime checks', 'Making a type smaller by hand', 'Removing properties from an object'], a: 'The compiler reading your runtime checks', why: 'if, typeof, instanceof and switch all tell the compiler something it can carry into that branch.' },
      { t: 2, q: 'How do you tell these two apart in code?', code: `type Result =\n  | { ok: true; data: string }\n  | { ok: false; error: string };`, opts: ['Check result.ok, the discriminant', 'Check if data is undefined', 'Use instanceof on the result'], a: 'Check result.ok, the discriminant', why: 'A shared literal field is what makes it a discriminated union. Checking it narrows to exactly one member.' },
      { t: 2, q: 'What does the `in` operator do here?', code: `if ('role' in account) { ... }`, opts: ['Narrows to the member with that key', 'Checks that the value is not null', 'Tests the whole prototype chain'], a: 'Narrows to the member with that key', why: 'Useful when a union has no discriminant field. instanceof does the same job for classes.' },
      { t: 2, q: 'Why does this stop narrowing?', code: `if (obj.user) {\n  doSomething(() => obj.user.name);\n}`, opts: ['A callback can run later, so the check may be stale', 'Arrow functions drop all type information', 'obj.user is readonly inside the callback'], a: 'A callback can run later, so the check may be stale', why: 'Narrowing on a mutable property does not survive into a deferred callback. Copy it into a const first.' },
      { t: 2, q: 'What is the value of a `never` case in a switch?', code: `default: {\n  const _exhaustive: never = kind;\n  throw new Error(kind);\n}`, opts: ['It fails to compile when a case is missed', 'It catches unknown values at runtime', 'It marks the switch as complete'], a: 'It fails to compile when a case is missed', why: 'Add a member to the union and the assignment breaks, so the compiler points at every switch that needs updating.' },
      { t: 3, q: 'What makes this a type predicate?', code: `function isCat(pet: Pet): pet is Cat {\n  return 'meow' in pet;\n}`, opts: ['The `pet is Cat` return type', 'The `in` check in the body', 'Returning a boolean value'], a: 'The `pet is Cat` return type', why: 'It tells the compiler what a true result proves. Without it, callers get no narrowing at all.' },
      { t: 3, q: 'What is wrong with a predicate like this?', code: `function isUser(x: unknown): x is User {\n  return true;\n}`, opts: ['You promised what the code never checks', 'A predicate cannot accept unknown', 'It should return x instead of true'], a: 'You promised what the code never checks', why: 'A predicate is a claim the compiler trusts. A lazy one is as unsafe as a cast, just harder to spot in review.' },
      { t: 3, q: 'strictNullChecks is on. What does `string | undefined` force you to do?', opts: ['Handle the undefined case before using it', 'Initialize every variable at declaration', 'Avoid optional properties entirely'], a: 'Handle the undefined case before using it', why: 'That is the whole point of the flag: the two states are different types until you deal with one.' },
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
    pitch: 'A generic is a parameter for a type. Once you can read one, library signatures stop being noise and start telling you exactly what they do.',
    rules: ['Say what the generic gives you.', 'Watch what gets inferred and what has to be declared.', 'Constraints are the interesting part.'],
    hook: 'T is a placeholder filled in at the call site. `extends` constrains it, inference usually fills it for you, and keyof plus an indexed access links a key to its value type.',
    par: 100,
    questions: [
      { t: 1, q: 'What does this signature promise?', code: `function first<T>(items: T[]): T | undefined`, opts: ['You get back the type you passed in', 'You get back any array element type', 'You get back an unknown value type'], a: 'You get back the type you passed in', why: 'Call it with string[] and you get string | undefined. That link between input and output is what generics are for.' },
      { t: 1, q: 'Do you have to write the type argument here?', code: `const names = first(['a', 'b']);`, opts: ['No, it is inferred from the argument', 'Yes, every generic call needs one', 'Only when strict mode is turned on'], a: 'No, it is inferred from the argument', why: 'Inference does the work. Writing first<string>([...]) is allowed but usually noise.' },
      { t: 1, q: 'Why use a generic instead of any?', opts: ['The input type survives to the output', 'It compiles faster on big projects', 'It accepts fewer argument types'], a: 'The input type survives to the output', why: 'any throws the information away. A generic carries it through, so callers keep their types.' },
      { t: 2, q: 'What does the constraint do?', code: `function byId<T extends { id: string }>(items: T[], id: string)`, opts: ['Requires an id, keeps the rest of the shape', 'Converts the items into { id: string }', 'Allows only objects with exactly one field'], a: 'Requires an id, keeps the rest of the shape', why: 'extends sets a floor, not a ceiling. Pass a User and you get a User back, not a stripped object.' },
      { t: 2, q: 'What does `K extends keyof T` give you here?', code: `function get<T, K extends keyof T>(obj: T, key: K): T[K]`, opts: ['Real keys, with the matching value type', 'Any string key, with an any value', 'Real keys, with the whole object type'], a: 'Real keys, with the matching value type', why: 'A typo in the key is a compile error, and the return type is exactly that property. This is the pattern behind lodash-style helpers.' },
      { t: 2, q: 'What is the inferred type of `config`?', code: `const config = { mode: 'dark' } as const;`, opts: ['{ readonly mode: "dark" }', '{ mode: string }', '{ mode: "dark" | "light" }'], a: '{ readonly mode: "dark" }', why: 'as const stops widening and freezes the literal. Handy for lookup tables and action types.' },
      { t: 2, q: 'A generic function compiles but every call returns unknown. Likely cause?', opts: ['Nothing in the arguments mentions T', 'The constraint is far too loose', 'The function is not marked async'], a: 'Nothing in the arguments mentions T', why: 'Inference needs an anchor. If T only appears in the return type, the caller has to supply it explicitly.' },
      { t: 3, q: 'What does a default type parameter do?', code: `interface Response<T = unknown> { data: T }`, opts: ['Lets callers skip the argument', 'Forces every caller to pass unknown', 'Makes T optional at runtime'], a: 'Lets callers skip the argument', why: 'Response without an argument means Response<unknown>, which is safer than defaulting to any.' },
      { t: 3, q: 'How do you type a React component that takes a list of anything?', code: `function List<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode })`, opts: ['A generic component, T inferred from items', 'Type items as any[] and cast inside', 'Make one component per item type'], a: 'A generic component, T inferred from items', why: 'Generic components keep the item type flowing into the render prop, which is where the mistakes usually happen.' },
      { t: 3, q: 'What is wrong with this signature?', code: `function parse<T>(json: string): T`, opts: ['Callers claim any shape, nothing checks', 'Generics cannot return object types', 'T must extend object to compile'], a: 'Callers claim any shape, nothing checks', why: 'It is a cast wearing a generic hat. Validate at the boundary (zod, class-validator) and return a real type.' },
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
    plain: "TypeScript watches the checks you already write. An if, a typeof, an instanceof, a switch on a shared field: each one tells the compiler something, and inside that branch the type gets smaller. That is narrowing. Most of the time the fix for a red squiggle is not a cast, it is a check you were going to write anyway. The payoff is that a union like User | null stops being annoying and starts being a reminder.",
    words: [
      ['narrowing', 'The type getting more specific inside a branch, because of a check.'],
      ['discriminated union', 'A union whose members share a literal field, like status or ok.'],
      ['type predicate', 'A function returning `x is Thing`, so callers get narrowing too.'],
      ['exhaustiveness check', 'Assigning the leftover case to never, so a new union member breaks the build.'],
    ],
    code: { label: 'a union you can trust', snippet: `type Result =
  | { ok: true; data: User }
  | { ok: false; error: string };

function show(result: Result) {
  if (result.ok) return result.data.name;  // narrowed
  return result.error;                     // narrowed the other way
}` },
    say: [
      'Narrowing is the compiler reading my runtime checks, so I write the check instead of casting.',
      'For unions I reach for a discriminated field, and a never case in the default so a new member breaks the build instead of slipping through.',
      'A type predicate is a promise the compiler trusts, so it has to actually check the thing.',
      'Narrowing on a mutable property does not survive into a callback, so I copy it into a const first.',
    ],
    gotcha: 'Non-null assertion (!) and `as` both turn off the check rather than answering it. They move the failure from compile time to a stack trace in production.',
    rehearse: [
      { prompt: 'What is narrowing, and how do you use it day to day?', answer: 'It is the compiler following the checks I already write. A typeof, an instanceof, an `in`, or a switch on a discriminant makes the type more specific inside that branch, so I write the check instead of casting.' },
      { prompt: 'How do you make sure a switch handles every case of a union?', answer: 'Assign the leftover value to a never in the default branch. Add a new member to the union and every switch that forgot it fails to compile, which is the compiler doing the code review.' },
    ],
  },
  generics: {
    plain: "A generic is a parameter, except the thing you pass is a type. It exists to keep a relationship: what came in is what goes out. Most of the time you never write the type argument, because TypeScript infers it from the values. `extends` puts a floor under what callers can pass without flattening the rest of their type, and keyof lets you tie a key to the type of its value.",
    words: [
      ['type parameter', 'The placeholder, usually T, filled in at the call site.'],
      ['inference', 'TypeScript working out T from the arguments you passed.'],
      ['constraint', '`T extends { id: string }`: a minimum shape, not a replacement.'],
      ['keyof / indexed access', 'keyof T is the union of keys, T[K] is the value type at that key.'],
      ['as const', 'Keep literal types instead of widening to string or number.'],
    ],
    code: { label: 'the signature worth memorizing', snippet: `function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: '1', age: 38 };
get(user, 'age');   // number
get(user, 'nope');  // compile error` },
    say: [
      'A generic keeps the relationship between input and output, which is exactly what any throws away.',
      'I let inference do the work and only write the type argument when nothing in the arguments mentions T.',
      'extends is a floor, not a cast: pass a User and you get a User back, not a stripped object.',
      'A generic that only appears in the return type, like parse<T>(json): T, is a cast in disguise. I validate at the boundary instead.',
    ],
    gotcha: 'Generics do not exist at runtime. Anything that depends on the actual shape of incoming data has to be checked with real code, not a type argument.',
    rehearse: [
      { prompt: 'Explain generics to someone who has only used them by accident.', answer: 'A generic is a parameter for a type. It lets a function say "whatever you give me, you get the same type back", so the information survives into the return value instead of being flattened to any.' },
      { prompt: 'When is a generic the wrong tool?', answer: 'When it is really a cast. A signature like parse<T>(json: string): T lets the caller claim any shape with nothing checking it, so I validate the data at the boundary and return a concrete type instead.' },
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
