# 0001. The app is a subway system

Status: Accepted. Decided earlier, recorded 2026-10-17.

The original discussion was not written down. The context and options below are reconstructed from the code, the README and the roadmap.

## Context

Interview prep is repetitive by nature: the same topics, drilled until they come out clean. A plain flashcard app makes that feel like homework, and homework gets skipped. The app needed a frame that makes coming back every day feel like a habit rather than a chore, and that gives a lot of small pieces (topics, difficulty levels, reviews) one shared vocabulary.

## Options

1. **Plain study app.** Lists of topics and questions. Clear, but nothing pulls you back.
2. **Generic game frame** (levels, worlds). Familiar, but says nothing about the material.
3. **A New York subway system.** Divisions are subway divisions, topics are lines with bullets, difficulty is Local, Express and Rush Hour, a failed run is a derailment, and the daily pick is the Daily Ride.

## Decision

The subway, New York style. It maps cleanly onto how drilling works: a line is a route you learn stop by stop, Express is the same route faster, and Rush Hour is the same route under pressure.

## Consequences

- The names in the code follow the theme (`Line`, `Division`, tiers named Local, Express and Rush Hour). [ARCHITECTURE.md](../ARCHITECTURE.md) has a glossary so the theme never hides what something is.
- New features should find their place in the metaphor (a Today band, a cram drill) instead of bolting on unrelated game language.
- Theme never beats clarity. A question, explanation or button label says what it means first; the subway flavor goes in names and headings, not in the teaching.
