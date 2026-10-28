# 0019. A small router of our own, with path URLs

Status: Accepted (2026-10-28).

## Context

The app had no URLs. Every screen lived in `App.tsx` state, so the browser's Back button left the app mid-ride, and a line could not be linked to. The roadmap's 1.0 list asks for a router that makes Back work and gives every line a URL, like `/nest/life`.

The app needs only a handful of URLs: the map, a line, riding it, rehearsing it, and a drill. Its screens are already a small state machine in `App.tsx`.

## Options

1. **Hand-rolled.** Pure functions that turn a path into a route and back (`lib/route.ts`, with tests), plus a hook on the browser's History API (`hooks/useUrl.ts`). No new dependency.
2. **React Router.** The library most interviewers know. It does far more than five URLs need, adds a dependency, and the screen state would have to be reshaped around its routes.

For the URLs themselves: paths (`/nest/life`) or a hash (`/#/nest/life`). A hash works on any static host with no setup. Paths look right, and need the host to serve `index.html` for every path.

## Decision

Option 1, with path URLs. Ryan's call.

The screen state stays the source of truth. `App.tsx` works out the route for what is on screen, and `useUrl()` keeps the address bar on it. Back and Forward call back into `App.tsx`, which shows the line or the map the URL names.

Only which line and which activity go in the URL. A ride's questions and score live in memory, so a ride URL opened fresh shows its line instead. A history entry remembers the page it was opened from, and leaving a page for that one steps back instead of pushing a new entry. That keeps "Back to the map" mid-ride from leaving the ride behind it in history.

## Consequences

- No dependency, and about a hundred lines that can be explained end to end: `pushState`, `replaceState` and the `popstate` event.
- The deploy needs one rewrite rule: every path serves `index.html`. Vite's dev server and preview already do this. The deploy item on the roadmap says so.
- A dead ride in history is stepped over, not kept. Back from the next line skips it, which is the point. Forward cannot get past it either, so a player who goes back two pages past a ride cannot go forward to the page after it. That seemed a fair price for a Back button that never lands on nothing.
- Nested routes, loaders and links with active styles are not here. If the app grows past a few URLs, React Router is the next step, and the pure route functions show what it has to cover.
- The end-to-end test checks the URLs, Back and Forward mid-ride, and opening a line by its URL.
