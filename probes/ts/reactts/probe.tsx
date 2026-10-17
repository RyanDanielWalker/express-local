import { useState, useRef, useReducer, type ReactNode, type ChangeEvent, type MouseEvent, type FormEvent, type SubmitEvent, type InputEvent, type KeyboardEvent, type ComponentProps, type Ref, type FC, type PropsWithChildren } from 'react';
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { id: string; name: string };

// props, FC without generics
function Card({ title }: { title: string }) { return <h2>{title}</h2>; }
// @ts-expect-error FC without a props type knows nothing about title
const Card2: FC = ({ title }) => <h2>{title}</h2>;
// FC no longer adds children
const Card3: FC<{ title: string }> = ({ title }) => <h2>{title}</h2>;
// @ts-expect-error children not allowed on FC without declaring them
const c3 = <Card3 title="x">kid</Card3>;
type PWC = PropsWithChildren<{ title: string }>;
const t0: Expect<PWC['children'], ReactNode | undefined> = true;

// children
function Box({ children }: { children: ReactNode }) { return <div>{children}</div>; }
const b1 = <Box>text</Box>; const b2 = <Box><span /></Box>; const b3 = <Box>{null}</Box>;
function Box2({ children }: { children: React.JSX.Element }) { return <div>{children}</div>; }
// @ts-expect-error a string is not a JSX element
const b4 = <Box2>text</Box2>;

// useState
function S() {
  const [user, setUser] = useState<User | null>(null);
  const t: Expect<typeof user, User | null> = true;
  const [draft, setDraft] = useState('');
  const t2: Expect<typeof draft, string> = true;
  return null;
}

// events
function E() {
  return (
    <>
      <input onChange={e => { const t: Expect<typeof e, ChangeEvent<HTMLInputElement>> = true; const v: Expect<typeof e.target.value, string> = true; }} type="number" />
      <select onChange={e => { const t: Expect<typeof e, ChangeEvent<HTMLSelectElement>> = true; }} />
      <button onClick={e => { const t: Expect<typeof e, MouseEvent<HTMLButtonElement>> = true; }} />
      <div onDoubleClick={e => { const t: Expect<typeof e, MouseEvent<HTMLDivElement>> = true; }} />
      <form onSubmit={e => { const t: Expect<typeof e, SubmitEvent<HTMLFormElement>> = true; }} />
      <input onInput={e => { const t: Expect<typeof e, InputEvent<HTMLInputElement>> = true; }} />
      <input onKeyDown={e => { const t: Expect<typeof e, KeyboardEvent<HTMLInputElement>> = true; }} />
    </>
  );
}

// refs
function R() {
  const inputRef = useRef<HTMLInputElement>(null);
  const t: Expect<typeof inputRef.current, HTMLInputElement | null> = true;
  const count = useRef(0); count.current += 1;
  return <input ref={inputRef} />;
}
// React 19: useRef needs an argument
// @ts-expect-error useRef requires an initial value in React 19 types
function R2() { const r = useRef<number>(); return null; }
// React 19: ref as a normal prop
function MyInput({ ref, ...rest }: { ref?: Ref<HTMLInputElement>; placeholder?: string }) { return <input ref={ref} {...rest} />; }
function UseMyInput() { const r = useRef<HTMLInputElement>(null); return <MyInput ref={r} placeholder="x" />; }

// ComponentProps
function Button(props: { label: string; onClick: () => void }) { return <button onClick={props.onClick}>{props.label}</button>; }
type BP = ComponentProps<typeof Button>;
const t9: Expect<BP, { label: string; onClick: () => void }> = true;
const t10: Expect<ReturnType<typeof Button>, React.JSX.Element> = true;

// optional prop, callback prop, literal union prop
function Badge({ size = 'sm' }: { size?: 'sm' | 'lg' }) { return <span>{size}</span>; }
const bd = <Badge />;
function Saver({ onSave }: { onSave: (value: string) => void }) { return <button onClick={() => onSave('x')} />; }
function Btn({ variant }: { variant: 'primary' | 'secondary' }) { return <button>{variant}</button>; }
// @ts-expect-error typo in a literal union prop
const bt = <Btn variant="primay" />;

// reducer
type Action = { type: 'add'; text: string } | { type: 'remove'; id: string };
function reducer(s: string[], a: Action) {
  switch (a.type) {
    case 'add': return [...s, a.text];
    case 'remove': { const t: Expect<typeof a, { type: 'remove'; id: string }> = true; return s.filter(x => x !== a.id); }
  }
}

// generic Select
function Select<T>({ options, onPick }: { options: T[]; onPick: (value: T) => void }) { return null; }
const sel = <Select options={[{ id: 1 }]} onPick={v => { const t: Expect<typeof v, { id: number }> = true; }} />;

// union props
type LinkProps = { kind: 'link'; href: string } | { kind: 'button'; onClick: () => void };
function Act(p: LinkProps) { return null; }
// @ts-expect-error a link needs href
const a1 = <Act kind="link" />;
const a2 = <Act kind="button" onClick={() => {}} />;
// old FormEvent handler still compiles on onSubmit (deprecated, not an error)
function oldSubmit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); }
const f1 = <form onSubmit={oldSubmit} />;
function newSubmit(e: SubmitEvent<HTMLFormElement>) { e.preventDefault(); }
const f2 = <form onSubmit={newSubmit} />;
// an InputEvent handler on onChange is rejected
function wrongChange(e: InputEvent<HTMLInputElement>) {}
// @ts-expect-error onChange does not take an InputEvent handler
const i1 = <input onChange={wrongChange} />;
function rightChange(e: ChangeEvent<HTMLInputElement>) { const v: string = e.target.value; }
const i2 = <input onChange={rightChange} />;
export {};
