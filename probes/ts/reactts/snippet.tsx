import { useState, useRef, type ReactNode, type ChangeEvent } from 'react';
type CardProps = {
  title: string;
  children: ReactNode;
  onSave?: (value: string) => void;
};

function Card({ title, children, onSave }: CardProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value);
  }

  return (
    <section>
      <h2>{title}</h2>
      <input
        ref={inputRef}
        value={draft}
        onChange={onChange}
      />
      <button onClick={() => onSave?.(draft)}>Save</button>
      {children}
    </section>
  );
}
function check(e: ChangeEvent<HTMLInputElement>) { const n: number = e.target.valueAsNumber; }
const anyFn: Function = (a: number, b: string) => 1;
export {};
