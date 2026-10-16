import type { Guide, Line, ReactLineId } from '../engine/types';

/**
 * The React division: the front half of the job. Behavior checked against the
 * React docs, including the React 19 changes (ref as a prop, \`<Context>\` as a
 * provider, the \`use\` API, Actions) and the React Compiler.
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
    hook: 'A component re-renders when its own state changes, when its parent re-renders, or when a context it reads changes. React then compares the output and only touches the DOM where it differs.',
    par: 95,
    drill: 'Ask what changed. The component\'s own state? Its parent rendering again? A context it reads? Nothing else starts a render: not a ref, not a plain variable. Then ask what reaches the DOM. React only touches the parts of the output that differ.',
    sorts: [
      {
        t: 1,
        title: 'Counter is on screen. Which of these makes it render again?',
        buckets: ['Re-renders', 'Stays put'],
        items: [
          { name: 'Counter calls setCount with a new number', bucket: 'Re-renders', why: 'Its own state changed, so React calls Counter again.' },
          { name: 'Counter\'s parent renders again', bucket: 'Re-renders', why: 'Children render again with their parent by default, even with the same props. memo opts out. So does a child passed in as children from higher up.' },
          { name: 'A context Counter reads with useContext gets a new value', bucket: 'Re-renders', why: 'Every component that reads a context renders again when its value changes, with or without memo.' },
          { name: 'A handler in Counter sets inputRef.current = \'x\'', bucket: 'Stays put', why: 'A ref is a box React does not watch. Changing .current never starts a render.' },
          { name: 'A handler in Counter changes a plain let variable', bucket: 'Stays put', why: 'React does not watch plain variables. And the next render would set it back to its starting value anyway.' },
          { name: 'Counter is in memo, and its parent renders again with the same number props', bucket: 'Stays put', why: 'memo compares each prop with Object.is. The numbers are the same, so React skips Counter.' },
          { name: 'A sibling of Counter updates its own state', bucket: 'Stays put', why: 'A render starts at the component whose state changed and goes down from there. A sibling is not below it.' },
        ],
        note: 'Three things make a component render again: its own state, its parent rendering, or a context it reads. Refs and plain variables are invisible to React. And memo can skip a parent\'s render when no prop has changed.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'Counter shows 0. You click its + button, which calls setCount(count + 1)',
        steps: [
          'The click handler runs',
          'setCount queues an update',
          'The handler finishes',
          'React calls Counter again',
          'React compares the new JSX with the old',
          'React updates just the changed text',
          'The browser paints',
        ],
        decoys: ['React renders the whole app from the root', 'React rebuilds all of Counter\'s DOM'],
        note: 'Calling setCount does not render on the spot. It queues an update, and React renders once the handler is done. That second call to Counter is the render. React then compares what Counter returned with last time, and changes the DOM only where they differ, here a single piece of text. That DOM step is called the commit. The browser paints after it.',
      },
    ],
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
        why: 'Those are the three triggers: a new state value, the parent rendering again, or a context it reads changing. Props changing is not a trigger of its own. A component re-renders whenever its parent does, whatever the props, unless it is wrapped in memo. React never deep-compares props, and a state change only reaches the components below it.',
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
        why: 'By default, React re-renders everything below a component that rendered, same props or not. memo is how you opt out: it skips the child when every prop is equal to last time. The React Compiler can add that skipping for you. React does not compare props one by one on its own. The one exception is a child it gets back as the exact same element object, like one passed in as children.',
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
        why: 'A re-render means React calls your function again. React then compares the result with last time and changes the DOM only where they differ. If nothing differs, the DOM is left alone. That is why re-renders are usually cheap. Development mode does not change this.',
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
        why: 'memo compares each prop with Object.is, which checks for the same object, not the same contents. `{ margin: 8 }` written inline is a new object on every render, so the check fails every time. memo never deep-compares, and it treats object props like any other prop. Move the object outside the component, or wrap it in useMemo.',
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
        why: 'React compares the new value with the old one using Object.is. They match, so it bails out: the children do not render, and no effects run. React may still call that one component once more before it decides, which surprises people. It does not warn about any of this.',
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
        why: 'Every component that reads that context with useContext re-renders, even inside memo. Components that do not read it are not affected by the change itself. That is why one context holding one big object causes wide re-renders. Split contexts by how often each piece changes.',
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
        why: 'A render starts at the component whose state changed, and goes down through what it renders. Components above it and beside it are not called. That is why moving state lower in the tree shrinks what re-renders.',
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
        why: 'memo is a patch over a structure problem. With the state at the top, every change re-renders the whole page below it. Move the state into the component that uses it, and the rest of the page stops re-rendering. Putting it in context would still re-render every component that reads it.',
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
        why: 'The child element was created by Layout\'s parent, which did not render again. So when Layout re-renders, its children prop is the exact same element object as last time, and React skips it. React does not memoize children for you in general. This works without memo, purely because of where the element was created.',
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
        why: 'React Compiler 1.0 shipped in October 2025. At build time, it adds the memoization you would otherwise write by hand with memo, useMemo and useCallback. When it spots code breaking the Rules of React, it skips that component. It cannot spot every break, so following the rules is still your job. It does not replace the virtual DOM, and keys still matter.',
      },
      {
        t: 1,
        q: 'In React, what does it mean when a component renders?',
        opts: [
          'React calls your component function',
          'The browser paints pixels on screen',
          'React writes new HTML into the page',
        ],
        a: 'React calls your component function',
        why: 'Rendering is React calling your function to get the JSX it returns now. Writing changes into the DOM is a separate step, called the commit, and it only touches what differs. Painting pixels is the browser\'s job, after that.',
      },
      {
        t: 1,
        q: 'A parent\'s state changes. Its child takes no props at all. Does the child re-render?',
        opts: [
          'Yes, children re-render with their parent',
          'No, it has no props that could change',
          'Only if the child has state of its own',
        ],
        a: 'Yes, children re-render with their parent',
        why: 'When a component renders, React renders everything it returns, by default. Having no props does not opt the child out. Wrapping it in memo would, because memo skips a component whose props are unchanged, and no props never change.',
      },
      {
        t: 1,
        q: 'A handler runs `count = count + 1` on a plain `let count = 0` declared inside the component. What does the screen show?',
        opts: [
          'Still 0. React never saw a change',
          '1, as soon as the handler finishes',
          '1, once the parent re-renders',
        ],
        a: 'Still 0. React never saw a change',
        why: 'React only re-renders for state, props from a re-rendering parent, or context. A plain variable is none of those, so nothing renders. And if something else did cause a render, `let count = 0` would run again and start from 0. Use useState for a value the screen should show.',
      },
      {
        t: 1,
        q: 'A component re-renders. What happens to its useState values?',
        opts: [
          'They are kept from the last render',
          'They reset to their initial values',
          'They reset, unless it is wrapped in memo',
        ],
        a: 'They are kept from the last render',
        why: 'React stores state outside your function, tied to that spot in the tree. A re-render reads the stored values back, so nothing resets. State only starts over when the component is removed and added again, for example when its key changes.',
      },
      {
        t: 1,
        q: 'A handler sets `inputRef.current = \'x\'`. Does the component re-render?',
        opts: [
          'No. Changing a ref never re-renders',
          'Yes, the same way setting state does',
          'Yes, once the handler has finished',
        ],
        a: 'No. Changing a ref never re-renders',
        why: 'A ref is a box React keeps for you but does not watch. Writing to .current changes the value immediately, and nothing re-renders, now or later. That is what refs are for: values you need to keep, but that the screen does not show.',
      },
      {
        t: 1,
        q: 'What does wrapping a component in memo do?',
        opts: [
          'Skips its re-render when no prop has changed',
          'Caches the DOM it produced between pages',
          'Stops it re-rendering when its state changes',
        ],
        a: 'Skips its re-render when no prop has changed',
        why: 'memo compares each prop with the last render\'s, using Object.is. If none changed, React skips calling the component when its parent renders. Its own state changes and the contexts it reads still re-render it. memo caches nothing about the DOM.',
      },
      {
        t: 2,
        q: 'Under StrictMode, in development, React calls your component function twice per render. Why?',
        opts: [
          'To catch rendering code that is not pure',
          'To compare the two outputs and pick one',
          'To warm up a cache for the next render',
        ],
        a: 'To catch rendering code that is not pure',
        why: 'A pure component returns the same output for the same inputs, so calling it twice changes nothing. If something does change, like a counter outside the component, the bug shows up in development. React does not compare the two results. It just uses one. Production calls each component once.',
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
    drill: 'Ask why the code should run. Because the component is on screen and has to stay in sync with something outside React? That is an effect. Because a user did something? That goes in the event handler. Because a value can be worked out from props and state? Compute it during render. Then ask what the effect reads: that is the dependency array.',
    sorts: [
      {
        t: 1,
        title: 'Where does each piece of code belong?',
        buckets: ['Effect', 'Render', 'Event handler'],
        items: [
          { name: 'Connect to a chat room for the current roomId', bucket: 'Effect', why: 'The connection has to stay open while the component is on screen, and switch when roomId changes. That is syncing with an outside system.' },
          { name: 'Run a clock that ticks every second while it is on screen', bucket: 'Effect', why: 'A timer lives outside React. Start it in an effect, and clear it in the cleanup.' },
          { name: 'Keep document.title in sync with the unread count', bucket: 'Effect', why: 'document.title is a browser API React does not manage, so an effect keeps it matching the state.' },
          { name: 'Work out fullName from first and last', bucket: 'Render', why: 'It can be computed from props and state, so compute it during render. An effect would cost an extra render, with the old value committed in between.' },
          { name: 'Filter the visible todos by the search text', bucket: 'Render', why: 'Same idea: the filtered list comes straight from props and state. Compute it when you need it, with useMemo if it is slow.' },
          { name: 'Send analytics when the user clicks Buy', bucket: 'Event handler', why: 'It should happen because the user clicked, so it goes in the click handler. An effect would fire whenever the component rendered with that state.' },
          { name: 'POST the form when the user submits it', bucket: 'Event handler', why: 'Submitting is something the user did. The submit handler is the one place that knows it happened.' },
        ],
        note: 'An effect is for staying in sync with something outside React while the component is on screen. A value you can work out from props and state belongs in render. Something that should happen because the user did something belongs in that event\'s handler.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'ChatRoom connects in `useEffect(() => { connect(roomId); return () => disconnect(roomId); }, [roomId])`. Then roomId changes from \'general\' to \'travel\'',
        start: 2,
        steps: [
          'ChatRoom renders with \'general\'',
          'Effect runs: connect to \'general\'',
          'ChatRoom renders with \'travel\'',
          'React commits the new render',
          'Cleanup runs: disconnect from \'general\'',
          'Effect runs: connect to \'travel\'',
        ],
        decoys: ['ChatRoom unmounts and mounts again', 'Cleanup runs: disconnect from \'travel\''],
        note: 'React renders with the new roomId first. Only after that render is committed does it run the old cleanup, which still holds \'general\', and then the new effect with \'travel\'. A cleanup always sees the values from the run it is undoing. Nothing unmounts: a changed dependency re-runs the effect, it does not remount the component.',
      },
    ],
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
        why: 'After each render, React compares every value in the array with its value last time, using Object.is. If any changed, it runs the cleanup from the last run, then the effect again. Nothing is cached, and the effect does not wait for values to be defined.',
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
        why: 'An empty array means the effect reads nothing that can change. So React runs it once after the first render, and cleans it up when the component leaves the screen. It does run. In StrictMode during development, React also runs setup, cleanup and setup once more, on purpose. And since React 19.2, when an <Activity> hides the component, the cleanup runs, and showing it again runs the effect again.',
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
        why: 'In development, StrictMode runs each effect\'s setup, then its cleanup, then setup again. It keeps the component\'s state, so this is a simulated remount, not a real one. If that breaks something, the effect is missing a cleanup, which is exactly what StrictMode is showing you. Production runs it once. A missing dependency causes stale values later, not a second run on mount.',
      },
      {
        t: 2,
        q: 'When does an effect cleanup function run?',
        opts: [
          'Before the next run, and on unmount',
          'Only on unmount, after the last render commits',
          'Right before the effect runs for the first time',
        ],
        a: 'Before the next run, and on unmount',
        why: 'The cleanup undoes the last run. React calls it right before the effect runs again with new values, and once more when the component leaves the screen. So subscribe in the effect, unsubscribe in the cleanup, and the two stay balanced.',
      },
      {
        t: 2,
        q: 'Your effect fetches the user for userId. userId changes before the first response arrives. What is the fix?',
        opts: [
          'Abort it in the cleanup, or ignore the late result',
          'Nothing. React cancels the old fetch for you',
          'Move the fetch into useLayoutEffect instead',
        ],
        a: 'Abort it in the cleanup, or ignore the late result',
        why: 'If the user switches quickly, an older, slower response can land after the newer one and overwrite it. React does not cancel your fetch. In the cleanup, abort the request with an AbortController, or set an ignore flag so a late result is dropped. useLayoutEffect has the same problem.',
      },
      {
        t: 2,
        q: 'What is wrong with this?',
        code: `const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(first + ' ' + last);
}, [first, last]);`,
        opts: [
          'Compute it during render, not in an effect',
          'The dependency array is missing the state setter',
          'It needs useLayoutEffect to avoid a flash',
        ],
        a: 'Compute it during render, not in an effect',
        why: 'This is an effect you do not need. It renders and commits once with the old fullName, then the effect sets it, and React renders again. On first load, the user can see the old value flash. `const fullName = first + \' \' + last` during render is the whole fix. The setter does not need to be in the array, since React keeps it stable, and useLayoutEffect would only hide the extra render.',
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
        why: 'If code should run because something happened, like a click, it belongs in that event\'s handler. Effects run because the component rendered. An effect watching a counter runs after the render, not at the click, and also runs in cases you did not mean.',
      },
      {
        t: 2,
        q: 'Why does React reject this?',
        code: `useEffect(async () => {
  const data = await fetchUser();
}, []);`,
        opts: [
          'Async returns a promise, not a cleanup',
          'React forbids any promise inside an effect body',
          'await belongs in handlers, never in effects',
        ],
        a: 'Async returns a promise, not a cleanup',
        why: 'The function you pass to useEffect may only return a cleanup function. An async function always returns a promise. TypeScript rejects it, React warns in development, and on unmount React tries to call the promise as a cleanup and crashes. Define an async function inside the effect and call it instead. Promises inside the effect are fine.',
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
        why: 'The interval\'s callback was created during the first render, so it holds that render\'s count forever. This is called a stale closure. Add count to the dependency array, so the interval restarts with the new value, or read the latest value from a ref. To update count, setCount(c => c + 1) avoids reading it at all.',
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
        why: 'useLayoutEffect runs after React updates the DOM but before the browser paints. So you can measure an element and adjust it without a visible flicker. It blocks painting while it runs, so a slow effect does not belong there. Most DOM work, like focusing an input, is fine in useEffect.',
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
        why: 'Every reactive value the effect reads goes in: props, state, and anything computed from them during render. The lint rule checks this for you. If a dependency changes too often, fix the cause: move the function inside the effect, or keep the value in a ref. Silencing the warning hides a stale value bug.',
      },
      {
        t: 1,
        q: 'When does useEffect run?',
        opts: [
          'After React commits the render to the DOM',
          'Before the component renders for the first time',
          'During the render, while the JSX is built',
        ],
        a: 'After React commits the render to the DOM',
        why: 'React first renders, then commits the changes to the DOM, and only then runs your effects. Usually that is after the browser paints, so effects do not hold up the screen. An effect never runs before or during a render.',
      },
      {
        t: 1,
        q: 'What happens with no dependency array at all?',
        code: `useEffect(() => {
  // ...
});`,
        opts: [
          'It runs after every render',
          'It runs only after the first render',
          'It never runs until you add one',
        ],
        a: 'It runs after every render',
        why: 'No array means React has nothing to compare, so it runs the effect after every render, cleaning up the last run first. An empty array is the one that runs once. Leaving the array out never stops an effect from running.',
      },
      {
        t: 1,
        q: 'What is useEffect for?',
        opts: [
          'Staying in sync with something outside React',
          'Computing values from props and state',
          'Responding when a user clicks a button',
        ],
        a: 'Staying in sync with something outside React',
        why: 'Effects connect a component to systems React does not manage: a timer, a subscription, a browser API, a server. A value you can compute from props and state belongs in the render itself. A click belongs in the click handler.',
      },
      {
        t: 1,
        q: 'How do you stop a setInterval when the component leaves the screen?',
        opts: [
          'Return a cleanup that calls clearInterval',
          'Call clearInterval at the top of the component',
          'Nothing. React clears timers on unmount',
        ],
        a: 'Return a cleanup that calls clearInterval',
        why: 'Return a function from the effect. React calls it when the component unmounts, and before any re-run. Calling clearInterval at the top of the component would run on every render, with no id to clear. React knows nothing about your timers, so it cannot clear them for you.',
      },
      {
        t: 1,
        q: 'What happens here?',
        code: `const [user, setUser] = useState({ name: 'Ada' });
useEffect(() => {
  setUser({ name: 'Ada' });
}, [user]);`,
        opts: [
          'It loops: every run makes a new user object',
          'It runs once, since the name never actually changes',
          'React merges the two updates into one',
        ],
        a: 'It loops: every run makes a new user object',
        why: '`{ name: \'Ada\' }` is a new object every time, so Object.is sees a change. The new user re-runs the effect, which sets a new user again, forever. React does not stop it. In development it logs a "Maximum update depth exceeded" warning, but the loop keeps running. In production it just burns CPU quietly. React compares objects by identity, not by contents, so the matching name does not help.',
      },
      {
        t: 1,
        q: 'This effect fetches a user. What goes in the array?',
        code: `import { fetchUser } from './api';

useEffect(() => {
  fetchUser(userId).then(setUser);
}, [/* ??? */]);`,
        opts: [
          '[userId]',
          '[] so it runs only once',
          '[setUser, fetchUser]',
        ],
        a: '[userId]',
        why: 'The effect reads userId, so it has to run again when userId changes. With [], it would keep showing the first user after the prop changes. setUser from useState is stable, and fetchUser is an import, so neither needs to be listed.',
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
    hook: 'The state you read is the value from that render. Setters only queue updates. React works through the queue during the next render, so use the updater form when the next value depends on the last.',
    par: 95,
    drill: 'Ask which render\'s value you are reading. Inside a handler, state is fixed: it is the value from the render that created the handler. Setters only queue updates, so ask whether the next value depends on the last one. If it does, use the updater form. Then ask whether it needs to be state at all, or can be computed.',
    sorts: [
      {
        t: 1,
        title: 'Where should each value live?',
        buckets: ['State', 'Ref', 'Computed in render'],
        items: [
          { name: 'The search text that filters a list as you type', bucket: 'State', why: 'The list on screen changes with every keystroke, so each change has to start a render.' },
          { name: 'Whether a dropdown menu is open', bucket: 'State', why: 'Opening and closing changes what is on screen, so it has to start a render.' },
          { name: 'The id from setInterval, kept so you can clear it later', bucket: 'Ref', why: 'You need to keep it between renders, but the screen never shows it. A ref holds it without causing a render.' },
          { name: 'The DOM input you want to focus', bucket: 'Ref', why: 'Pass a ref to the input, and React puts the DOM node in .current for you.' },
          { name: 'How many times a button was clicked, never shown anywhere', bucket: 'Ref', why: 'It has to survive between renders, but nothing on screen depends on it, so a render would be wasted.' },
          { name: 'The total price of the items in a cart', bucket: 'Computed in render', why: 'It comes straight from the cart items, so work it out each render. Keeping a copy in state means two values that can disagree.' },
          { name: 'The todos that match the search text', bucket: 'Computed in render', why: 'It comes from the todos and the search text, both already in state. Filter them during render.' },
        ],
        note: 'Ask two questions. Does the screen need to update when it changes? Then it is state, unless it can be worked out from other values, in which case compute it during render. Does it only need to survive between renders, without showing up? Then it is a ref.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'count is 0. A click handler runs `setCount(count + 1)`, then `setCount(c => c + 1)`',
        steps: [
          'The handler reads count from this render: 0',
          'setCount(count + 1) queues "set it to 1"',
          'setCount(c => c + 1) queues "add one"',
          'The handler finishes',
          'React renders Counter once',
          'useState works through the queue: 1, then 2, so it shows 2',
        ],
        decoys: ['count changes to 1 inside the handler', 'React renders after the first setCount'],
        note: 'Inside the handler, count stays 0, because it belongs to this render. Each setter call only adds to a queue. When the handler is done, React renders Counter once. During that render, useState works through the queue in order: "set it to 1" gives 1, then "add one" gives 2.',
      },
    ],
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
        why: 'React batches every setState from the same event into one re-render. Since React 18 that also covers updates inside timeouts, promises and native event listeners, so a timeout no longer gets two renders. A setter never renders on its own.',
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
        why: 'count is a constant for this render, so both lines compute 0 + 1 and set 1. The second call does not see the first. Nothing is lost: count does change, just to 1.',
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
        why: 'Each updater function receives the result of the one before it in the queue: 0 + 1 is 1, then 1 + 1 is 2. Nothing is discarded, and it works the same in or out of event handlers. Use this form whenever the next value depends on the last.',
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
        why: 'Each render has its own props, state and handlers, fixed in place. Calling the setter does not change the variable you are holding. It asks React to render again, and the new value shows up in that next render.',
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
        why: 'useState(buildHugeList()) calls buildHugeList on every render, then ignores the result after the first. useState(buildHugeList) passes the function itself, and React only calls it on the first render. That is called a lazy initializer. Both are valid, and it only matters when the work is expensive.',
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
        why: 'user.name = \'Ryan\' changes the object, but setUser gets the same object back. React compares with Object.is, sees the same object, and bails out, so the screen keeps the old name. The new name only shows up later, when something else re-renders. Make a new object instead: setUser({ ...user, name: \'Ryan\' }). React never deep-compares, and nothing throws.',
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
        why: 'Changing a ref does not re-render. That is the point: use one for values the screen does not show, like a timer id. Refs can hold any value, not just DOM nodes. And because a ref change does not re-render, do not read one during render to decide what to show.',
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
        why: 'Controlled means React state is the source of truth. The input shows value, and onChange updates the state. An uncontrolled input keeps its value in the DOM, set with defaultValue and read through a ref. Being inside a form changes nothing.',
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
        why: 'React keeps state for the same component in the same position. Selecting another item changes neither, so the old edits stay. Give the panel key={item.id}, and a new id makes React mount a fresh panel. Clearing fields in an effect works, but it renders the stale values first and is easy to get wrong.',
      },
      {
        t: 3,
        q: 'When is useReducer the better call?',
        opts: [
          'When many handlers update the same state',
          'Whenever you have more than two useState calls',
          'When the state has to be shared across the tree',
        ],
        a: 'When many handlers update the same state',
        why: 'When many event handlers update the same state, a reducer moves every way it can change into one pure function. That also makes them easy to test. The number of useState calls is not the trigger, and a reducer does not share state by itself. That is context\'s job.',
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
        why: 'Storing filteredItems in state means two sources of truth, and a render where they disagree. Compute it during render from items and query. Reach for useMemo only if the filtering turns out to be slow.',
      },
      {
        t: 1,
        q: 'Right after `setCount(5)`, the handler logs `count`. What prints?',
        code: `function handleClick() {
  setCount(5);
  console.log(count); // ???
}`,
        opts: [
          'The old value, from this render',
          '5, the value you just set',
          'undefined until the next render',
        ],
        a: 'The old value, from this render',
        why: 'count is a constant for this render. setCount(5) queues an update and does not touch it. The new value shows up when React renders again, after the handler finishes. Nothing becomes undefined.',
      },
      {
        t: 1,
        q: 'Which call adds an item to the todos array in state?',
        opts: [
          'setTodos([...todos, item])',
          'todos.push(item); setTodos(todos)',
          'setTodos(todos.push(item))',
        ],
        a: 'setTodos([...todos, item])',
        why: '[...todos, item] is a new array with the item on the end, so React sees a change and renders. push changes the old array in place, and setTodos(todos) passes that same array back, so React skips the render. And push returns the new length, so setTodos(todos.push(item)) would replace your list with a number.',
      },
      {
        t: 1,
        q: 'What does useState give you back?',
        opts: [
          'The current value and a setter',
          'A ref to the value and a setter',
          'A getter function and a setter',
        ],
        a: 'The current value and a setter',
        why: 'const [count, setCount] = useState(0) gives you two things: the value for this render, and a function that asks for a new value. The value is a plain value, not a ref, and there is no getter. You read it directly.',
      },
      {
        t: 1,
        q: 'Two sibling components both need the same piece of state. Where does it go?',
        opts: [
          'In their closest shared parent, passed down',
          'Copied into both, then kept in sync',
          'In a ref that both siblings read',
        ],
        a: 'In their closest shared parent, passed down',
        why: 'That is called lifting state up. The parent owns the state and passes it to both siblings as props, along with a setter if they need to change it. Two copies would drift apart. A ref would not re-render either sibling when it changes.',
      },
      {
        t: 1,
        q: 'Two Counter components are on screen. You click the first one. What happens to the second?',
        opts: [
          'Nothing. Each one has its own state',
          'It counts up too, since it is the same component',
          'It resets to its starting value',
        ],
        a: 'Nothing. Each one has its own state',
        why: 'Each place a component appears on screen gets its own state. Writing the same component twice gives you two separate counts. Clicking one changes only that one, and the other keeps its value.',
      },
      {
        t: 1,
        q: 'What is batching?',
        opts: [
          'Applying several updates in a single re-render',
          'Saving state to localStorage in groups',
          'Running effects one after another in order',
        ],
        a: 'Applying several updates in a single re-render',
        why: 'When one event calls several setters, React waits until the event is done, then renders once, working through all of them. That saves work, and the screen never shows a half-updated state. It has nothing to do with storage or effects.',
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
    drill: 'Ask how React will match the old items to the new ones. With a key, it matches by key. Without one, it matches by position. Then ask whether that key stays with its item when the list is reordered, grows or shrinks. If it does not, state and DOM end up on the wrong item.',
    sorts: [
      {
        t: 1,
        title: 'A list of todos. Is each one a good key?',
        buckets: ['Good key', 'Risky key'],
        items: [
          { name: 'todo.id from the database', bucket: 'Good key', why: 'It belongs to the item and never changes, so it follows the todo wherever it moves.' },
          { name: 'todo.slug, unique and never edited', bucket: 'Good key', why: 'Anything unique among the siblings that never changes works. It does not have to be called id.' },
          { name: 'The index, in a fixed list that never changes', bucket: 'Good key', why: 'If nothing is ever reordered, added or removed, each index always points at the same item. The index is fine there.' },
          { name: 'The index, in a list you can reorder', bucket: 'Risky key', why: 'Move an item and its index changes, so React matches it to whatever used to be at that position. State and DOM end up on the wrong row.' },
          { name: 'Math.random() called during render', bucket: 'Risky key', why: 'A new key every render means React never finds a match. It throws away every row and mounts it again, losing state and focus.' },
          { name: 'Date.now() called during render', bucket: 'Risky key', why: 'Same problem as Math.random(): it changes between renders. And every row rendered in the same millisecond gets the same key, which is usually all of them.' },
        ],
        note: 'A good key is unique among its siblings and stays with its item from render to render. Data ids are the usual choice. The index only works when no item can move to a different index. Anything made up during render changes every time, which defeats the point.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'Rows A, B and C are keyed by index. You type into row A\'s input, then delete row A',
        steps: [
          'The new list is B, C',
          'B gets key 0 and C gets key 1',
          'React matches keys 0 and 1 to the old first two rows',
          'Key 2 has no match, so React removes that row',
          'Row 0 keeps its DOM, your typed text included',
          'Row 0 now shows B\'s label next to A\'s text',
        ],
        decoys: ['React removes the row that showed A', 'B shows up with an empty input'],
        note: 'React matches rows by key. With index keys, deleting A shifts B to key 0 and C to key 1. Key 2 has no match any more, so React removes that row first. Row 0 is kept, with its DOM and state, typed text included, and now shows B\'s label. With key={item.id}, React would remove A\'s row and leave B and C alone.',
      },
    ],
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
        why: 'Between renders, React uses keys to match each old item to its new version. Then it can move, keep or remove the right one. Keys do not make anything faster on their own, and they only need to be unique among siblings.',
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
        why: 'Delete the first row and every index shifts down by one. React matches by key, so it thinks row 0 just got new props. That row keeps its state and DOM, and they now belong to a different item. React does not warn about it, because the keys are still unique.',
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
        why: 'React only compares keys within one list, among siblings. Two different lists can both use key="1" without any problem.',
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
        why: 'A different key means a different thing to React. It unmounts the old one, state and all, and mounts a new one. That is the clean way to reset a component on purpose, and also why an unstable key quietly destroys state. Keys work outside .map too.',
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
        why: 'The <> shorthand cannot take any props, key included. Import Fragment from react and write <Fragment key={id}>. A key on the first child would not identify the whole group.',
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
        why: 'React keeps state for the same component type in the same position. A different type there means React unmounts the old one and mounts the new one, with fresh state. There is no warning. It is simply how identity works.',
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
        why: 'A new key every render means no row ever matches its old self. React throws every row away and mounts it again, every render. You lose state, typed input and focus, and do the most DOM work possible. It is never fine, even for a list that does not change.',
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
        why: 'With no key, a component\'s identity is its type plus its position. Neither changed, so React keeps the instance and its state, and just passes the new props. This is the rule behind most "why did my state survive" questions.',
      },
      {
        t: 1,
        q: 'You render a list with .map and forget the key. What happens?',
        opts: [
          'React warns, then matches items by position',
          'React refuses to render the list at all',
          'React makes up a stable id for each item',
        ],
        a: 'React warns, then matches items by position',
        why: 'The list still renders. In development, React warns that each child should have a unique key, then falls back to matching items by their position, the same as index keys. It cannot invent a stable id, because it does not know which data belongs to which item.',
      },
      {
        t: 1,
        q: 'Which is the best key for a list of users?',
        opts: [
          'user.id from the database',
          'The index from .map',
          'Math.random() at render time',
        ],
        a: 'user.id from the database',
        why: 'An id from your data stays with its user, whatever order the list is in. The index changes when the list is reordered or an item is removed. Math.random() changes on every render, so nothing ever matches.',
      },
      {
        t: 1,
        q: 'Where does the key go?',
        code: `<ul>
  {users.map(user => (
    <li>
      <UserCard user={user} />
    </li>
  ))}
</ul>`,
        opts: [
          'On the li, the outermost element in the map',
          'On UserCard, the component inside the li',
          'On the ul that wraps the whole list',
        ],
        a: 'On the li, the outermost element in the map',
        why: 'The key goes on whatever the .map callback returns, because those are the siblings React has to tell apart. Here that is the li. A key on UserCard is too deep, since each li holds only one, and the ul is not repeated at all.',
      },
      {
        t: 1,
        q: 'Can a component read its own key from props?',
        opts: [
          'No. React uses it and does not pass it on',
          'Yes, as props.key, like any other prop',
          'Only if the key is a number, not a string',
        ],
        a: 'No. React uses it and does not pass it on',
        why: 'key is for React, not for your component. props.key is undefined, and React warns in development if you try to read it. If the component needs the id, pass it again as a normal prop, like id={user.id}.',
      },
      {
        t: 1,
        q: 'When is the array index an acceptable key?',
        opts: [
          'No item ever moves to a different index',
          'The list has fewer than ten items in it',
          'The items are plain strings, not objects',
        ],
        a: 'No item ever moves to a different index',
        why: 'The index is only a problem when an item can end up at a different index. That rules out reordering, and inserting or deleting anywhere but the end. A static list, or one that only adds or removes at the end, is safe. Size has nothing to do with it, and neither does the type of the items.',
      },
      {
        t: 1,
        q: 'Two items in the same list have the same key. What happens?',
        opts: [
          'React warns, and those items can mix up',
          'React keeps only the first one with that key',
          'Nothing, as long as the items differ',
        ],
        a: 'React warns, and those items can mix up',
        why: 'React warns in development that two children have the same key. Rendering still works at first, but React cannot tell those two apart, so on updates they can be duplicated or dropped. Keys must be unique among siblings, whatever the items contain.',
      },
      {
        t: 1,
        q: 'What does React use to decide that a list item is the same one as last render?',
        opts: [
          'Its key, plus the component type',
          'Its props, compared one by one each render',
          'The text it rendered last time',
        ],
        a: 'Its key, plus the component type',
        why: 'React matches by key and type, not by looking at what the item contains. Same key and same type means the same item: React keeps its state and DOM and updates the props. Props and output can change completely and it is still the same item.',
      },
      {
        t: 3,
        q: 'A list of 1,000 rows keyed by id is reversed. What does React do with the DOM?',
        opts: [
          'Moves the existing rows into the new order',
          'Destroys every row, then builds them again',
          'Updates each row\'s text where it already is',
        ],
        a: 'Moves the existing rows into the new order',
        why: 'Each key still matches the same row, so React keeps every DOM node and moves it to its new place, state and all. With index keys it would do the third thing: keep the nodes where they are and change each one\'s content, which is how state ends up on the wrong row.',
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
    hook: 'memo skips a re-render when props are shallow-equal. useMemo caches a value, useCallback caches a function reference. useMemo can also skip an expensive calculation. Otherwise they only pay off when something compares what you hand it.',
    par: 90,
    drill: 'Ask what is being compared, and by whom. memo compares a component\'s props. A dependency array compares its values. Then ask whether what you pass in is the same object as last time. A new object, array or arrow function fails that comparison every time. And before any of it, ask whether you measured.',
    sorts: [
      {
        t: 1,
        title: 'Which tool fits each job?',
        buckets: ['memo', 'useMemo', 'useCallback'],
        items: [
          { name: 'Skip re-rendering a big Chart when its parent renders with the same props', bucket: 'memo', why: 'That is a whole component skipping its render, which is what memo wraps a component to do.' },
          { name: 'Wrap a whole component so it bails out when its props are equal', bucket: 'memo', why: 'memo goes around the component itself and compares its props each time the parent renders.' },
          { name: 'Avoid re-filtering a long list when only unrelated state changed', bucket: 'useMemo', why: 'useMemo keeps the filtered list and only runs the filter again when its inputs change.' },
          { name: 'Keep a style object identical between renders, for a child that compares props', bucket: 'useMemo', why: 'useMemo can hand back the same object every render, so a child comparing props sees no change.' },
          { name: 'Pass the same onSelect handler to 1,000 rows on every render', bucket: 'useCallback', why: 'useCallback keeps the function identical between renders, so rows that compare props can skip.' },
          { name: 'Keep a function stable so an effect that lists it does not re-run', bucket: 'useCallback', why: 'The effect compares its dependencies too. A stable function means no change, so the effect stays put.' },
        ],
        note: 'memo wraps a component. useMemo keeps a value, and useCallback keeps a function. useMemo also pays off by skipping an expensive calculation. Otherwise, the last two only help when something compares what you hand it: a component wrapped in memo, or a dependency array.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'Row is wrapped in memo and gets `onSelect={() => select(id)}`. Its parent renders again',
        steps: [
          'The parent renders again',
          'It creates a new arrow function for onSelect',
          'memo compares Row\'s old and new props',
          'Object.is sees a different function',
          'Row renders again anyway',
        ],
        decoys: ['memo sees the same code and skips Row', 'React reuses the arrow from the last render'],
        note: 'Every render creates a brand new arrow function, even though the code is the same. memo compares props with Object.is, which only cares whether it is the same function, not what it does. So the check fails every time. Wrap the handler in useCallback, or let the React Compiler do it, and Row can skip.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'What does React.memo do?',
        opts: [
          'Skips a re-render when props are shallow-equal',
          'Stops re-renders caused by its own state',
          'Memoizes the state that the component is holding',
        ],
        a: 'Skips a re-render when props are shallow-equal',
        why: 'Shallow-equal means React compares each prop with Object.is, one level deep. If every prop is the same as last time, React skips calling the component. A new object or function prop fails that check. It does not block re-renders from the component\'s own state, or from a context it reads.',
      },
      {
        t: 1,
        q: 'What does useMemo do?',
        opts: [
          'Caches a computed value between renders',
          'Stops the component from re-rendering at all',
          'Caches a network response by its key',
        ],
        a: 'Caches a computed value between renders',
        why: 'useMemo runs your function and keeps the result. On later renders it hands back that same result until a dependency changes. Use it for expensive calculations, or to keep an object or array identical so a child wrapped in memo can skip. It does not stop any render, and it is not a fetch cache.',
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
        why: 'useCallback hands back the same function on every render until a dependency changes. It is the same as useMemo(() => fn, deps), just shorter. It does not make the function faster or run it. It only helps when something compares the function, like a memo child or an effect.',
      },
      {
        t: 2,
        q: 'Why does this memoized child still re-render on every parent render?',
        code: `const Row = React.memo(RowImpl);

<Row onSelect={() => select(id)} />`,
        opts: [
          'A new function every render',
          'memo skips function props entirely',
          'memo only works on class components',
        ],
        a: 'A new function every render',
        why: '`() => select(id)` is a new function on every render, so memo\'s Object.is check fails every time. memo does compare function props, and it works on function components. Wrap the handler in useCallback, or let the React Compiler handle it. This is the most common way memo gets quietly defeated.',
      },
      {
        t: 2,
        q: 'When is memo not worth adding?',
        opts: [
          'On cheap components, where skipping saves little',
          'Never. Wrap everything you can and move on, it is free',
          'Only in development, where renders are slower',
        ],
        a: 'On cheap components, where skipping saves little',
        why: 'memo adds code and a props comparison on every parent render. On a cheap component, skipping saves almost nothing. If a prop is new every render, memo never skips at all. Profile first, then add memo where the Profiler shows real cost. Development mode has nothing to do with it.',
      },
      {
        t: 2,
        q: 'One context holds user, theme and a cart. Every cart change re-renders everything that reads it. Best fix?',
        opts: [
          'Split it by how often each part changes',
          'Wrap each consumer in memo to block the render',
          'Nothing. Context always re-renders its readers',
        ],
        a: 'Split it by how often each part changes',
        why: 'Every component that reads a context re-renders when its value changes. memo does not help, because the change comes through useContext, not props. Split it into separate contexts, so a cart change only reaches components that read the cart. Also wrap the value object in useMemo, so it does not change on every render of the provider.',
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
        why: 'The cost is the number of DOM nodes, not the render function. memo still leaves 10,000 rows in the page. Rendering only the visible rows, called virtualization, keeps the page small. Libraries like react-window and TanStack Virtual do it. Server pagination helps too, but it changes the product rather than fixing the table.',
      },
      {
        t: 3,
        q: 'How do you find out what is actually slow?',
        opts: [
          'React DevTools Profiler, with why-rendered on',
          'console.time around each component\'s render function',
          'The Chrome memory tab over a few minutes',
        ],
        a: 'React DevTools Profiler, with why-rendered on',
        why: 'The React DevTools Profiler records every render and how long it took. Turn on "Record why each component rendered while profiling" in its settings, and it tells you what caused each one. console.time cannot see React\'s work, and the memory tab is for leaks, not speed. Saying this in an interview beats listing memo APIs.',
      },
      {
        t: 3,
        q: 'Your team turns on the React Compiler. What changes about memoization?',
        opts: [
          'Most new code needs no manual memo',
          'Keys become optional in rendered lists',
          'Third-party components get memo applied',
        ],
        a: 'Most new code needs no manual memo',
        why: 'The compiler adds memoization to your code at build time, so new code rarely needs manual memo, useMemo or useCallback. Existing memo can stay, since removing it can change what the compiler outputs. When it spots code that breaks the Rules of React, it skips that component, but it cannot catch every case. Keys still matter, and it only compiles your code, not third-party packages.',
      },
      {
        t: 1,
        q: 'When does expensiveSum run again?',
        code: 'const total = useMemo(() => expensiveSum(items), [items]);',
        opts: [
          'Only when items changes',
          'On every render, just faster',
          'Never again after the first render',
        ],
        a: 'Only when items changes',
        why: 'useMemo runs the function on the first render and keeps the result. After that, it compares items with last time. Same items, same result handed back without running anything. A new items array, and it runs again. It does not run every render, and it does not freeze forever.',
      },
      {
        t: 1,
        q: 'A child wrapped in memo gets `items={data.filter(x => x.active)}`. The parent renders again. Does the child skip?',
        opts: [
          'No. filter makes a new array every time',
          'Yes. The contents are exactly the same',
          'Only when the array happens to be empty',
        ],
        a: 'No. filter makes a new array every time',
        why: 'filter always returns a brand new array, even when it holds the same items. memo compares with Object.is, so it sees a different array and renders the child. Wrap the filter in useMemo, so the same array comes back until data changes. Even an empty result is a new array.',
      },
      {
        t: 1,
        q: 'What should you do before adding memo anywhere?',
        opts: [
          'Measure with the React Profiler',
          'Wrap every child, just in case',
          'Turn the component into a class',
        ],
        a: 'Measure with the React Profiler',
        why: 'Most slowness is not where you would guess. The Profiler shows which components rendered, how long each took, and why. Then you know where memo, or a structural fix, will pay off. Wrapping everything adds cost without knowing it helps, and class components have no advantage here.',
      },
      {
        t: 1,
        q: 'Which of these props stays the same between renders without any memo?',
        opts: [
          'A string like \'primary\'',
          'An inline style object',
          'An inline arrow function',
        ],
        a: 'A string like \'primary\'',
        why: 'Strings, numbers and booleans compare by value, so \'primary\' equals \'primary\' every render. An object or function written inline is created fresh each render, so Object.is sees a new one every time.',
      },
      {
        t: 1,
        q: 'useMemo and memo sound alike. What is the difference?',
        opts: [
          'useMemo keeps a value; memo wraps a component',
          'They are one hook, under two names',
          'memo keeps a value; useMemo wraps a component',
        ],
        a: 'useMemo keeps a value; memo wraps a component',
        why: 'useMemo is a hook you call inside a component to keep a computed value between renders. memo is a function you wrap around a whole component, so it can skip rendering when its props are unchanged. They work well together: useMemo keeps a prop stable, so the memo child can skip.',
      },
      {
        t: 1,
        q: 'What does virtualization do for a long list?',
        opts: [
          'Renders only the rows on screen',
          'Caches each row\'s HTML as a string',
          'Moves the whole list to a Web Worker',
        ],
        a: 'Renders only the rows on screen',
        why: 'A virtualized list only renders the rows you can see, plus a few extra, and swaps them as you scroll. The page holds dozens of DOM nodes instead of thousands. Nothing is cached as HTML, and React cannot render the DOM from a worker.',
      },
      {
        t: 2,
        q: 'This callback reads `count`. After a few clicks, what does it see?',
        code: `const logCount = useCallback(() => {
  console.log(count);
}, []);`,
        opts: [
          'count from the first render, forever',
          'The latest count, every time it runs',
          'undefined, since count is not listed',
        ],
        a: 'count from the first render, forever',
        why: 'With [], useCallback hands back the function from the first render, every time. That function holds that render\'s count, so it never sees a newer one. This is a stale closure. Add count to the array, or use the updater form, setCount(c => c + 1), if you only need to change it.',
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
    drill: 'Ask where the hook is called. At the top level of a component or custom hook, on every render? Then it is fine. Inside a condition, a loop, a handler, or after an early return? Then the order of calls can change. use() is the one that may sit in a condition. For the React 19 questions, ask what job the API does: reading a value, tracking an action, or showing a result early.',
    sorts: [
      {
        t: 1,
        title: 'Does each hook call follow the rules?',
        buckets: ['Allowed', 'Breaks the rules'],
        items: [
          { name: 'useState at the top of a component', bucket: 'Allowed', why: 'Top level, every render, same order. That is exactly what the rule asks for.' },
          { name: 'useEffect inside a custom hook named useTimer', bucket: 'Allowed', why: 'Custom hooks may call hooks, as long as they do it at their own top level.' },
          { name: 'use(ThemeContext) inside an if block', bucket: 'Allowed', why: 'use is the exception. React built it to be read conditionally, so it can sit inside an if.' },
          { name: 'useState inside an if block', bucket: 'Breaks the rules', why: 'When the condition changes, the number of hook calls changes, and React matches hooks by order. If the component has other hooks, React throws as soon as the count differs.' },
          { name: 'useEffect called after an early return', bucket: 'Breaks the rules', why: 'On renders that return early, the effect is never called. That changes the order, the same as a condition would.' },
          { name: 'useState inside a click handler', bucket: 'Breaks the rules', why: 'Hooks only run during render. Called from a handler, React throws "Invalid hook call".' },
          { name: 'useMemo inside a .map over items', bucket: 'Breaks the rules', why: 'The number of calls follows the number of items, so it changes whenever the list does.' },
        ],
        note: 'React finds each hook\'s state by the order of the calls. Anything that can change that order breaks the rules: a condition, a loop, an early return above the hook, or a call outside render. use() is the one API built to be read conditionally.',
      },
    ],
    flows: [
      {
        t: 1,
        title: 'Profile calls `useState(\'Ada\')` for name only when isAdmin is true, then `useState(30)` for age. isAdmin flips to false',
        steps: [
          'First render: name takes slot 1, age takes slot 2',
          'isAdmin changes to false',
          'The next render skips the name call',
          'age\'s useState is now the first call, so it reads slot 1',
          'age gets \'Ada\', the name\'s value',
          'React sees fewer hooks than last time and throws',
        ],
        decoys: ['React finds age\'s state by its variable name', 'React quietly skips the missing hook'],
        note: 'React stores hook state in slots, in call order, and never looks at variable names. Skip one call and every hook after it reads the slot meant for the one before. Here age briefly gets \'Ada\'. Then React notices fewer hooks than last render and throws "Rendered fewer hooks than expected". That is why hooks go at the top level, before any condition or early return.',
      },
    ],
    questions: [
      {
        t: 1,
        q: 'What is the rule of hooks?',
        opts: [
          'Top level only, never in a condition or loop',
          'Anywhere, as long as the name starts with use',
          'Only inside useEffect or inside an event handler',
        ],
        a: 'Top level only, never in a condition or loop',
        why: 'Call hooks at the top level of a component or a custom hook, on every render, in the same order. Never inside a condition, a loop, a nested function or after an early return. React only needs the same calls in the same order each render. The rule says top level because a condition or loop can change that order, and the linter cannot prove it will not. Hooks cannot be called from effects or event handlers at all.',
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
        why: 'React stores each hook\'s state in a list, in the order the hooks are called. Hook number three on this render has to be hook number three on the next. A hook inside a condition shifts everything after it. React never looks at variable names, and it has nothing to do with bundle size.',
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
        why: 'A custom hook is a plain function whose name starts with use, and that calls other hooks. It renders nothing, so it is not a component. The use prefix tells the linter that hooks are allowed inside, and then it checks them.',
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
        why: 'Custom hooks share logic, not state. Each component that calls useCounter() gets its own count, wherever it sits in the tree. To share one count, lift the state up to a parent, or use context or a store.',
      },
      {
        t: 2,
        q: 'What does useContext do?',
        opts: [
          'Reads the nearest provider value above it',
          'Creates global state that the whole app can read',
          'Only works when called at the app root',
        ],
        a: 'Reads the nearest provider value above it',
        why: 'useContext walks up the tree and returns the value of the nearest provider for that context. It creates nothing, and it works in any component. If there is no provider above, you silently get the default value you passed to createContext, which is a classic bug.',
      },
      {
        t: 2,
        q: 'What is new in React 19 for passing a ref into a function component?',
        opts: [
          'As a normal prop',
          'Wrap it in forwardRef, as before',
          'Refs cannot reach function components',
        ],
        a: 'As a normal prop',
        why: 'In React 19, function MyInput({ ref, ...props }) just works: ref arrives like any other prop. forwardRef still works, but new code does not need it, and React plans to deprecate it.',
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
        why: 'In React 19 you can render the context itself as the provider: <ThemeContext value="dark">. The old <ThemeContext.Provider> still works. It is a small syntax win, and knowing it shows you have kept up with React 19.',
      },
      {
        t: 3,
        q: 'What is the `use` API for?',
        opts: [
          'Reading a promise or context during render',
          'Replacing useEffect for all data fetching',
          'Running only during server rendering',
        ],
        a: 'Reading a promise or context during render',
        why: 'use(promise) suspends the component until the promise resolves, so it pairs with Suspense. use(Context) reads a context. Unlike hooks, use can be called inside a condition or a loop. The promise should come from outside the render, like from a server component or a cache, not be created on every render. It is not limited to the server.',
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
        why: 'useActionState returns three things: the latest result of the action, a wrapped action to call, and an isPending flag. The parent form\'s pending status is useFormStatus, and an optimistic value is useOptimistic. useActionState was called useFormState in early canary releases.',
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
        why: 'useOptimistic shows a guess right away, like a sent message, while the action runs. When the action ends, React drops the guess and shows the real state again. If the action saved the message, the real state now has it. If the action catches its error and leaves the real state alone, the guess just disappears. If the action throws, the error also goes to the nearest error boundary.',
      },
      {
        t: 3,
        q: 'What is useId for?',
        opts: [
          'A stable id that matches server and client',
          'A fresh random id generated on every render pass',
          'A drop-in replacement for key in lists',
        ],
        a: 'A stable id that matches server and client',
        why: 'useId gives a component an id that stays the same between renders, and matches between the server\'s HTML and the client. Use it for htmlFor and aria attributes. Math.random would produce different ids on server and client and break hydration. And it is not for list keys: keys should come from your data.',
      },
      {
        t: 1,
        q: 'Where can you call a hook?',
        opts: [
          'In a component or a custom hook',
          'In any function, helpers included',
          'Only inside the component\'s JSX',
        ],
        a: 'In a component or a custom hook',
        why: 'Hooks can only be called while React is rendering a component, so they go in a component\'s body or in a custom hook it calls. A plain helper might be called from anywhere, like an event handler, where hooks do not work. JSX is just the return value.',
      },
      {
        t: 1,
        q: 'What happens when isLoggedIn changes?',
        code: `function Header({ isLoggedIn }) {
  if (isLoggedIn) {
    const [name, setName] = useState('');
  }
  const [count, setCount] = useState(0);
  // ...
}`,
        opts: [
          'React throws, since the number of hooks changed',
          'Nothing. React finds the hook by its name',
          'The name state quietly resets to empty',
        ],
        a: 'React throws, since the number of hooks changed',
        why: 'React matches hooks by the order of the calls. When isLoggedIn flips, this render makes one more or one fewer call than the last. Hooks after it would read the wrong state, so React throws "Rendered more hooks" or "Rendered fewer hooks" instead. It never looks at names.',
      },
      {
        t: 1,
        q: 'Why does a custom hook\'s name have to start with use?',
        opts: [
          'So the linter checks the hook rules in it',
          'React will not run it without the prefix',
          'The prefix makes it run only once',
        ],
        a: 'So the linter checks the hook rules in it',
        why: 'React itself does not check the name: a hook called getCount would still run. The use prefix tells the linter, and anyone reading the code, that the function calls hooks, so the rules of hooks apply inside it and wherever it is called. It does not change how often it runs.',
      },
      {
        t: 1,
        q: 'useWindowWidth() adds a resize listener in an effect. Header and Sidebar both call it. How many listeners?',
        opts: [
          'Two, one per component calling it',
          'One, shared by both of the callers',
          'None until one of them re-renders',
        ],
        a: 'Two, one per component calling it',
        why: 'Each call to a custom hook runs its own hooks, with its own state and its own effects. Two components calling it means two effects, so two listeners. Custom hooks share logic, never state. The effect runs after the first render, without waiting for another.',
      },
      {
        t: 1,
        q: 'Can you call useState inside an onClick handler?',
        opts: [
          'No. Hooks only run during render',
          'Yes, if the handler is in the component',
          'Yes, but only useState and useRef',
        ],
        a: 'No. Hooks only run during render',
        why: 'Hooks only work while React is rendering a component. A click handler runs later, outside render, so React throws "Invalid hook call". Declare the state at the top of the component, and call its setter from the handler.',
      },
      {
        t: 1,
        q: 'Which name follows the rule for custom hooks?',
        opts: [
          'useOnlineStatus',
          'getOnlineStatus',
          'withOnlineStatus',
        ],
        a: 'useOnlineStatus',
        why: 'A custom hook starts with use, followed by a capital letter. Call a hook inside getOnlineStatus, and the linter reports an error, because only components and use-prefixed functions may call hooks. withOnlineStatus is the old naming for a higher-order component, which wraps components instead of calling hooks.',
      },
    ],
  },
];

/** Field guide for the React division, including interview talking points. */
export const REACT_GUIDE: Record<ReactLineId, Guide> = {
  render: {
    plain: "A re-render means React calls your component function again to see what it returns now. Three things cause one: the component's own state changing, its parent rendering again, or a context it reads changing.\n\nAfter a render, React compares the new output with the old one. It changes the real DOM only where they differ. That last step is called the commit.\n\nSo a single re-render is usually cheap. What gets expensive is re-rendering a big tree over and over, and the fix is usually structure before memo.",
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
        'React comparing the new output with the old one to work out what changed.',
      ],
      [
        'referential equality',
        'Two values being the very same object, not just objects that look alike. memo compares props this way, with Object.is.',
      ],
      ['React.memo', 'Wraps a component so it skips re-rendering when every prop is equal to last time, compared with Object.is.'],
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
}

function Page() {
  return (
    <>
      <SearchBox />
      <ExpensiveTree />
    </>
  );
}`,
    },
    say: [
      'Three things trigger a re-render: the component\'s own state, its parent re-rendering, or a context it reads.',
      'A re-render is not a repaint. React compares the output and only commits what actually changed.',
      'Before reaching for memo, I look at structure. I move state down, or pass children as a prop so a subtree keeps its identity.',
      'With the React Compiler, most of that memoization happens automatically, as long as the components follow the Rules of React.',
    ],
    gotcha: 'Wrapping a child in memo does nothing if you pass it a fresh object, array or arrow function on every render. Each of those is a new object, so memo\'s comparison fails every time, and you pay for the comparison for nothing.',
    rehearse: [
      {
        prompt: 'What causes a component to re-render?',
        answer: 'Its own state changed, its parent re-rendered, or a context it reads changed. A re-render means React called the function again. It does not mean the browser repainted.',
      },
      {
        prompt: 'Typing in a form feels slow. How do you approach it?',
        answer: 'I profile first with the React DevTools Profiler. Usually the state sits too high in the tree, so every keystroke re-renders the whole page. I move it down, or pass children as a prop. memo comes after structure, and the React Compiler covers most of it now.',
      },
      {
        prompt: 'What is the difference between a render and a commit?',
        answer: 'Rendering is React calling my components to work out what the UI should look like now. The commit is when React applies the differences to the real DOM. A component can re-render, and the commit then finds nothing to change in the DOM. That is why a re-render on its own is usually cheap.',
      },
    ],
  },
  effect: {
    plain: 'useEffect is for staying in sync with something outside React: a subscription, a timer, a browser API, a server.\n\nReact runs your effect after a render is committed. It runs it again whenever a value in the dependency array changes. Before each re-run, and when the component leaves the screen, it runs the cleanup function you returned.\n\nIf you are using an effect to compute a value from props and state, or to respond to a click, you probably do not want an effect at all. Compute the value during render, or put the code in the event handler.',
    words: [
      [
        'effect',
        'Code that keeps the component in sync with an outside system, run after render.',
      ],
      [
        'dependency array',
        'The reactive values the effect reads. When one changes, the effect runs again.',
      ],
      ['cleanup', 'The function your effect returns. It undoes the last run.'],
      [
        'StrictMode',
        'A development-only check that runs each effect\'s setup, cleanup and setup again, keeping state, to expose effects with no cleanup.',
      ],
      [
        'stale closure',
        'A function still holding the values from the render that created it.',
      ],
    ],
    code: {
      label: 'subscribe and clean up',
      snippet: `// onMessage must stay the same function between renders, or this
// reconnects every render. useEffectEvent (stable since React 19.2) helps.
useEffect(() => {
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
      'Anything I can compute during render does not belong in state plus an effect. That pattern costs an extra render, with an out-of-date value committed in between.',
    ],
    gotcha: 'Removing a dependency to stop an effect looping trades the loop for a stale closure. Fix the cause: move the function inside the effect, use an updater function, or keep the changing value in a ref.',
    rehearse: [
      {
        prompt: 'What is useEffect for, and when do you not need one?',
        answer: 'It keeps a component in sync with something outside React: a subscription, a timer, an API. If I can compute the value during render, it belongs in render. If the work should happen because a user did something, it belongs in the event handler.',
      },
      {
        prompt: 'Explain the cleanup function.',
        answer: 'It undoes the last run. It fires before the effect runs again, and once on unmount, so subscriptions stay balanced. In development, StrictMode runs setup, cleanup and setup again to expose a missing cleanup.',
      },
      {
        prompt: 'Your effect fetches data. What can go wrong, and how do you handle it?',
        answer: 'If the input changes quickly, two responses can come back out of order, so a slow old one overwrites the new one. I handle that in the cleanup: abort the request with an AbortController, or set an ignore flag so the late result is dropped. In a real app I would usually reach for a data library or my framework\'s data loading instead of writing this by hand.',
      },
    ],
  },
  state: {
    plain: 'Each render gets its own fixed value of state. Calling the setter does not change the variable you are holding. It queues an update.\n\nReact batches everything queued in the same event. During the next render, it works through the queue in order, and the new values show up. That is why reading state right after setting it gives you the old value, and why two plain setCount(count + 1) calls only add one.',
    words: [
      [
        'snapshot',
        'The state values belonging to one render. They never change mid-render.',
      ],
      [
        'batching',
        'Several updates from one event applied together, with a single re-render.',
      ],
      [
        'updater function',
        'setCount(c => c + 1). It receives the latest queued value, not the one from this render.',
      ],
      ['lazy initializer', 'useState(fn), passing the function itself. React calls fn only on the first render.'],
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
      'React batches updates from the same event. Since React 18 that includes updates inside promises and timeouts.',
      'I treat state as immutable, so I make a new object every time. If I pass back the same object, React skips the update.',
      'Derived values get computed during render. Storing them in state gives you two sources of truth.',
    ],
    gotcha: 'To reset a child component when the selection changes, change its key instead of clearing fields in an effect. Same component in the same position keeps its state, and a new key mounts it fresh.',
    rehearse: [
      {
        prompt: 'Why does calling setCount(count + 1) twice only add one?',
        answer: 'State is a snapshot, so both calls read the same value from that render, and both set the same number. The updater form, setCount(c => c + 1), receives the queued value, so two of those add two.',
      },
      {
        prompt: 'How do you decide between state, a ref, and a derived value?',
        answer: 'If changing it should update the screen, it is state. If it has to survive renders without causing one, it is a ref. If it can be computed from what I already have, I compute it during render instead of storing it.',
      },
      {
        prompt: 'How do you update an object or an array in state?',
        answer: 'I make a new one instead of changing the old one. For an object, setUser({ ...user, name }). For an array, [...todos, item] to add, filter to remove, and map to change one item. React compares by reference, so if I change the old object and pass it back, React sees the same object and skips the update.',
      },
    ],
  },
  lists: {
    plain: 'When React re-renders a list, it has to match the new items to the old ones. By default it matches by position, which breaks the moment an item moves to a different index, like on a reorder or a delete.\n\nA key gives each item an identity that survives reordering. So React keeps the right DOM node, the right state and the right focus with the right item.\n\nThat is also why changing a key on purpose is the clean way to reset a component: a new key means a new thing, mounted fresh.',
    words: [
      ['key', 'A stable identity for an item, unique among its siblings.'],
      [
        'reconciliation',
        'How React decides what to keep, move, update or throw away.',
      ],
      [
        'remount',
        'React unmounts the old component and mounts a new one. All its state starts over.',
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
      'Index keys are fine when no item ever moves to a different index, like a static list or one that only grows at the end. Otherwise state lands on the wrong row.',
      'Keys only need to be unique among siblings.',
      'Changing a key is the documented way to reset a component, because React remounts it.',
    ],
    gotcha: 'key={Math.random()} silences the warning, but it remounts the whole list on every render. You lose state, typed input and focus, and do the most DOM work possible.',
    rehearse: [
      {
        prompt: 'Why do keys matter in a list?',
        answer: 'They tell React which item is which between renders, so state, focus and DOM nodes stay with the right item. Index keys break as soon as an item can move to a different index, like on a reorder, or an insert or delete before the end.',
      },
      {
        prompt: 'How do you reset a child component on purpose?',
        answer: 'Change its key. React treats it as a different thing in that position, so it unmounts the old one and mounts a fresh one.',
      },
      {
        prompt: 'Walk me through what goes wrong when you delete an item from a list keyed by index.',
        answer: 'Every item after the deleted one moves up, so its index changes. React matches by key, so it thinks the items kept their places and just got new props. The state and DOM that belonged to the deleted item stay on the row now showing the next item, like text typed into an input. And the last row is the one React removes. Keying by a real id fixes it, because the key moves with the item.',
      },
    ],
  },
  perf: {
    plain: "React gives you three memo tools. memo skips a component's re-render when its props are unchanged. useMemo keeps a computed value. useCallback keeps a function the same between renders.\n\nuseMemo and useCallback pay off in two cases. One is skipping an expensive calculation. The other is handing the same object to something that compares it, like a memo child or a dependency array, where a new object would fail the comparison. They cost code and comparison time, so the order is: measure, fix the structure, then memoize what is left.\n\nThe React Compiler now does most of this for you.",
    words: [
      ['shallow equal', 'Comparing each prop with Object.is, one level deep, without looking inside objects.'],
      [
        'referential stability',
        'Handing down the very same object or function on every render, so comparisons see no change.',
      ],
      ['virtualization', 'Rendering only the rows currently on screen, however long the list.'],
      [
        'Profiler',
        'The React DevTools panel that records each render, how long it took, and why it happened.',
      ],
      [
        'React Compiler',
        'A build step that adds memoization for you, for code that follows the Rules of React.',
      ],
    ],
    code: {
      label: 'memo that actually works',
      snippet: `const Row = React.memo(function Row({ item, onSelect }) { ... });

function List({ items }) {
  const [selected, setSelected] = useState(null);
  // setSelected never changes, so [] is safe, and Row can skip
  const onSelect = useCallback((id) => setSelected(id), []);
  return items.map(item => (
    <Row key={item.id} item={item} onSelect={onSelect} />
  ));
}`,
    },
    say: [
      'I profile before memoizing. The DevTools Profiler tells me what rendered and why, and it is usually not what I guessed.',
      'memo only helps when props stay the same object. An inline arrow or object prop is new every render, so it defeats memo.',
      'For long lists, the real fix is virtualization. The cost is the number of DOM nodes, not the render function.',
      'With the React Compiler, most manual memoization goes away, which puts the emphasis back on writing components that follow the rules.',
    ],
    gotcha: 'Memoizing everything rarely helps. It makes code harder to read, and one prop that is new every render defeats it. A wrong dependency array can also hand you a stale value. Structure first, memo second.',
    rehearse: [
      {
        prompt: 'When do you reach for memo, useMemo or useCallback?',
        answer: 'After profiling, and only where something compares what I pass. memo gets defeated by an inline object or arrow prop, so the fix is often structural. With the React Compiler, most of this is handled for me.',
      },
      {
        prompt: 'A table of thousands of rows scrolls badly. What do you do?',
        answer: 'Virtualize it, so only the visible rows render. The cost is the number of DOM nodes, not the render function, so wrapping every row in memo does not help.',
      },
      {
        prompt: 'What does the React Compiler change for you?',
        answer: 'It adds the memoization I used to write by hand. At build time, it works out what each part of a component depends on, and skips work when those inputs have not changed, the way memo, useMemo and useCallback would. When it spots code that breaks the Rules of React, it leaves that component alone, and it cannot spot everything. So the job shifts from sprinkling memo to writing components that follow the rules.',
      },
    ],
  },
  hooks: {
    plain: 'React keeps each component\'s hooks in a list, in the order you called them. That is the entire reason for the rules: call hooks at the top level, every render, in the same order, so hook number three is always the same hook.\n\nA custom hook is just a function that calls hooks. It shares logic between components, but never state.\n\nReact 19 added a few APIs on top of that: ref as a plain prop, the context itself as a provider, use() for reading promises and context in render, and the Action hooks for forms.',
    words: [
      [
        'rules of hooks',
        'Call hooks at the top level only, in the same order every render, and only in components or custom hooks.',
      ],
      ['custom hook', 'A function whose name starts with use, and that calls other hooks.'],
      [
        'use()',
        'A React 19 API that reads a promise or a context during render. Unlike hooks, it can sit inside a condition.',
      ],
      [
        'useActionState',
        'Tracks an action: its latest result, plus whether it is still running. Called useFormState in early canaries.',
      ],
      [
        'useOptimistic',
        'Shows the expected result right away, while the async action is still running.',
      ],
      ['useId', 'An id that stays stable and matches between server and client. For labels and aria, not keys.'],
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
      'The Action hooks, useActionState, useFormStatus and useOptimistic, cover the pending, error and optimistic states that everyone used to build by hand.',
    ],
    gotcha: 'An early return above a hook means that hook is skipped on some renders, which breaks the order. Call all your hooks first, then decide what to return.',
    rehearse: [
      {
        prompt: 'Why can hooks not be called conditionally?',
        answer: 'React matches hooks to their state by call order on every render. A hook inside a condition shifts the whole list, so state lands on the wrong hook, and React throws when the number of hooks changes.',
      },
      {
        prompt: 'What changed in React 19 that you actually use?',
        answer: 'ref is a normal prop, so new components do not need forwardRef. A context renders directly as its own provider. use() reads a promise or context during render. And the Action hooks cover pending, error and optimistic states.',
      },
      {
        prompt: 'When would you write a custom hook?',
        answer: 'When two components need the same stateful logic, like tracking the window width or debouncing a value. I move those hook calls into a function named useSomething and call it from both. Each component still gets its own state, because a custom hook shares the logic, not the data. If they need the same data, that is lifting state up, context, or a store.',
      },
    ],
  },
};
