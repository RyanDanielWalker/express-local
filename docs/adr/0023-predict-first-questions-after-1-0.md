# 0023. After 1.0, predict-first questions come first

Status: Accepted (2026-11-03).

## Context

1.0 is done and tagged `v1.0`. Until the tag, the freeze from [ADR 0010](0010-a-portfolio-piece-with-a-1-0.md) sent new ideas to Parked. So Parked is now the list to pick from.

One parked idea came from a tutoring session outside the app. On 2026-11-02 Ryan worked through generics with Claude. Claude gave him code with blanks to fill in, and he guessed. Then Claude said what was right and what was off. That taught him more than reading questions did.

Every question in the app shows its three options first. A player can spot the right answer without being able to come up with it. In an interview, nobody shows you the options.

## Options

1. **Predict-first questions.** Show a snippet and ask what it gives you: the type of `x`, what the button shows, what the request returns. The player guesses before seeing any options. Then the answer and the explanation appear. Every answer is proven in `probes/` like any other claim. This is engine work, a new screen and new content.
2. **Small fixes first.** Fix the two TypeScript wording nits. Fix the bug where riding a line every day keeps it from coming due. Move focus to the new content when a screen changes. Each is small, but none of them changes what the app teaches.
3. **Code health first.** Split `App.tsx` into `useRun` and `useDrills` so its wiring can be tested, and build with TypeScript 6. That makes later features safer, but a player would not notice it.

## Decision

Option 1. Ryan's call.

- It becomes the top block of **Next, in order** on the roadmap. It starts with TypeScript, on Generic Line, and ends with an inventory stop. React and NestJS follow in a block of their own.
- How a guess is checked is not decided here. There are three ways: show options after the guess, compare a typed answer to the proven one, or let the player mark their own guess. That call is the first item in the block, and it gets its own ADR.
- The rest of Parked stays parked. The next pick from it comes after this block's inventory stop, the same way this one was made.

## Consequences

- The content rules apply as written. Every snippet's answer is proven under TypeScript 5.9, 6.0 and 7.0, or in React 19.3 or NestJS 12.1.3. Each probe includes one check that should fail.
- A new kind of question touches the content types, the engine, the saves and the bar. The design item has to say whether predict-first questions count toward the bar, and which tiers show them.
- The small fixes wait. One of them is the early-ride bug, which affects Ryan's own reviews, so it is the likeliest next pick.
- The backend is still 2.0, and tutor mode still waits for it.
