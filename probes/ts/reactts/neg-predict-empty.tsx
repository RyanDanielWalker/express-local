// Should fail: claims an empty array state accepts a User.
import { useState } from "react";
export function List() {
  const [, setItems] = useState([]);
  setItems([{ id: "1", name: "Ann" }]);
  return null;
}
