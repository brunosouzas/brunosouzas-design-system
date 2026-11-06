## MODIFIED Requirements

### Requirement: Icon output
When `format` is `icon`, the spec SHALL hold exactly one piece, an `eipIcon`, `uiIcon`, `linkIcon` or `categoryIcon`, at `x` 0 and `y` 0 (their default in an icon spec). The output is an `svg` the size of the piece (64 × 40 × `scale` for `eipIcon`, 48 × 48 × `scale` for `categoryIcon`, `size` × `size` for the others, defaults 24 and 46) with a `viewBox` from 0 0, the attributes of a cover, `title`, `desc`, then the piece's body, ending in LF.

#### Scenario: EIP icon
- **WHEN** the `eip-splitter` fixture is built
- **THEN** the root has `width="64" height="40" viewBox="0 0 64 40"`, the title is `Splitter`, the description is the icon's own with its CC BY 4.0 credit, and the body is `eipIcon` `splitter` drawn at 0,0

#### Scenario: UI icon box
- **WHEN** an icon spec holds a `uiIcon` `sun` with `size` 48 and `colour` `color.state.blocked`
- **THEN** the root has `width="48" height="48" viewBox="0 0 48 48"`

#### Scenario: Category badge box
- **WHEN** an icon spec holds a `categoryIcon` `integration` with `scale` 3.5, a `title` and a `description`
- **THEN** the root has `width="168" height="168" viewBox="0 0 168 168"`, the body is that badge drawn at 0,0, and the file holds no `<style>`

#### Scenario: Not one icon piece
- **WHEN** an icon spec holds two pieces, or one `pill`
- **THEN** `pieces` is reported as "an icon spec holds exactly one piece: eipIcon, uiIcon, linkIcon or categoryIcon"

#### Scenario: Icon off the origin
- **WHEN** an icon spec's `eipIcon` has `x: 4`
- **THEN** `pieces[0].x` is reported as "an icon is drawn at 0, 0"

### Requirement: Icon keys
An icon spec SHALL refuse `background`, `rings`, `custom`, `customAt`, `height` and `signature`, each with "not used by the icon format". An `eipIcon` spec SHALL refuse `title` and `description` with "comes from the EIP icon, with its CC BY 4.0 credit", because both come from the icon's data; a `uiIcon`, `linkIcon` or `categoryIcon` spec needs both.

#### Scenario: Rings in an icon
- **WHEN** an icon spec has `rings` `cx` 0, `cy` 0
- **THEN** `rings` is reported as "not used by the icon format" and nothing is written

#### Scenario: Signature in an icon
- **WHEN** an icon spec has `signature: true`, and then `signature: false`
- **THEN** each run reports `signature` as "not used by the icon format", exits 1 and writes nothing

#### Scenario: Title on an EIP icon
- **WHEN** an `eipIcon` spec has `title: "Splitter"`
- **THEN** `title` is reported as "comes from the EIP icon, with its CC BY 4.0 credit"

#### Scenario: UI icon without a title
- **WHEN** a `uiIcon` spec has no `title`
- **THEN** `title` is reported as "expected a non-empty string"

#### Scenario: Category badge without a description
- **WHEN** a `categoryIcon` spec has a `title` and no `description`
- **THEN** `description` is reported as "expected a non-empty string" and nothing is written
