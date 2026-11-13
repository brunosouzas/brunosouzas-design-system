# Spec delta: motion-components (sdd-scene-1-relay)

## ADDED Requirements

### Requirement: Sans family for SVG words in a frame
`src/brand/` SHALL export `withSansFamily(node, family)`, a pure function returning a copy of a piece tree in which every `font-family` equal to the `font.sans` token stack becomes `family`, leaving every other attribute, node and family unchanged, so SVG words draw in the face Remotion loads. Scenes that draw piece trees in a frame SHALL pass their words through it.

#### Scenario: Sans mapped, mono kept
- **GIVEN** a tree holding a `diagramBox` word in the sans stack and an `edgeLabel` code span in the mono stack
- **WHEN** `withSansFamily(tree, "Loaded Sans, sans-serif")` runs
- **THEN** no `font-family` equals `font.sans`, the sans nodes read the loaded family, the mono nodes keep `font.mono`, the number of `font-family` attributes is unchanged, and the input tree is not modified

#### Scenario: Tree without words
- **GIVEN** a tree with no `font-family` attribute
- **WHEN** `withSansFamily` runs
- **THEN** it returns a tree deep-equal to the input

#### Scenario: Every scene word mapped
- **GIVEN** the stage layers of the relay scene at frames 129, 849 and 1079 and of the topology scene at 389, 949 and 1919
- **WHEN** each passes through `withSansFamily`
- **THEN** each layer held the sans stack before and holds none after
