// Prints each answer the way tsc writes it, in an error message.
import { useState } from "react";
export function A() {
  const [name] = useState<string>();
  const [items] = useState([]);
  const show1: null = name;
  const show2: null = items;
  return <button onClick={(e) => { const show3: null = e.target; return show3; }}>{show1}{show2}</button>;
}
