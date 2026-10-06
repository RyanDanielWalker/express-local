import type { AlgoLineId, Guide } from '../engine/types';

/** Field guide for the algorithms division. */
export const ALGO_GUIDE: Record<AlgoLineId, Guide> = {
  sq: {
    plain: 'A stack and a queue are both just a list with a rule about which end you take from. A stack adds and removes at the same end, so the newest item leaves first. A queue adds at the back and removes from the front, so the oldest item leaves first. That one difference decides how BFS, DFS, undo buttons, and the JavaScript event loop behave.',
    words: [
      ['push', 'Add to the end of an array.'],
      ['pop', 'Remove from the end. Newest out.'],
      ['shift', 'Remove from the front (index 0). Oldest out.'],
      [
        'LIFO / FIFO',
        'Last in, first out (stack). First in, first out (queue).',
      ],
    ],
    code: {
      label: 'an undo button',
      snippet: `const history = [];

function edit(change) {
  history.push(change);   // remember it
  apply(change);
}

function onCmdZ() {
  const last = history.pop();  // newest first
  if (last) revert(last);
}`,
    },
    when: [
      'You need to undo, go back, or unwind things in reverse order (stack)',
      'Things should be handled in the order they showed up (queue)',
      'Matching brackets or HTML tags: push each opener, pop when it closes',
    ],
    famous: [
      'Valid Parentheses (LeetCode 20)',
      'The browser back button is a stack of pages',
      'The JS event loop pulls callbacks off a task queue',
      'Job queues, print queues, rate-limited API requests',
    ],
    lore: "Interview gotcha: shift() on a huge array is slow, because every other item has to slide down one index. Real high-traffic queues use a linked list or keep a moving \"head\" index instead. For everyday code it's fine.",
  },
  bfs: {
    plain: 'Start at one node and visit everything 1 step away, then everything 2 steps away, and so on, like ripples in a pond. The queue keeps it fair: whoever got discovered first gets visited first. Because it spreads out ring by ring, the first time BFS reaches a node is always by the fewest possible steps.',
    words: [
      [
        'graph',
        'Dots (nodes) connected by lines (edges). Here, stations and tracks.',
      ],
      ['neighbor', 'A node one edge away.'],
      [
        'seen',
        'Nodes already added to the queue, so nobody gets added twice.',
      ],
      ['level', 'How many steps a node is from the start.'],
    ],
    code: {
      label: '"people you may know" (friends of friends)',
      snippet: `const seen = new Set([me]);
const queue = [me];

while (queue.length) {
  const person = queue.shift();
  for (const friend of friends[person]) {
    if (!seen.has(friend)) {
      seen.add(friend);
      queue.push(friend);
    }
  }
}`,
    },
    when: [
      'You want the fewest steps, clicks, or moves between two things',
      'You need to go level by level: an org chart, nested menus, a tree row by row',
      'Something spreads outward from a starting point, like flood fill in a paint app',
    ],
    famous: [
      'Number of Islands (LeetCode 200)',
      'Rotting Oranges (LeetCode 994)',
      'Word Ladder (LeetCode 127)',
      "LinkedIn's \"2nd-degree connection\"",
      'Web crawlers following links outward from a homepage',
    ],
    lore: 'Edward F. Moore published BFS in 1959 as a way to find the shortest path out of a maze. Mazes are just graphs wearing a costume.',
  },
  dfs: {
    plain: "Pick one path and follow it until you hit a dead end, then back up to the most recent fork and try the next branch. The stack remembers the forks: newest on top, so you always back up to the closest one. DFS doesn't find shortest paths, but it's great for exploring everything, spotting loops, and trying every possibility.",
    words: [
      [
        'backtracking',
        'Backing up to your last choice when a path dead-ends.',
      ],
      ['branch', 'One path leading off a node.'],
      ['cycle', 'A loop: a path that comes back to where it started.'],
      [
        'stale entry',
        'A node still sitting on the stack that already got visited another way. You skip it.',
      ],
    ],
    code: {
      label: 'walking a nested folder (or JSON) tree',
      snippet: `function listFiles(folder, out = []) {
  for (const item of folder.children) {
    if (item.type === 'file') out.push(item.name);
    else listFiles(item, out);   // dive in first
  }
  return out;
}`,
      note: "That's DFS written with recursion. The call stack is doing the push and pop for you.",
    },
    when: [
      "You need to visit every node and the order doesn't matter much",
      "You're checking for cycles, like circular imports",
      "You're solving a puzzle by trying options and backing out: mazes, sudoku",
      'You need a build or install order from dependencies (topological sort)',
    ],
    famous: [
      'Course Schedule (LeetCode 207): can you finish without a circular prerequisite?',
      'Number of Islands (LeetCode 200) works with DFS too',
      'Generating every permutation of a list',
      'Bundlers like webpack walk your import graph',
    ],
    lore: "In the 1800s, Charles Pierre Trémaux described a way to solve any maze: chalk each passage as you walk it, and never take a doubly marked one. That's DFS with a visited set made of chalk.",
  },
  bin: {
    plain: "If a list is sorted, you don't need to check every item. Look at the middle one. If it's smaller than what you want, the answer can only be to its right, so you throw out the whole left half without looking. Repeat. Each check cuts what's left in half, so even a billion items takes about 30 checks.",
    words: [
      [
        'lo / hi',
        'The first and last index that could still hold the answer.',
      ],
      ['mid', 'The middle of lo and hi, rounded down.'],
      [
        'search space',
        'Everything between lo and hi. It halves every step.',
      ],
      [
        'log n',
        "How many times you can halve n before reaching 1. For 1,000,000 that's about 20.",
      ],
    ],
    code: {
      label: 'finding where a new item goes in a sorted feed',
      snippet: `function insertIndex(times, t) {
  let lo = 0, hi = times.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (times[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;  // splice t in here
}`,
    },
    when: [
      'The data is sorted and you need to find something in it',
      "You're looking for \"the first one that passes a test\" and the answers flip from no to yes exactly once",
      "You're guessing a number in a range: a time, a price, a capacity",
    ],
    famous: [
      'git bisect: binary search through your commits to find the one that broke the build',
      'Search Insert Position (LeetCode 35)',
      'Koko Eating Bananas (LeetCode 875)',
      "Database indexes (B-trees are binary search's bigger cousin)",
    ],
    lore: "Binary search looks easy and isn't. In 2006, Joshua Bloch revealed that the binary search in Java's own library had a bug for about nine years: on huge arrays, lo + hi overflowed. Off-by-one and overflow are the classic traps.",
  },
  bub: {
    plain: "Walk through the list comparing each pair of neighbors, and swap them if they're in the wrong order. The biggest value gets dragged to the end on the first pass, the next biggest on the second pass, and so on. Very easy to understand, very slow on big lists.",
    words: [
      ['pass', "One walk through the part that isn't sorted yet."],
      ['swap', 'Two values trade places.'],
      ['in place', 'Sorts inside the same array without making a copy.'],
      ['n²', 'Double the list and the work roughly quadruples.'],
    ],
    code: {
      label: "honestly, nowhere. Here's what you write instead",
      snippet: `// numbers: always pass a compare function
scores.sort((a, b) => a - b);

// forget it and JS sorts them as strings:
[10, 9, 1].sort();   // [1, 10, 9]  lol`,
    },
    when: [
      'Learning how sorting works under the hood',
      'Tiny lists that are already almost sorted (the early exit makes it quick there)',
      'Never in production. The built-in sort is far faster.',
    ],
    famous: [
      'Sort Colors (LeetCode 75) is a classic warmup for in-place sorting',
      "Insertion sort, bubble sort's smarter sibling, gets used inside real sorts for tiny chunks",
      'The "stop when a pass makes no swaps" trick shows up all over the place',
    ],
    lore: "In 2007, Google's CEO asked Barack Obama the most efficient way to sort a million 32-bit integers. Obama said, \"I think the bubble sort would be the wrong way to go.\" He was right.",
  },
  rec: {
    plain: 'A recursive function solves a problem by calling itself on a smaller piece of the same problem, until the piece is so small the answer is obvious. That smallest case is called the base case. Each call gets its own frame on the call stack and pauses while it waits for the call it made. Then the answers pass back down the stack, one pop at a time.',
    words: [
      [
        'base case',
        'The smallest input, answered directly without another call. Your off switch.',
      ],
      [
        'frame',
        'One running call: its arguments, its local variables, and where it left off.',
      ],
      [
        'call stack',
        'The stack of frames. Newest on top, and only the top one is running.',
      ],
      [
        'stack overflow',
        'Too many frames. Usually a missing or unreachable base case.',
      ],
    ],
    code: {
      label: 'rendering nested comments in React',
      snippet: `function Comment({ comment }) {
  return (
    <div className="comment">
      <p>{comment.text}</p>
      {comment.replies.map(reply => (
        <Comment key={reply.id} comment={reply} />
      ))}
    </div>
  );
}`,
      note: 'No replies is the base case: map over an empty array and the recursion stops on its own.',
    },
    when: [
      'The data is nested: trees, folders, comment threads, JSON, the DOM',
      'A problem breaks into smaller copies of itself',
      "You're exploring choices: every combination, every path",
    ],
    famous: [
      'Tower of Hanoi',
      'Flatten a nested array',
      'Merge sort and quicksort are both recursive',
      'Fibonacci, and why plain recursion is slow for it',
    ],
    lore: 'A plain recursive fib(40) makes over 300 million calls, because it keeps recomputing the same answers. Cache each answer the first time (called memoization) and it drops to 41. That trick is the doorway to dynamic programming.',
  },
  hash: {
    plain: 'A hash function turns a key into an array index. To store something, hash its key and drop it in that bucket. To find it later, hash the same key and go straight back to the same bucket. No searching through everything. When two keys land in the same bucket (a collision), that bucket just holds a short list.',
    words: [
      [
        'hash function',
        'Turns a key into a number. Same key in, same number out, every time.',
      ],
      ['bucket', 'One slot in the table.'],
      ['collision', 'Two keys land in the same bucket. Normal, not a bug.'],
      [
        'load factor',
        'Items divided by buckets. When it gets too high, real tables grow and re-hash everything.',
      ],
    ],
    code: {
      label: 'replacing a slow .find() inside a loop',
      snippet: `// slow: scans every user for every order
orders.map(o => users.find(u => u.id === o.userId));

// fast: build a lookup once, then jump straight there
const byId = new Map(users.map(u => [u.id, u]));
orders.map(o => byId.get(o.userId));`,
    },
    when: [
      '"Have I seen this before?" (deduping, visited sets)',
      'Looking something up by id or name, fast',
      'Counting things: word counts, votes, how often each item appears',
    ],
    famous: [
      'Two Sum (LeetCode 1), probably the most famous interview question there is',
      'Group Anagrams (LeetCode 49)',
      'JS objects, Map, and Set are hash tables under the hood',
      'Caches like Redis and memcached',
    ],
    lore: "Hash tables trade memory for speed, and they have a worst case: if every key lands in one bucket, you're back to scanning a long list. Good hash functions spread keys out so that almost never happens.",
  },
  merge: {
    plain: "Split the list in half, then split those halves, until every piece is a single item. A single item is already sorted. Then merge the pieces back together in pairs. Merging two sorted lists is easy: compare the two fronts, take the smaller, repeat. It's n log n every single time, with no unlucky worst case.",
    words: [
      [
        'divide and conquer',
        'Split a problem into smaller ones, solve those, combine the answers.',
      ],
      ['run', "A chunk that's already sorted."],
      ['merge', 'Zip two sorted runs into one sorted run.'],
      [
        'stable',
        'Equal items keep their original order. Merge sort is stable.',
      ],
    ],
    code: {
      label: 'combining two sorted API results',
      snippet: `function mergeByDate(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    out.push(a[i].date <= b[j].date ? a[i++] : b[j++]);
  }
  return out.concat(a.slice(i), b.slice(j));
}`,
    },
    when: [
      'You need a guaranteed n log n with no bad worst case',
      'Stability matters (sort by date, then by name, without scrambling the dates)',
      'The data is too big for memory: sort chunks, then merge them (external sort)',
      "You're combining lists that are already sorted",
    ],
    famous: [
      'Merge Two Sorted Lists (LeetCode 21)',
      'Sort List (LeetCode 148)',
      'Counting inversions: how "unsorted" is this list?',
      "V8's Array.prototype.sort (Chrome, Node) uses TimSort, a merge sort hybrid",
    ],
    lore: 'John von Neumann came up with merge sort in 1945, for one of the very first stored-program computers. Your .sort() call is still running a descendant of it.',
  },
  quick: {
    plain: "Pick one value to be the pivot. Walk through the range and move every value smaller than the pivot to the left side. That step is called partitioning. Then drop the pivot right after the small values. Now it's in exactly the spot it'll have in the final sorted list. Do the same thing to the left side and the right side, and keep going until every piece is one item.",
    words: [
      [
        'pivot',
        'The value everything gets compared against. Here, the last value in the range.',
      ],
      [
        'partition',
        'Rearranging a range so smaller values are left of the pivot and bigger ones are right.',
      ],
      [
        'range (positions lo to hi)',
        'The slice of the array being partitioned right now. Faded bars are outside it, waiting their turn.',
      ],
      [
        'i and j',
        'j scans each value in turn. i marks where the "small" zone ends.',
      ],
    ],
    code: {
      label: 'top-k without sorting everything (quickselect)',
      snippet: `// Partition once, then only chase the side
// that holds position k. Average O(n).
function quickselect(a, k, lo = 0, hi = a.length - 1) {
  const p = partition(a, lo, hi);
  if (p === k) return a[p];
  return p < k
    ? quickselect(a, k, p + 1, hi)
    : quickselect(a, k, lo, p - 1);
}`,
    },
    when: [
      'Fast in-place sorting when memory is tight',
      'Finding the kth biggest or smallest, or a median (quickselect)',
      '"Split this into two groups by a rule" problems use the same partition move',
    ],
    famous: [
      'Kth Largest Element in an Array (LeetCode 215)',
      'Sort Colors (LeetCode 75), the Dutch national flag problem',
      "Java's Arrays.sort for numbers uses a dual-pivot quicksort",
      "C's standard library sort is named qsort",
    ],
    lore: 'Tony Hoare invented quicksort in 1959 while studying in Moscow, working on a program to translate Russian. He needed to sort the words in a sentence before looking them up in a dictionary stored on magnetic tape.',
  },
  two: {
    plain: "Instead of checking every possible pair, put one pointer at each end of a sorted list and look at the two values. Sum too small? The left value can't be in any answer, since even the biggest partner wasn't enough, so move it right. Too big? The right value is out, so move it left. Every step rules out one value for good, so a single pass is enough.",
    words: [
      [
        'pointer',
        'Here, just an index variable pointing at one spot in the array.',
      ],
      ['lo / hi', 'The left pointer and the right pointer.'],
      ['converge', 'Both pointers walk toward each other until they meet.'],
      [
        'sliding window',
        'A cousin pattern: both pointers move the same direction, framing a chunk.',
      ],
    ],
    code: {
      label: 'checking for a palindrome',
      snippet: `function isPalindrome(s) {
  let lo = 0, hi = s.length - 1;
  while (lo < hi) {
    if (s[lo] !== s[hi]) return false;
    lo++;
    hi--;
  }
  return true;
}`,
    },
    when: [
      "The data is sorted and you're hunting for a pair (or triple) that hits a target",
      "You're comparing from both ends: palindromes, reversing in place",
      "You're removing duplicates from a sorted array without extra memory",
    ],
    famous: [
      'Two Sum II (LeetCode 167)',
      '3Sum (LeetCode 15)',
      'Container With Most Water (LeetCode 11)',
      'Valid Palindrome (LeetCode 125)',
    ],
    lore: "Two pointers doesn't have a famous inventor. It's a pattern. Interviewers love it because one clever observation turns the obvious n² answer into an n answer.",
  },
  dij: {
    plain: "Every track has a cost: time, distance, money. You want the cheapest route from the start to every station. Give every station a best-known cost, starting at ∞. Over and over, lock in the cheapest station that isn't settled yet, since nothing can ever beat it. Then check its neighbors: if going through it is cheaper than what they had, update them. That check is called relaxing an edge.",
    words: [
      ['weight', 'The cost of one track (edge).'],
      [
        'tentative distance',
        'The best cost found so far. It can still drop until the station is settled.',
      ],
      ['settled', 'Locked in. This is the true cheapest cost.'],
      [
        'relax',
        "Check whether going through u beats v's current cost, and update it if so.",
      ],
      [
        'priority queue',
        'A structure that always hands you the smallest item. Real Dijkstra uses one instead of scanning.',
      ],
    ],
    code: {
      label: 'cheapest route over a graph object',
      snippet: `const dist = { A: 0 };  // anything missing = Infinity
const prev = {};

// repeat until everything is settled:
const u = cheapestUnsettled(dist, settled);
settled.add(u);
for (const [v, w] of Object.entries(graph[u])) {
  if (dist[u] + w < (dist[v] ?? Infinity)) {
    dist[v] = dist[u] + w;
    prev[v] = u;   // follow prev back to rebuild the route
  }
}`,
    },
    when: [
      'You need the shortest or cheapest path and edges cost different amounts',
      'Routing anything: roads, networks, flights',
      'Any "minimum total cost" problem you can draw as a graph, as long as no cost is negative',
    ],
    famous: [
      'Network Delay Time (LeetCode 743)',
      'Path With Minimum Effort (LeetCode 1631)',
      'Internet routing: OSPF runs Dijkstra on each router',
      'Map apps and game pathfinding (A* is Dijkstra plus a hint about which direction to head)',
    ],
    lore: 'Edsger Dijkstra worked it out in 1956 in about twenty minutes, sitting at a café in Amsterdam, without pencil and paper. He said skipping the pencil forced him to keep it simple.',
  },
};
