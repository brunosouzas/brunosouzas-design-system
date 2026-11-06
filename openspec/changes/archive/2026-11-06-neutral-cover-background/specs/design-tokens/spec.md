## MODIFIED Requirements

### Requirement: Measured cover backgrounds
The repository's source SHALL hold the 21 pairs measured from the covers published before 0.6.0, with the names and values of `design.md` §2, the three track pairs of ADR 0006 (`trackIntegration`, `trackDelivery`, `trackAi`) and `neutral`, all pinned in `test/fixtures/cover-backgrounds.json`.

#### Scenario: Source matches the measured table
- **WHEN** the token test reads `tokens/source.json` and the fixture
- **THEN** both list the same 25 names with the same `fill` and `ring` values, for example `blush` `#F6CFE0` and `#ECBAD0`, and `neutral` `#F6F3EC` and `#D8D6D0`

#### Scenario: A pair drifts
- **WHEN** a test copy of the source changes `coverBackground.blush.ring` to `#ECBAD1`
- **THEN** the comparison fails naming `blush`
