## ADDED Requirements

### Requirement: Exchange queue and tagged container shapes
Reusable exchange, queue and tagged-container shapes SHALL use generated tokens for colours, type, outlines, hard shadows, radii and motion. The exchange SHALL be a white elongated hexagon; the queue a white rounded rectangle with two inset end rails; the container white with a yellow pill tab. Contents and placement SHALL be supplied by the scene, not hard-coded broker names or topology.

#### Scenario: Generic shapes match the diagram language
- **GIVEN** shapes with scene-supplied text and bounds
- **WHEN** their settled appearance is inspected
- **THEN** they have ink outlines and hard offset shadows, the exchange's six vertices, queue's two end rails and container's tab; they contain no hard-coded Anypoint or order labels and use existing token values only

#### Scenario: Shapes before appearance
- **GIVEN** each shape's pop-in frame
- **WHEN** the preceding frame and the pop-in frame are evaluated
- **THEN** it is invisible before appearance and uses the existing token-driven pop spring on appearance, without replacing its opacity with scene focus

### Requirement: Persistent and routed tokens
A reusable token SHALL support scene-supplied stationary points and path travel over `motion.travel` frames, with the existing token's appearance. Travel SHALL be by path length, with no token drawn before departure or after handoff to its destination. Multiple copies and return paths SHALL use the same primitive; the scene SHALL own their identities, counts, split, ACK and NACK rules.

#### Scenario: Stationary path and return placement
- **GIVEN** a stationary token and a routed token departing at F along either a forward or return path
- **WHEN** F−1, F, F+11 and F+22 are evaluated with current `motion.travel` 22
- **THEN** the stationary token stays at its supplied point, the routed one is absent before F, at the path start at F, halfway by length at F+11, and absent at F+22 for an atomic scene-owned destination handoff

#### Scenario: Token path cannot yield a point
- **GIVEN** path evaluation returns no point
- **WHEN** a routed token is placed
- **THEN** no token is drawn and the renderer does not dereference a null point; missing scene routes are separately rejected by flow validation

### Requirement: Failure and confirmation contrast
The pub-sub scene SHALL reuse white squares with ink checks for Publish acceptance and successful consumer ACKs, and failure-colour squares with white crosses for the invoice error. The return path and returned token's outline SHALL use `color.failure`. All other token outlines SHALL use ink. Coloured application blocks SHALL retain healthy fill; small marks SHALL NOT use that fill as their own foreground.

#### Scenario: Failure stays local and marks remain visible
- **GIVEN** the invoice failure and NACK frames
- **WHEN** scene appearance data and review stills are inspected
- **THEN** only invoice has the failure mark and red return path/token outline; payment, inventory and API checks remain white/ink against green application blocks; there is no orange blocked path or red publisher
