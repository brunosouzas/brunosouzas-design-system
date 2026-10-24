## ADDED Requirements

### Requirement: Cast timing helpers
`src/brand/cast-motion.ts` SHALL export the pure helpers of design §7: `emotePop` (Remotion `spring` with `cast.emotePop`), `leave`, `blinking`, `breathe`, `squashAfter` and `hop`, with the formulas and defaults given there. The spring's values SHALL come from the tokens, so the no-colour-literal and token rules of the components apply to the file.

#### Scenario: Emote pop
- **WHEN** `emotePop` is read at `at − 1`, `at`, `at + 7` and `at + 30` at 30 fps
- **THEN** it gives 0, 0, 1.2371 (to four decimals, its peak) and a value within 0.001 of 1

#### Scenario: Leave
- **WHEN** `leave(f, 100)` is read at 99, 105, 110 and 200
- **THEN** it gives 1, 0.875, 0 and 0

#### Scenario: Squash after a landing
- **WHEN** `squashAfter(f, 62, 0.1)` is read at 61, 62 and 69
- **THEN** it gives 1, 1.1 and 0.9632 (to four decimals)

#### Scenario: Hop and blink bounds
- **WHEN** `hop(f, 246, 60)` is read at 245, 253 and 261, and `blinking` with starts `[18]` at 17, 18, 21 and 22
- **THEN** the hop gives 0, 60 and 0, and the blink false, true, true and false
