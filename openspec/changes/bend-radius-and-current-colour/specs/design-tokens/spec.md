## MODIFIED Requirements

### Requirement: Map tokens
The source SHALL define the `map` tokens outline, shadow, lineWidth, casing, badgeHeight, badgeTextSize, countHeight, countTextSize, stopRadius, interchangeExtra, nodeHeight, nodeRadius, edgeWidth, labelSize, ringWidth, haloWidth, licenceSize, zonePadding and bendRadius as `dimension`, and zoneTitleTint as `number`. A missing one, or one with another type, is an error. Values: 3, 3.5, 12, 6, 20, 12, 16, 11, 12, 2, 46, 10, 2.5, 13, 3, 1.5, 10, 32, 32 and 0.6. `bendRadius` is the radius of a bundle's centre line at a 45° or 90° bend, in map units.

#### Scenario: Map token with the wrong type
- **WHEN** `map.lineWidth` is declared `number`, `map.bendRadius` is declared `number`, or `map.zoneTitleTint` is declared `dimension`
- **THEN** the build fails, naming `map.lineWidth` or `map.bendRadius` with the expected type `dimension`, or `map.zoneTitleTint` with `number`, and writes no file

#### Scenario: Measured map values
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.ts` exports the twenty `map` values above, `tokens.json` has `map.bendRadius` 32, and `tokens.css` has `--ds-map-line-width: 12px;`, `--ds-map-halo-width: 1.5px;`, `--ds-map-bend-radius: 32px;` and `--ds-map-zone-title-tint: 0.6;`

#### Scenario: Missing bend radius
- **WHEN** `map.bendRadius` is removed from the source
- **THEN** the build fails naming `map.bendRadius` and writes no file
