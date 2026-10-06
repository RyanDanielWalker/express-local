import type { Guide, Line, ReactLineId } from '../engine/types';

/**
 * The React division: the front half of the job. Behavior checked against the
 * React docs, including the React 19 changes (ref as a prop, `<Context>` as a
 * provider, the `use` API, Actions) and the React Compiler.
 */
export const REACT_LINES: Line[] = [
  {
    id: 'render',
    division: 'react',
    kind: 'quiz',
    bullet: 'C',
    color: '--blue',
    short: 'Re-renders',
    name: 'Repaint Line',
    topic: 'What makes React re-render',
    pitch: 'Half of React performance questions are really "do you know when a component re-renders, and do you know that a re-render is not a repaint?"',
    rules: [
      'Read the situation, pick what React actually does.',
      'A re-render means React calls your function again, not that the DOM changed.',
      'Wrong answers explain themselves.',
    ],
    hook: 'A component re-renders when its own state changes, when its parent re-renders, or when a context it reads changes. React then diffs the output and only touches the DOM where it differs.',
    par: 95,
    questions: [
      {
        t: 1,
        q: 'What makes a component re-render?',
        opts: [
          'Its own state, its parent rendering, or a context it reads',
          'Any prop changing by value, deep-compared each render',
          'Any state change anywhere in the component tree',
        ],
        a: 'Its own state, its parent rendering, or a context it reads',
        why: 'Those are the three triggers. Props being "different" only matters when the component is wrapped in memo.',
      },
      {
        t: 1,
        q: 'A parent re-renders. Its child gets exactly the same props. What happens to the child?',
        opts: [
          'It re-renders too, unless it is wrapped in memo',
          'It skips, because React compares the props for you',
          'It skips, since nothing it renders has changed',
        ],
        a: 'It re-renders too, unless it is wrapped in memo',
        why: 'React re-renders the whole subtree by default. Skipping is opt-in with memo, and the React Compiler can do it for you.',
      },
      {
        t: 1,
        q: 'Does every re-render touch the DOM?',
        opts: [
          'No. React updates only where the output differs',
          "Yes. Each render replaces that component's DOM",
          'Only in development, where the checks are stricter',
        ],
        a: 'No. React updates only where the output differs',
        why: 'Re-render means React calls your function again. DOM work only happens where the output actually differs, which is why re-renders are usually cheap.',
      },
      {
        t: 2,
        q: 'A memoized child gets `style={{ margin: 8 }}` as a prop. Why does it still re-render every time?',
        code: `const Child = React.memo(function Child({ style }) { ... });

<Child style={{ margin: 8 }} />`,
        opts: [
          'The object is a new reference on every render',
          'memo deep-compares props, so this is already fine',
          'memo skips object props and checks primitives',
        ],
        a: 'The object is a new reference on every render',
        why: 'memo compares props with Object.is. New object, new identity, no skip. Hoist it or wrap it in useMemo.',
      },
      {
        t: 2,
        q: 'You call setCount(5) while count is already 5. What does React do?',
        opts: [
          'React can bail out and skip rendering the children',
          'React re-renders the component and its whole tree',
          'React warns in development about a wasted update',
        ],
        a: 'React can bail out and skip rendering the children',
        why: 'React compares with Object.is and bails out. It may still render that one component once more before deciding, which surprises people.',
      },
      {
        t: 2,
        q: 'A context value changes. Who re-renders?',
        opts: [
          'Every component that reads that context',
          'Only the provider and its direct children',
          'Nothing, until a prop changes further down',
        ],
        a: 'Every component that reads that context',
        why: 'This is why a context holding one big object causes wide re-renders. Split contexts by how often each piece changes.',
      },
      {
        t: 2,
        q: 'Where does a re-render start?',
        opts: [
          'At the component that changed, then downward',
          'At the root of the app, then down to the leaves',
          'At the deepest leaf, then back up the tree',
        ],
        a: 'At the component that changed, then downward',
        why: 'Updates flow down. That is why moving state lower in the tree shrinks what re-renders.',
      },
      {
        t: 3,
        q: 'A page re-renders too much because state lives at the top. What is the first fix to reach for?',
        opts: [
          'Move the state into the component that needs it',
          'Wrap the heavy children in memo and move on',
          'Lift the state into context so it is shared',
        ],
        a: 'Move the state into the component that needs it',
        why: 'Memo is a patch over a structure problem. Moving state down (or passing children as a prop) usually removes the re-render entirely.',
      },
      {
        t: 3,
        q: 'Why does passing `children` as a prop sometimes stop a subtree from re-rendering?',
        code: `function Layout({ children }) {
  const [open, setOpen] = useState(false);
  return <div>{children}</div>;
}`,
        opts: [
          'The element came from a parent that did not render',
          'React memoizes children props automatically',
          'Only memoized children are allowed to skip',
        ],
        a: 'The element came from a parent that did not render',
        why: 'React sees the same element object and skips re-rendering it. A free optimization that costs no memo calls.',
      },
      {
        t: 3,
        q: 'What does the React Compiler do?',
        opts: [
          'Memoizes for you when the rules are followed',
          'Replaces the virtual DOM with direct updates',
          'Removes the need for keys in rendered lists',
        ],
        a: 'Memoizes for you when the rules are followed',
        why: 'It shipped 1.0 in late 2025. It does what useMemo, useCallback and memo did by hand, as long as your components stay pure and follow the rules.',
      },
    ],
  },
  {
    id: 'effect',
    division: 'react',
    kind: 'quiz',
    bullet: 'E',
    color: '--teal',
    short: 'Effects',
    name: 'Side Track',
    topic: 'useEffect, dependencies and cleanup',
    pitch: 'Effects are for syncing with something outside React. Most bugs people blame on useEffect come from using it for something that was never an effect.',
    rules: [
      'Decide what React actually does, or what the right fix is.',
      'Watch for effects that should not exist at all.',
      'Dependencies and cleanup carry most of the answers.',
    ],
    hook: 'An effect syncs your component with an outside system. Dependencies decide when it re-runs, cleanup undoes it, and anything you can compute during render should not be an effect at all.',
    par: 100,
    questions: [
      {
        t: 1,
        q: 'What does the dependency array do?',
        opts: [
          'Re-runs the effect when one of those values changed',
          'Caches the effect result until those values change',
          'Delays the effect until those values are defined',
        ],
        a: 'Re-runs the effect when one of those values changed',
        why: 'React compares each dependency with Object.is. Any change re-runs the cleanup, then the effect.',
      },
      {
        t: 1,
        q: 'What does an empty dependency array mean?',
        code: `useEffect(() => {
  // ...
}, []);`,
        opts: [
          'Run after the first render, clean up on unmount',
          'Run after every render, clean up before the next',
          'Never run, since there is nothing to watch',
        ],
        a: 'Run after the first render, clean up on unmount',
        why: 'Nothing reactive to watch, so it never re-runs. In StrictMode during development it still mounts twice on purpose.',
      },
      {
        t: 1,
        q: 'Your effect runs twice on mount in development. Why?',
        opts: [
          'StrictMode remounts once to expose missing cleanup',
          'StrictMode renders twice to compare the output',
          'The dependency array is missing a value it reads',
        ],
        a: 'StrictMode remounts once to expose missing cleanup',
        why: 'It only happens in development. If running twice breaks something, the effect is missing cleanup, which is exactly what it is showing you.',
      },
      {
        t: 2,
        q: 'When does an effect cleanup function run?',
        opts: [
          'Before the next run of that effect, and on unmount',
          'Only on unmount, after the last render commits',
          'Right before the effect runs for the first time',
        ],
        a: 'Before the next run of that effect, and on unmount',
        why: 'Think of it as "undo the last run". Subscribe in the effect, unsubscribe in the cleanup, and re-runs stay balanced.',
      },
      {
        t: 2,
        q: 'You fetch in an effect and the user navigates away before it resolves. What is the fix?',
        opts: [
          'Abort it in the cleanup, or ignore the late result',
          'Nothing. React cancels pending work on unmount',
          'Move the fetch into useLayoutEffect instead',
        ],
        a: 'Abort it in the cleanup, or ignore the late result',
        why: 'Otherwise a late response can set state on a stale render, and racing responses can land out of order.',
      },
      {
        t: 2,
        q: 'What is wrong with this?',
        code: `const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(first + ' ' + last);
}, [first, last]);`,
        opts: [
          'It should not be an effect. Compute it during render',
          'The dependency array is missing the state setter',
          'It needs useLayoutEffect to avoid a flash',
        ],
        a: 'It should not be an effect. Compute it during render',
        why: 'This is the "you might not need an effect" case: it renders twice and the state can go stale. `const fullName = first + " " + last` is the whole fix.',
      },
      {
        t: 2,
        q: 'You want to send analytics when a user clicks Buy. Effect or event handler?',
        opts: [
          'The event handler, since a user did something',
          'An effect watching a clicked counter in state',
          'Either one. They run at the same moment',
        ],
        a: 'The event handler, since a user did something',
        why: 'If the code should run because something happened, it belongs in the handler. Effects run because the component rendered.',
      },
      {
        t: 2,
        q: 'Why does React reject this?',
        code: `useEffect(async () => {
  const data = await fetchUser();
}, []);`,
        opts: [
          'The slot is for cleanup, and async returns a promise',
          'React forbids any promise inside an effect body',
          'await belongs in handlers, never in effects',
        ],
        a: 'The slot is for cleanup, and async returns a promise',
        why: 'Define an async function inside the effect and call it, or use .then. Keep the cleanup slot free.',
      },
      {
        t: 3,
        q: 'An interval inside an effect with [] keeps logging the first value of count forever. Why?',
        code: `useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []);`,
        opts: [
          'The callback kept the count from the first render',
          'setInterval drops updates while the tab is idle',
          'count has to be a ref before it can be logged',
        ],
        a: 'The callback kept the count from the first render',
        why: 'The classic stale closure. Use a functional update, put count in the deps, or keep the latest value in a ref.',
      },
      {
        t: 3,
        q: 'When do you reach for useLayoutEffect instead of useEffect?',
        opts: [
          'When you measure or fix the DOM before paint',
          'When the effect is slow and blocks the render',
          'Whenever the effect touches the DOM at all',
        ],
        a: 'When you measure or fix the DOM before paint',
        why: 'It runs synchronously after DOM mutations, so the user never sees the intermediate frame. It also blocks painting, so use it sparingly.',
      },
      {
        t: 3,
        q: 'What belongs in the dependency array?',
        opts: [
          'Every reactive value it reads, props included',
          'Only the state values, not props or functions',
          'Whatever makes the lint warning go away',
        ],
        a: 'Every reactive value it reads, props included',
        why: 'If a dependency changes too often, fix the cause (move the function inside, wrap it, or use a ref). Do not silence the lint rule.',
      },
    ],
  },
  {
    id: 'state',
    division: 'react',
    kind: 'quiz',
    bullet: 'A',
    color: '--purple',
    short: 'State',
    name: 'Snapshot Line',
    topic: 'State, batching and updates',
    pitch: 'State in React is a snapshot, not a variable. Once that clicks, half the weird behavior people hit in interviews stops being weird.',
    rules: [
      'Predict the value, or pick the fix.',
      'Remember that state does not change in the middle of a function.',
      'Watch for the updater function form.',
    ],
    hook: 'The state you read is the value from that render. Updates are queued, batched and applied before the next render, so use the updater form when the next value depends on the last.',
    par: 95,
    questions: [
      {
        t: 1,
        q: 'A click handler calls setA(1) and setB(2). How many re-renders?',
        opts: [
          'One. React batches updates from the same event',
          'Two, because each setState renders on its own',
          'One in a React event, two inside a timeout',
        ],
        a: 'One. React batches updates from the same event',
        why: 'Since React 18 this batching also covers promises, timeouts and native handlers, not just React events.',
      },
      {
        t: 1,
        q: 'count is 0. What is count after this handler runs?',
        code: `setCount(count + 1);
setCount(count + 1);`,
        opts: [
          '1, both calls read the same snapshot',
          '2, the calls queue on top of each other',
          '0, because the state never changed',
        ],
        a: '1, both calls read the same snapshot',
        why: 'Both lines compute 0 + 1. The second does not see the first, because count is a constant for this render.',
      },
      {
        t: 1,
        q: 'Same handler, written with the updater form. What is count now?',
        code: `setCount(c => c + 1);
setCount(c => c + 1);`,
        opts: [
          '2, each updater gets the queued value',
          '1, the second updater is discarded',
          '2 only outside React event handlers',
        ],
        a: '2, each updater gets the queued value',
        why: 'React applies the queue in order and hands each function the result of the previous one. Use this whenever the next value depends on the last.',
      },
      {
        t: 2,
        q: 'What does "state is a snapshot" mean?',
        opts: [
          'The value stays fixed for the whole render',
          'Reading after the setter gives the new value',
          'The setter updates the variable right away',
        ],
        a: 'The value stays fixed for the whole render',
        why: 'Each render has its own props, state and handlers, frozen in place. The new value shows up in the next render.',
      },
      {
        t: 2,
        q: 'What is the difference between these two?',
        code: `useState(buildHugeList())   // A
useState(buildHugeList)     // B`,
        opts: [
          'A runs each render, B only on the first',
          'Both run once, so the two are equivalent',
          'B is invalid: useState needs a value',
        ],
        a: 'A runs each render, B only on the first',
        why: 'Passing the function itself is the lazy initializer. Only matters when the work is expensive, but it is a common interview catch.',
      },
      {
        t: 2,
        q: 'Why does nothing happen here?',
        code: `user.name = 'Ryan';
setUser(user);`,
        opts: [
          'Same reference, so React sees no change',
          'React deep-compares, so this works fine',
          'It throws in development under StrictMode',
        ],
        a: 'Same reference, so React sees no change',
        why: 'setUser({ ...user, name: "Ryan" }). Treat state as immutable and comparisons stay cheap and predictable.',
      },
      {
        t: 2,
        q: 'When do you use a ref instead of state?',
        opts: [
          'When a value should survive renders silently',
          'When the value is a primitive, not an object',
          'Refs are only for DOM nodes, never values',
        ],
        a: 'When a value should survive renders silently',
        why: 'Changing a ref does not re-render. That is the point, and also the trap: never read a ref during render to decide output.',
      },
      {
        t: 2,
        q: 'What makes an input "controlled"?',
        opts: [
          'Its value comes from state, updated by onChange',
          'It uses defaultValue and a ref to read it',
          'Any input React renders inside a form element',
        ],
        a: 'Its value comes from state, updated by onChange',
        why: 'Controlled means React state is the source of truth. Uncontrolled leaves the value in the DOM and you read it with a ref.',
      },
      {
        t: 3,
        q: "A details panel keeps showing the previous item's edits when you select a different item. Cleanest fix?",
        opts: [
          'Give it a key tied to the item id',
          'Clear each field in an effect when the id changes',
          'Call a reset method through a ref',
        ],
        a: 'Give it a key tied to the item id',
        why: 'Same component in the same position keeps its state. Changing the key is the documented way to say "this is a different thing now".',
      },
      {
        t: 3,
        q: 'When is useReducer the better call?',
        opts: [
          'When several values change by the same rules',
          'Whenever you have more than two useState calls',
          'When the state has to be shared across the tree',
        ],
        a: 'When several values change by the same rules',
        why: 'It also makes state transitions testable as a pure function, which is a nice thing to say out loud in an interview.',
      },
      {
        t: 3,
        q: 'You store filteredItems in state and update it in an effect whenever the query changes. What should you do instead?',
        opts: [
          'Compute it during render from items and query',
          'Keep it in state but memoize the effect',
          'Move both into context so they stay in sync',
        ],
        a: 'Compute it during render from items and query',
        why: 'Derived data in state means two sources of truth and a render where they disagree. Compute it, and reach for useMemo only if profiling says so.',
      },
    ],
  },
  {
    id: 'lists',
    division: 'react',
    kind: 'quiz',
    bullet: 'K',
    color: '--green',
    short: 'Keys & lists',
    name: 'Key Change',
    topic: 'Keys, lists and reconciliation',
    pitch: 'Keys look like a lint rule and are actually how React decides what to keep, what to throw away, and whose state belongs to whom.',
    rules: [
      'Pick what React does with the list.',
      'Think about identity, not order.',
      'State follows position and key, not your intentions.',
    ],
    hook: 'A key tells React which item is which between renders. Same key means keep this one and update it. New key means throw the old one away and mount a fresh one.',
    par: 85,
    questions: [
      {
        t: 1,
        q: 'What is a key actually for?',
        opts: [
          'It tells React which item is which',
          'It makes list rendering measurably faster',
          'It has to be unique across the whole app',
        ],
        a: 'It tells React which item is which',
        why: 'React uses it to match old elements to new ones, so it can move, keep or drop them correctly.',
      },
      {
        t: 1,
        q: 'You use the array index as the key. Items can be reordered and deleted. What goes wrong?',
        opts: [
          'State and inputs end up on the wrong rows',
          'Nothing. Index keys are fine for any list',
          'React throws a duplicate key warning',
        ],
        a: 'State and inputs end up on the wrong rows',
        why: 'Delete the first row and every index shifts. React thinks item 0 just changed its props, so the old row keeps its state.',
      },
      {
        t: 2,
        q: 'How unique does a key have to be?',
        opts: [
          'Unique among its siblings',
          'Unique in the whole app',
          'Unique inside the file',
        ],
        a: 'Unique among its siblings',
        why: 'Two different lists can both use key="1" without any problem.',
      },
      {
        t: 2,
        q: "A component's key changes from \"a\" to \"b\". What happens?",
        opts: [
          'React remounts it, so its state resets',
          'React re-renders it with the new props',
          'Nothing. Keys only matter inside .map',
        ],
        a: 'React remounts it, so its state resets',
        why: 'That is the intentional reset trick, and also why an unstable key quietly destroys state.',
      },
      {
        t: 2,
        q: 'You need a fragment in a list and it needs a key. What do you write?',
        opts: [
          '<Fragment key={id}> from react',
          'The <> shorthand takes a key too',
          'Put the key on the first child',
        ],
        a: '<Fragment key={id}> from react',
        why: 'The <> shorthand cannot take props. The long form can.',
      },
      {
        t: 2,
        q: 'The same position in the tree swaps from <Input /> to <TextArea />. What happens to the state inside?',
        opts: [
          'The state is thrown away',
          'The state carries over',
          'React warns and keeps it',
        ],
        a: 'The state is thrown away',
        why: 'React keeps state for the same component type in the same position. Different type means a fresh mount.',
      },
      {
        t: 3,
        q: 'Someone uses key={Math.random()} to silence the warning. What does that do?',
        opts: [
          'Every render remounts the whole list',
          'Fine for lists that never change',
          'It is the fastest possible key',
        ],
        a: 'Every render remounts the whole list',
        why: 'You lose state, focus and scroll position, and you do the most expensive DOM work possible on every render.',
      },
      {
        t: 3,
        q: 'Same component type, same position, different props, no key involved. What does React do?',
        opts: [
          'The instance and its state are kept',
          'React remounts it just to be safe',
          'It depends on whether props are objects',
        ],
        a: 'The instance and its state are kept',
        why: 'Position plus type is the identity. This is the rule behind most "why did my state survive" questions.',
      },
    ],
  },
  {
    id: 'perf',
    division: 'react',
    kind: 'quiz',
    bullet: 'F',
    color: '--magenta',
    short: 'Performance',
    name: 'Memo Yard',
    topic: 'memo, useMemo, useCallback and profiling',
    pitch: 'Memo tools are easy to sprinkle everywhere and easy to get wrong. The senior answer is almost always "measure first, and fix the structure before you reach for memo".',
    rules: [
      'Pick what each tool does, and when it earns its keep.',
      'Watch for memo that is quietly defeated.',
      'Structure beats memoization.',
    ],
    hook: 'memo skips a re-render when props are shallow-equal. useMemo caches a value, useCallback caches a function reference. All three only matter when something downstream compares references.',
    par: 90,
    questions: [
      {
        t: 1,
        q: 'What does React.memo do?',
        opts: [
          'Skips a re-render when props are shallow-equal',
          'Caches the rendered output for later reuse',
          'Memoizes the state the component holds',
        ],
        a: 'Skips a re-render when props are shallow-equal',
        why: 'Shallow equal means Object.is on each prop. New object or new function prop, no skip.',
      },
      {
        t: 1,
        q: 'What does useMemo do?',
        opts: [
          'Caches a computed value between renders',
          'Stops the component from re-rendering',
          'Caches a network response by its key',
        ],
        a: 'Caches a computed value between renders',
        why: 'It is for expensive math, or for keeping an object or array identity stable so a memoized child can skip.',
      },
      {
        t: 1,
        q: 'What does useCallback do?',
        opts: [
          'Keeps the same function reference',
          'Makes the function itself run faster',
          'Runs the function once on mount',
        ],
        a: 'Keeps the same function reference',
        why: 'useCallback(fn, deps) is useMemo(() => fn, deps) with nicer syntax. Only useful when the identity matters.',
      },
      {
        t: 2,
        q: 'Why does this memoized child still re-render on every parent render?',
        code: `const Row = React.memo(RowImpl);

<Row onSelect={() => select(id)} />`,
        opts: [
          'A new function reference each render',
          'memo skips function props entirely',
          'memo only works on class components',
        ],
        a: 'A new function reference each render',
        why: 'Wrap it in useCallback, hoist it, or let the React Compiler handle it. This is the most common defeated-memo bug.',
      },
      {
        t: 2,
        q: 'When is memo not worth adding?',
        opts: [
          'On cheap components, where comparing costs more',
          'Never: memo everything you can and move on',
          'Only in development, where renders are slower',
        ],
        a: 'On cheap components, where comparing costs more',
        why: 'Memo adds code, comparison work and a stale-prop footgun. Profile first, then memo the component that actually shows up.',
      },
      {
        t: 2,
        q: 'One context holds user, theme and a cart. Every cart change re-renders everything that reads it. Best fix?',
        opts: [
          'Split the context by how often each part changes',
          'Wrap each consumer in memo to block the render',
          'Nothing. Context always re-renders its readers',
        ],
        a: 'Split the context by how often each part changes',
        why: 'Consumers re-render when the value changes, and memo does not help because they read the context directly. Also memoize the value object you pass in.',
      },
      {
        t: 3,
        q: 'A table renders 10,000 rows and scrolling stutters. What actually fixes it?',
        opts: [
          'Render only the rows on screen',
          'Wrap every row in memo',
          'Paginate on the server only',
        ],
        a: 'Render only the rows on screen',
        why: 'The cost is the number of DOM nodes. Memo still renders every row, just faster. react-window or TanStack Virtual render the slice you can see.',
      },
      {
        t: 3,
        q: 'How do you find out what is actually slow?',
        opts: [
          'React DevTools Profiler, with why-rendered on',
          'console.time around the render function',
          'The Chrome memory tab over a few minutes',
        ],
        a: 'React DevTools Profiler, with why-rendered on',
        why: 'Turn on "Record why each component rendered". Being able to say that in an interview beats listing memo APIs.',
      },
      {
        t: 3,
        q: 'Your team turns on the React Compiler. What changes about memoization?',
        opts: [
          'Most manual memo calls become unnecessary',
          'Keys become optional in rendered lists',
          'Third-party components get memo applied',
        ],
        a: 'Most manual memo calls become unnecessary',
        why: 'The compiler memoizes for you at build time. Code that mutates props or state, or breaks the rules, is where it backs off.',
      },
    ],
  },
  {
    id: 'hooks',
    division: 'react',
    kind: 'quiz',
    bullet: 'N',
    color: '--brown',
    short: 'Hooks',
    name: 'Hook Junction',
    topic: 'Hook rules, custom hooks and React 19 APIs',
    pitch: 'The rules of hooks have a reason behind them, and React 19 added a handful of APIs that interviewers in 2026 like to ask about.',
    rules: [
      'Pick the rule, the reason, or the right modern API.',
      'React 19 changed a few things you may have learned the old way.',
      'Custom hooks share logic, never state.',
    ],
    hook: 'Hooks are matched by call order, so they go at the top level, every render, same order. A custom hook is just a function that calls hooks, so each caller gets its own state.',
    par: 95,
    questions: [
      {
        t: 1,
        q: 'What is the rule of hooks?',
        opts: [
          'Top level only, never in a condition or loop',
          'Any order, as long as it stays consistent',
          'Only inside useEffect or an event handler',
        ],
        a: 'Top level only, never in a condition or loop',
        why: 'Top level, every render, same order, every time.',
      },
      {
        t: 1,
        q: 'Why does that rule exist?',
        opts: [
          'React matches hooks by call order',
          'React matches hooks by variable name',
          'It keeps the shipped bundle smaller',
        ],
        a: 'React matches hooks by call order',
        why: 'Hook number three on this render has to be hook number three on the next one. A conditional hook shifts the whole list.',
      },
      {
        t: 1,
        q: 'What is a custom hook?',
        opts: [
          'A use-prefixed function that calls hooks',
          'A component that renders nothing itself',
          'A context provider with hooks inside',
        ],
        a: 'A use-prefixed function that calls hooks',
        why: 'The naming matters: it is how the linter knows to apply the rules of hooks to it.',
      },
      {
        t: 2,
        q: 'Two components both call useCounter(). Do they share the count?',
        opts: [
          'No. Each call gets its own state',
          'Yes. The hook holds one shared state',
          'Only when both sit in the same tree',
        ],
        a: 'No. Each call gets its own state',
        why: 'Custom hooks share logic, not state. Sharing state needs lifting it up, context, or a store.',
      },
      {
        t: 2,
        q: 'What does useContext do?',
        opts: [
          'Reads the nearest provider value above it',
          'Creates global state for the whole app',
          'Only works when called at the app root',
        ],
        a: 'Reads the nearest provider value above it',
        why: 'No provider above it means you get the default value passed to createContext, which is a classic silent bug.',
      },
      {
        t: 2,
        q: 'In React 19, how do you pass a ref into a function component?',
        opts: [
          'As a normal prop',
          'Wrap it in forwardRef, as before',
          'Refs cannot reach function components',
        ],
        a: 'As a normal prop',
        why: 'function MyInput({ ref, ...props }) just works in React 19. forwardRef still works, and will be deprecated later.',
      },
      {
        t: 2,
        q: 'What changed about context providers in React 19?',
        opts: [
          '<Context value={...}> works as the provider',
          'Nothing changed for providers in React 19',
          'Providers moved into the use() API',
        ],
        a: '<Context value={...}> works as the provider',
        why: 'Small syntax win. Worth knowing because it shows you have read the 19 release notes.',
      },
      {
        t: 3,
        q: 'What is the `use` API for?',
        opts: [
          'Reading a promise or context during render',
          'Replacing useEffect for data fetching',
          'Running only during server rendering',
        ],
        a: 'Reading a promise or context during render',
        why: 'use(promise) suspends until it resolves, so it pairs with Suspense. It is not a hook, which is why the rules relax.',
      },
      {
        t: 3,
        q: 'What does useActionState give you?',
        opts: [
          'The action result plus a pending flag',
          "The parent form's pending status",
          'An optimistic value during the action',
        ],
        a: 'The action result plus a pending flag',
        why: 'The other two describe useFormStatus and useOptimistic. useActionState was called useFormState in the canary releases.',
      },
      {
        t: 3,
        q: 'What is useOptimistic for?',
        opts: [
          'Showing the expected result while it runs',
          'Caching an expensive computed value',
          'Debouncing a rapidly changing state',
        ],
        a: 'Showing the expected result while it runs',
        why: 'Send the message, show it instantly, and React reverts to the real state if the action fails.',
      },
      {
        t: 3,
        q: 'What is useId for?',
        opts: [
          'A stable id that matches server and client',
          'A fresh random id on every render pass',
          'A drop-in replacement for key in lists',
        ],
        a: 'A stable id that matches server and client',
        why: 'For htmlFor and aria attributes. Using Math.random would break hydration, which is the whole reason it exists.',
      },
    ],
  },
];

/** Field guide for the React division, including interview talking points. */
export const REACT_GUIDE: Record<ReactLineId, Guide> = {
  render: {
    plain: "A re-render just means React calls your component function again to see what it returns now. It does that when the component's own state changes, when its parent re-renders, or when a context it reads changes. React then compares the new output to the old one and only touches the real DOM where they differ. So a re-render is usually cheap, and the expensive part is doing it to a huge tree over and over.",
    words: [
      [
        're-render',
        'React calls your function again. It does not mean the browser repainted anything.',
      ],
      [
        'commit',
        'The moment React applies the differences it found to the real DOM.',
      ],
      [
        'reconciliation',
        'Comparing the new element tree with the old one to work out what changed.',
      ],
      [
        'referential equality',
        'Two values being the same object in memory. React compares props this way.',
      ],
      ['React.memo', 'Opt out of re-rendering when props are shallow-equal.'],
    ],
    code: {
      label: 'the fix that beats memo',
      snippet: `// Every keystroke re-renders <ExpensiveTree /> too:
function Page() {
  const [text, setText] = useState('');
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <ExpensiveTree />
    </>
  );
}

// Move the state down, and the expensive tree stops caring:
function SearchBox() {
  const [text, setText] = useState('');
  return <input value={text} onChange={e => setText(e.target.value)} />;
}`,
    },
    say: [
      'Three things trigger a re-render: own state, a parent re-rendering, or a context the component reads.',
      'A re-render is not a repaint. React diffs the output and only commits what actually changed.',
      'Before reaching for memo I look at structure: move state down, or pass children as a prop so a subtree keeps its identity.',
      'With the React Compiler most of that memoization happens automatically, as long as the components follow the Rules of React.',
    ],
    gotcha: 'Wrapping a child in memo does nothing if you pass it a fresh object, array or arrow function on every render. The shallow compare fails every time and you have paid for the comparison for nothing.',
  },
  effect: {
    plain: 'useEffect is for syncing your component with something that lives outside React: a subscription, a timer, a browser API, a server. React runs it after the render is on screen, re-runs it when a dependency changes, and runs the cleanup before each re-run and on unmount. If you are using an effect to compute a value from props and state, or to respond to a click, you probably do not want an effect at all.',
    words: [
      [
        'effect',
        'Code that syncs the component with an outside system after render.',
      ],
      [
        'dependency array',
        'The reactive values the effect reads. Change one and the effect re-runs.',
      ],
      ['cleanup', 'The function you return. It undoes the last run.'],
      [
        'StrictMode',
        'Development-only double mount, there to expose effects without cleanup.',
      ],
      [
        'stale closure',
        'A callback still holding values from the render that created it.',
      ],
    ],
    code: {
      label: 'subscribe and clean up',
      snippet: `useEffect(() => {
  const socket = connect(roomId);
  socket.on('message', onMessage);

  return () => {
    socket.off('message', onMessage);
    socket.close();
  };
}, [roomId, onMessage]);`,
    },
    say: [
      'Effects synchronize with the outside world. If something should happen because the user did something, it goes in the event handler instead.',
      'The cleanup runs before every re-run and on unmount, so subscribe and unsubscribe stay balanced.',
      'Double-running in StrictMode is a feature. If it breaks, my effect is missing cleanup.',
      'Anything I can compute during render does not belong in state plus an effect. That pattern gives you an extra render and a chance to be out of sync.',
    ],
    gotcha: 'Removing a dependency to stop an effect looping just hides a stale closure. Fix the cause: move the function inside the effect, use an updater function, or keep the changing value in a ref.',
  },
  state: {
    plain: 'Each render gets its own frozen copy of state. When you call the setter you are queuing an update, not changing the variable you are holding. React batches everything queued in the same event, applies it, and renders again with the new values. That is why reading state right after setting it gives you the old value, and why two plain setCount(count + 1) calls only add one.',
    words: [
      [
        'snapshot',
        'The state values belonging to one render. They never change mid-render.',
      ],
      [
        'batching',
        'Several updates in one event applied together, with a single re-render.',
      ],
      [
        'updater function',
        'setCount(c => c + 1). Receives the latest queued value.',
      ],
      ['lazy initializer', 'useState(fn) runs fn only on the first render.'],
      [
        'controlled input',
        'The input value comes from state and changes through onChange.',
      ],
    ],
    code: {
      label: 'the two forms, side by side',
      snippet: `// reads the same snapshot twice: ends at +1
setCount(count + 1);
setCount(count + 1);

// each updater sees the queued result: ends at +2
setCount(c => c + 1);
setCount(c => c + 1);

// objects need a new reference
setUser({ ...user, name: 'Ryan' });`,
    },
    say: [
      'State is a snapshot. Inside one render the value never changes, which is why the updater form exists.',
      'React batches updates from the same event, including inside promises and timeouts since React 18.',
      'I treat state as immutable, so a new object every time. Same reference means React skips the update.',
      'Derived values get computed during render. Storing them in state gives you two sources of truth.',
    ],
    gotcha: 'To reset a child component when the selection changes, change its key instead of clearing fields in an effect. Same component in the same position keeps its state, and a new key mounts it fresh.',
  },
  lists: {
    plain: 'When React re-renders a list it has to match the new items to the old ones. By default it matches by position, which breaks the moment items move or get deleted. A key gives each item an identity that survives reordering, so React can keep the right DOM node, the right state and the right focus with the right item. That is also why changing a key deliberately is the clean way to reset a component.',
    words: [
      ['key', 'A stable identity for an item among its siblings.'],
      [
        'reconciliation',
        'How React decides what to keep, move, update or throw away.',
      ],
      [
        'remount',
        'Unmount the old component and mount a new one. All its state resets.',
      ],
      [
        'position',
        'Where an element sits in the tree. Together with type it decides identity when there is no key.',
      ],
    ],
    code: {
      label: 'identity, not order',
      snippet: `// wrong: delete a row and every index shifts
items.map((item, i) => <Row key={i} item={item} />)

// right: the id travels with the item
items.map(item => <Row key={item.id} item={item} />)

// on purpose: reset the form when the user changes
<ProfileForm key={user.id} user={user} />`,
    },
    say: [
      'Keys are identity, not order. React uses them to match items between renders.',
      'Index keys are fine for a static list that never reorders, and a bug waiting to happen for anything else.',
      'Keys only need to be unique among siblings.',
      'Changing a key is the documented way to reset a component, because React remounts it.',
    ],
    gotcha: 'key={Math.random()} silences the warning and remounts the whole list on every render, so you lose state, focus and scroll position and do the most expensive DOM work possible.',
  },
  perf: {
    plain: "React gives you three memo tools. memo skips a component's re-render when its props are shallow-equal. useMemo caches a computed value. useCallback keeps a function reference stable. They all exist for the same reason: something downstream is comparing references. They cost code and comparison time, so the order is measure, fix the structure, then memoize what is left. The React Compiler now does most of this automatically.",
    words: [
      ['shallow equal', 'Compare each prop with Object.is, one level deep.'],
      [
        'referential stability',
        'Handing down the same object or function identity between renders.',
      ],
      ['virtualization', 'Render only the rows currently on screen.'],
      [
        'Profiler',
        'React DevTools panel that records commits and why each component rendered.',
      ],
      [
        'React Compiler',
        'Build step that adds memoization for you when code follows the Rules of React.',
      ],
    ],
    code: {
      label: 'memo that actually works',
      snippet: `const Row = React.memo(function Row({ item, onSelect }) { ... });

function List({ items }) {
  // stable identity, so Row can skip
  const onSelect = useCallback((id) => select(id), []);
  return items.map(item => (
    <Row key={item.id} item={item} onSelect={onSelect} />
  ));
}`,
    },
    say: [
      'I profile before memoizing. The DevTools Profiler tells me what rendered and why, and it is usually not what I guessed.',
      'memo only helps when props keep their identity, so an inline arrow or object prop defeats it.',
      'For long lists the real fix is virtualization, because the cost is the number of DOM nodes, not the render function.',
      'With the React Compiler, most manual memoization goes away, which puts the emphasis back on writing components that follow the rules.',
    ],
    gotcha: 'Memoizing everything is its own performance problem: more code, more comparisons, more ways to hold onto a stale value. Structure first, memo second.',
  },
  hooks: {
    plain: 'React keeps your hooks in a list, in the order you called them, for each component. That is the entire reason for the rules: call them at the top level, every render, in the same order, so hook number three is always the same hook. A custom hook is just a function that calls hooks, so it shares logic between components but never shares state. React 19 added a few APIs on top of that: ref as a plain prop, Context used directly as a provider, use() for reading promises and context in render, and the Action hooks for forms.',
    words: [
      [
        'rules of hooks',
        'Top level only, same order every render, only in components or custom hooks.',
      ],
      ['custom hook', 'A use-prefixed function that composes other hooks.'],
      [
        'use()',
        'React 19 API to read a promise or context during render. Can be called conditionally.',
      ],
      [
        'useActionState',
        'Tracks a form action result and pending state. Called useFormState in canary.',
      ],
      [
        'useOptimistic',
        'Show the expected result while the async action is still in flight.',
      ],
      ['useId', 'A stable id that matches between server and client.'],
    ],
    code: {
      label: 'a custom hook and React 19 syntax',
      snippet: `function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

// React 19: ref is a normal prop, Context is the provider
function Input({ ref, ...props }) { return <input ref={ref} {...props} />; }
<ThemeContext value="dark">{children}</ThemeContext>`,
    },
    say: [
      'Hooks are matched by call order, which is why they go at the top level and never inside a condition.',
      'A custom hook shares logic, not state. Every component calling it gets its own copy.',
      'In React 19 I do not need forwardRef for new components, and Context can be rendered directly as the provider.',
      'The Action hooks (useActionState, useFormStatus, useOptimistic) cover the pending, error and optimistic states that everyone used to hand-roll.',
    ],
    gotcha: 'An early return above a hook breaks the order on the next render. Compute first, call all hooks, then decide what to return.',
  },
};
