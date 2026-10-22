## ADDED Requirements

### Requirement: Exchange queue and tagged container shapes
Reusable exchange, queue and tagged-container shapes SHALL use generated tokens for colours, type, outlines, hard shadows, radii and motion. The exchange SHALL be a white elongated hexagon; the queue a white rounded rectangle with two inset end rails; the container white with a yellow pill tab. Contents and placement SHALL be supplied by the scene, not hard-coded broker names or topology.

#### Scenario: Generic shapes match the diagram language
- **GIVEN** shapes with scene-supplied text and bounds
- **WHEN** their settled appearance is inspected
- **THEN** they have ink outlines and hard offset shadows, the exchange's six vertices, queue's two end rails and container's tab; they contain no hard-coded Anypoint or order labels and read only existing tokens (no new token)

#### Scenario: Shapes before appearance
- **GIVEN** each shape's pop-in frame
- **WHEN** the preceding frame and the pop-in frame are evaluated
- **THEN** it is invisible before appearance and uses the existing token-driven pop spring on appearance, without replacing its opacity with scene focus

### Requirement: Persistent and routed tokens
A reusable token SHALL support scene-supplied stationary points and path travel over `motion.travel` frames, with the existing token's appearance and an optional scene-supplied fill. Travel SHALL be by path length, with no token drawn before departure or after handoff to its destination. Multiple copies and return paths SHALL use the same primitive; the scene SHALL own their identities, counts, split, ACK and NACK rules.

#### Scenario: Stationary path and return placement
- **GIVEN** a stationary token and a routed token departing at F along either a forward or return path
- **WHEN** F−1, F, F+11 and F+22 are evaluated with current `motion.travel` 22
- **THEN** the stationary token stays at its supplied point, the routed one is absent before F, at the path start at F, halfway by length at F+11, and absent at F+22 for an atomic scene-owned destination handoff

#### Scenario: Token path cannot yield a point
- **GIVEN** path evaluation returns no point
- **WHEN** a routed token is placed
- **THEN** no token is drawn and the renderer does not dereference a null point; missing scene routes are separately rejected by flow validation

### Requirement: Failure and confirmation contrast
Checks SHALL be white squares with ink checks. From the invoice failure on, the Invoice consumer block SHALL be filled with `color.failure` and carry a white square with an ink cross, sized and placed like the ACK checks. The return path and returned token outline SHALL use `color.failure`, other outlines ink; tokens SHALL be filled with `color.caller`. Other blocks SHALL stay healthy; no mark SHALL take its block's hue.

#### Scenario: Failure stays local and marks remain visible
- **GIVEN** the invoice failure and NACK frames
- **WHEN** scene appearance data and review stills are inspected
- **THEN** only the invoice block turns `color.failure`, with a white square and ink cross, and only invoice has the red return path/token outline; payment, inventory and API checks remain white/ink against green application blocks; every token is filled with `color.caller`; there is no orange blocked path or red publisher
