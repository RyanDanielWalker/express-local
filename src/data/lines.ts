import type { Line } from "../engine/types";

/**
 * The algorithms division, in unlock order.
 * Copy supports `inline code` and **bold** (rendered by <Rich />).
 * `par` is the Rush Hour par time in seconds.
 */
export const ALGO_LINES: Line[] = [
  {
    id: "sq",
    division: "algos",
    kind: "game",
    bullet: "Q",
    color: "--orange",
    short: "Stack/Queue",
    name: "Push & Pop Shuttle",
    topic: "Stacks and queues",
    pitch:
      "Everything else on this map runs on these two. Same array, same `push`. The only question is which end you take from.",
    rules: [
      "Read the log of what went in.",
      "When a remove happens, click the value that comes out.",
      "The tiles are shuffled on purpose. Trust the log, not the layout.",
    ],
    hook: "Stack = a pile of plates: last in, first out, `pop()`. Queue = the line at the deli: first in, first out, `shift()`.",
    bigO: "push / pop: O(1)",
    par: 70,
    quiz: [
      {
        code: `const stack = [];
stack.push("a");
stack.push("b");
const next = stack.___();  // "b"`,
        opts: ["pop", "shift", "unshift"],
        a: "pop",
        why: "Stacks take from the same end they add to: the end of the array.",
      },
      {
        code: `const queue = [];
queue.push("a");
queue.push("b");
const next = queue.___();  // "a"`,
        opts: ["shift", "pop", "splice"],
        a: "shift",
        why: "Queues add to the back and take from the front. shift() removes index 0.",
      },
      {
        code: `const q = [1, 2, 3];
q.push(4);
q.shift();
q.shift();
// q is now ___`,
        opts: ["[3, 4]", "[1, 2]", "[2, 3, 4]"],
        a: "[3, 4]",
        why: "push adds 4 to the back, then two shifts take 1 and 2 off the front.",
      },
    ],
  },
  {
    id: "bfs",
    division: "algos",
    kind: "game",
    bullet: "B",
    color: "--red",
    short: "BFS",
    name: "The Local",
    topic: "Breadth-first search",
    pitch:
      "The Local stops at every station on this level before going one level deeper. It explores in rings, which is why BFS finds the shortest path in stops.",
    rules: [
      "Start at A. Click stations in the exact order BFS visits them.",
      "Neighbors are checked in alphabetical order.",
      "New stations go to the back of the queue. You always ride to the front one next.",
    ],
    hook: "BFS = queue. Take from the front with `shift()`, add neighbors to the back with `push()`.",
    bigO: "O(V + E)",
    par: 75,
    quiz: [
      {
        code: `while (queue.length) {
  const node = queue.___();
  visit(node);
  for (const nb of graph[node]) {
    if (!seen.has(nb)) { seen.add(nb); queue.push(nb); }
  }
}`,
        opts: ["shift", "pop", "peek"],
        a: "shift",
        why: "Front of the line. That one word is what makes it breadth-first.",
      },
      {
        code: `for (const nb of graph[node]) {
  if (!seen.___(nb)) {
    seen.add(nb);
    queue.push(nb);
  }
}`,
        opts: ["has", "add", "get"],
        a: "has",
        why: "Without the seen check, a graph with a loop would ride in circles forever.",
      },
      {
        code: "// BFS always finds the path with the fewest ___",
        opts: ["steps", "total cost", "branches"],
        a: "steps",
        why: "It counts edges, not weights. When tracks cost different amounts, you need Dijkstra.",
      },
    ],
  },
  {
    id: "dfs",
    division: "algos",
    kind: "game",
    bullet: "D",
    color: "--blue",
    short: "DFS",
    name: "The Express",
    topic: "Depth-first search",
    pitch:
      "The Express picks a branch and rides it to the end of the line, then backs up to the last junction. Same code as BFS with one word changed.",
    rules: [
      "Start at A. Click stations in the order DFS visits them.",
      "Neighbors are pushed so the alphabetically first one is on top.",
      "Crossed-out entries on the stack were already visited and get skipped.",
    ],
    hook: "DFS = stack. Change `shift()` to `pop()` and the Local becomes the Express.",
    bigO: "O(V + E)",
    par: 75,
    quiz: [
      {
        code: `while (stack.length) {
  const node = stack.___();
  if (seen.has(node)) continue;
  seen.add(node);
  visit(node);
  for (const nb of graph[node]) stack.push(nb);
}`,
        opts: ["pop", "shift", "push"],
        a: "pop",
        why: "Take the newest thing on the pile, so you keep going deeper.",
      },
      {
        code: `// BFS and DFS differ by exactly:
// ___`,
        opts: [
          "which end you take from",
          "how you mark seen",
          "the graph format",
        ],
        a: "which end you take from",
        why: "Queue (front) vs stack (top). Everything else is identical.",
      },
      {
        code: `function dfs(node, seen = new Set()) {
  if (seen.has(node)) return;
  seen.add(node);
  for (const nb of graph[node]) ___(nb, seen);
}`,
        opts: ["dfs", "bfs", "return"],
        a: "dfs",
        why: "Recursive DFS. The call stack is the stack, so you never write push or pop.",
      },
    ],
  },
  {
    id: "bin",
    division: "algos",
    kind: "game",
    bullet: "S",
    color: "--yellow",
    darkText: true,
    short: "Binary search",
    name: "Split Line",
    topic: "Binary search",
    pitch:
      "On a sorted list, check the middle. Too small? Throw out the whole left half. Each check cuts the ride in half, so 1,000,000 items takes about 20 checks.",
    rules: [
      "Click the index binary search checks next.",
      "mid = floor((lo + hi) / 2).",
      "If the value is too small, lo = mid + 1. Too big, hi = mid - 1.",
    ],
    hook: "Halve it until it's found or lo passes hi. Sorted input only.",
    bigO: "O(log n)",
    par: 60,
    quiz: [
      {
        code: `let lo = 0, hi = arr.length - 1;
while (lo <= hi) {
  const mid = Math.floor((lo + ___) / 2);
  ...
}`,
        opts: ["hi", "arr.length", "mid"],
        a: "hi",
        why: "The middle of the range that's still alive, not the whole array.",
      },
      {
        code: `if (arr[mid] === target) return mid;
if (arr[mid] < target) lo = ___;
else hi = mid - 1;`,
        opts: ["mid + 1", "mid", "mid - 1"],
        a: "mid + 1",
        why: "mid was already checked, so skip past it. Using mid can loop forever.",
      },
      {
        code: "// Binary search only works if the array is ___",
        opts: ["sorted", "short", "unique"],
        a: "sorted",
        why: "Throwing out half only makes sense if everything on that side is guaranteed too small (or too big).",
      },
    ],
  },
  {
    id: "bub",
    division: "algos",
    kind: "game",
    bullet: "W",
    color: "--green",
    short: "Bubble sort",
    name: "Swap Yard",
    topic: "Bubble sort",
    pitch:
      "Walk the array comparing neighbors. If the left one is bigger, swap. Each pass drags the biggest unsorted value to the end, like a bubble rising.",
    rules: [
      "The highlighted pair is being compared.",
      "Swap if the left is bigger, keep if not.",
      "A full pass with zero swaps means it's sorted. Early exit.",
    ],
    hook: "Compare neighbors, swap if out of order, repeat. Slow (n²) but the ancestor of every sort you'll learn next.",
    bigO: "O(n²)",
    par: 100,
    quiz: [
      {
        code: `for (let j = 0; j < n - 1 - i; j++) {
  if (a[j] ___ a[j + 1]) swap(a, j, j + 1);
}`,
        opts: [">", "<", "==="],
        a: ">",
        why: "Swap when the left one is bigger. That pushes big values rightward.",
      },
      {
        code: `for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - 1 - ___; j++) {
    ...
  }
}`,
        opts: ["i", "j", "n"],
        a: "i",
        why: "After pass i, the last i values are locked in place. No need to recheck them.",
      },
      {
        code: "// A full pass with zero swaps means ___",
        opts: ["it's sorted, stop", "swap the ends", "start another pass"],
        a: "it's sorted, stop",
        why: "Nothing was out of order, so nothing ever will be. That early exit is the one clever bit of bubble sort.",
      },
    ],
  },
  {
    id: "rec",
    division: "algos",
    kind: "game",
    bullet: "R",
    color: "--purple",
    short: "Recursion",
    name: "Call Stack Line",
    topic: "Recursion",
    pitch:
      "A function that calls itself. Each call waits on the call stack until the call above it answers. You already know this structure: it's a stack, and JavaScript does the push and pop for you.",
    rules: [
      "Pick what the computer does next: make a call, or return a value.",
      "Only the top frame is running. Everything below it is paused, waiting.",
      "A frame can only return once it has every answer it asked for.",
    ],
    hook: "Recursion = a base case + a smaller call. Every call pushes a frame, every return pops one. DFS is recursion in disguise.",
    bigO: "stack depth: O(n)",
    par: 90,
    quiz: [
      {
        code: `function fact(n) {
  if (n <= 1) return ___;   // base case
  return n * fact(n - 1);
}`,
        opts: ["1", "0", "n"],
        a: "1",
        why: "fact(1) is 1. The base case is what stops the calls. Without one you get a stack overflow.",
      },
      {
        code: `function fact(n) {
  if (n <= 1) return 1;
  return n * fact(___);
}`,
        opts: ["n - 1", "n", "n + 1"],
        a: "n - 1",
        why: "Every call has to move toward the base case. fact(n) calling fact(n) never ends.",
      },
      {
        code: `// Plain recursive fib(n) recomputes the same calls over and over.
// Caching each answer the first time is called ___`,
        opts: ["memoization", "hashing", "backtracking"],
        a: "memoization",
        why: "Store fib(k) the first time, look it up after. It turns an exponential mess into a straight line.",
      },
    ],
  },
  {
    id: "hash",
    division: "algos",
    kind: "game",
    bullet: "H",
    color: "--brown",
    short: "Hash tables",
    name: "Coat Check",
    topic: "Hash tables",
    pitch:
      "Nobody searches every hook at a coat check. The ticket number tells you exactly which rack to walk to. Hashing turns a key into an index, so a lookup skips the search.",
    rules: [
      "Click the bucket each key hashes to.",
      "The hash here is the remainder: key % size.",
      "Two keys in one bucket is a collision. They share a list, called chaining.",
    ],
    hook: "hash(key) → bucket index. Jump straight there and only scan what's inside. O(1) on average. It's how JS objects and Map work.",
    bigO: "O(1) average",
    par: 80,
    quiz: [
      {
        code: `const bucket = key ___ table.length;
table[bucket].push(key);`,
        opts: ["%", "/", "*"],
        a: "%",
        why: "The remainder is always between 0 and length - 1, which is always a valid index.",
      },
      {
        code: `// 17 % 10 === 7 and 47 % 10 === 7
// Two keys, one bucket. That's a ___.`,
        opts: ["collision", "conflict", "overflow"],
        a: "collision",
        why: "Collisions are normal. Each bucket holds a small list, and you scan just that list.",
      },
      {
        code: `const seen = new ___();
for (const x of nums) {
  if (seen.has(x)) return true;  // duplicate!
  seen.add(x);
}`,
        opts: ["Set", "Array", "Stack"],
        a: "Set",
        why: "A Set is a hash table of keys. has() is O(1), where an array's includes() scans everything.",
      },
    ],
  },
  {
    id: "merge",
    division: "algos",
    kind: "game",
    bullet: "M",
    color: "--lime",
    darkText: true,
    short: "Merge sort",
    name: "Merge Junction",
    topic: "Merge sort",
    pitch:
      "Split the list until every piece is one item, which is already sorted. Then zip pieces back together. Merging two sorted lists is easy: you only ever compare the two front items.",
    rules: [
      "Click the next value to move into the merged output.",
      "It's always the smaller of the two fronts.",
      "When one side runs out, the rest of the other side slides in as-is.",
    ],
    hook: "Split in half, sort each half, merge. Merge = compare the fronts, take the smaller. O(n log n), every time.",
    bigO: "O(n log n)",
    par: 120,
    quiz: [
      {
        code: `while (i < left.length && j < right.length) {
  if (left[i] <= right[j]) out.push(left[___]);
  else out.push(right[j++]);
}`,
        opts: ["i++", "j++", "i"],
        a: "i++",
        why: "Take the front of left, then move left's pointer forward. Forget the ++ and you loop forever.",
      },
      {
        code: `function mergeSort(a) {
  if (a.length <= 1) return a;
  const mid = Math.floor(a.length / 2);
  return merge(mergeSort(a.slice(0, mid)),
               mergeSort(a.slice(___)));
}`,
        opts: ["mid", "mid + 1", "0"],
        a: "mid",
        why: "slice(0, mid) stops before mid, so slice(mid) picks up exactly where it left off. mid + 1 drops a value.",
      },
      {
        code: `// after the while loop, one side still has leftovers
return out.concat(left.slice(___), right.slice(j));`,
        opts: ["i", "0", "j"],
        a: "i",
        why: "Everything in left from i onward hasn't been used yet, and it's already sorted.",
      },
    ],
  },
  {
    id: "quick",
    division: "algos",
    kind: "game",
    bullet: "P",
    color: "--magenta",
    short: "Quicksort",
    name: "Pivot Point",
    topic: "Quicksort",
    pitch:
      "Pick a pivot. Walk the range and send everything smaller to the left. Drop the pivot in right after them and it's in its final spot forever. Then do the same thing to each side.",
    rules: [
      "The pivot is the last value in the range (the colored bar).",
      "For the yellow bar: send it left if it's ≤ the pivot, leave it if it's bigger.",
      'Tinted bars are the "small" zone. Green bars are home for good.',
    ],
    hook: "Pivot, partition, recurse. Smaller goes left, the pivot lands between. Fast on average, O(n²) if the pivots keep landing at the edges.",
    bigO: "O(n log n) avg",
    par: 110,
    quiz: [
      {
        code: `for (let j = lo; j < hi; j++) {
  if (a[j] ___ pivot) {
    i++;
    swap(a, i, j);
  }
}`,
        opts: ["<=", ">", "==="],
        a: "<=",
        why: "Small values get swapped into the left zone. Big ones stay put and end up right of the pivot.",
      },
      {
        code: `const p = partition(a, lo, hi);
quickSort(a, lo, p - 1);
quickSort(a, ___, hi);`,
        opts: ["p + 1", "p", "lo"],
        a: "p + 1",
        why: "The pivot at p is already home. Include it again and you recurse forever.",
      },
      {
        code: `// Quicksort hits its O(n²) worst case when
// the pivot keeps landing ___`,
        opts: ["at the edges", "in the middle", "on a duplicate"],
        a: "at the edges",
        why: "A pivot at the edge splits n items into 0 and n - 1, so you barely make progress. That's why real versions pick pivots randomly or from the middle.",
      },
    ],
  },
  {
    id: "two",
    division: "algos",
    kind: "game",
    bullet: "2",
    color: "--teal",
    short: "Two pointers",
    name: "Both Ends",
    topic: "Two pointers",
    pitch:
      "Find two numbers that add up to a target. Checking every pair is n². On a sorted array, start one pointer at each end and walk them inward. Each step rules out a whole row of pairs.",
    rules: [
      "Add the two pointed-at values in your head.",
      "Too small? Move lo right (bigger values). Too big? Move hi left (smaller values).",
      "Hit the target and call it. If the pointers meet, there's no pair.",
    ],
    hook: "Sorted + one pointer at each end. Too small, lo++. Too big, hi--. O(n) instead of every pair. Shows up in a ton of interview questions.",
    bigO: "O(n)",
    par: 60,
    quiz: [
      {
        code: `const sum = a[lo] + a[hi];
if (sum < target) ___;
else if (sum > target) hi--;
else return [lo, hi];`,
        opts: ["lo++", "hi--", "lo--"],
        a: "lo++",
        why: "The array is sorted, so moving lo right is the only move that makes the sum bigger.",
      },
      {
        code: `let lo = 0, hi = a.length - 1;
while (lo ___ hi) {
  ...
}`,
        opts: ["<", "<=", "!=="],
        a: "<",
        why: "When lo === hi you'd be pairing a value with itself. Stop before that.",
      },
      {
        code: `// Two pointers from both ends only works
// for pair-sum if the array is ___`,
        opts: ["sorted", "even length", "reversed"],
        a: "sorted",
        why: 'Moving lo right has to mean "bigger" and moving hi left has to mean "smaller." Only sorting guarantees that.',
      },
    ],
  },
  {
    id: "dij",
    division: "algos",
    kind: "game",
    bullet: "J",
    color: "--slate",
    short: "Dijkstra",
    name: "Shortest Route",
    topic: "Dijkstra's shortest path",
    pitch:
      "BFS counts stops. Dijkstra counts cost. Every track has a travel time, and you want the cheapest route from A to every station. The trick: always settle the closest unvisited station next.",
    rules: [
      "Click the unvisited station with the smallest distance. That one is settled for good.",
      "Then check each neighbor: is going through here cheaper than what it has now?",
      '∞ means "no route found yet".',
    ],
    hook: "BFS with a price tag. Settle the closest unvisited station, then see if routing through it makes any neighbor cheaper. Works as long as no track has a negative cost.",
    bigO: "O((V + E) log V)",
    par: 120,
    quiz: [
      {
        code: `while (unvisited.size) {
  // pick the unvisited node with the ___ dist
  const u = ...;
  unvisited.delete(u);
  ...
}`,
        opts: ["smallest", "largest", "newest"],
        a: "smallest",
        why: "The closest unsettled node can't get any cheaper, because every other route is already longer.",
      },
      {
        code: `for (const {v, w} of graph[u]) {
  if (dist[u] + w ___ dist[v]) {
    dist[v] = dist[u] + w;
    prev[v] = u;
  }
}`,
        opts: ["<", ">", "==="],
        a: "<",
        why: "Only update if the new route is strictly cheaper. That check is called relaxing an edge.",
      },
      {
        code: "// Dijkstra gives wrong answers if an edge weight is ___",
        opts: ["negative", "zero", "odd"],
        a: "negative",
        why: "Settling assumes nothing can get cheaper later. A negative track breaks that promise. Bellman-Ford handles those.",
      },
    ],
  },
];
