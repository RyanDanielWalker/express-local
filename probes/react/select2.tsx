import { ok, done } from './harness.ts';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
const warns: string[] = [];
console.error = (...a: any[]) => { warns.push(String(a[0]).slice(0, 140)); };
const seen: Record<string, { value: string; warns: string[] }> = {};
for (const kind of ['selected', 'checked']) {
  warns.length = 0;
  const box = document.createElement('div'); document.body.append(box);
  const props: any = { [kind]: true };
  await act(async () => createRoot(box).render(<select><option value="red">Red</option><option value="blue" {...props}>Blue</option></select>));
  const s = box.querySelector('select')!;
  console.log(`  ${kind} on option -> value ${s.value} | warns: ${JSON.stringify(warns)}`);
  seen[kind] = { value: s.value, warns: [...warns] };
}
ok(seen.selected.value === 'blue' && seen.selected.warns.some(w => w.includes('defaultValue')), 'selected on an option works, but warns and points to the select');
ok(seen.checked.value === 'red' && seen.checked.warns.length === 0, 'checked on an option does nothing, with no warning');
ok(false, 'SANITY should fail');
done();
