## MODIFIED Requirements

### Requirement: Site palette tokens
The source SHALL define `site.light` and `site.dark`, each with exactly primary, body, border, light, dark, text, textDark, textLight and link (`color`); `site.font` primary, secondary and mono (`fontFamily`); `site.fontSize` base and baseSmall (`dimension`); and `site.heading` h1 to h6 and h1Small to h6Small (`number`, rem). A missing or extra one, or another type, is an error.

#### Scenario: Site palette entry missing
- **WHEN** the source has `site.dark` without `textLight`, and then `site.light` without `link`
- **THEN** each build fails, naming `site.dark.textLight`, then `site.light.link`, as missing (type color), and writes no file

#### Scenario: Measured site palette
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` holds `site.light` `{ primary: #121212, body: #F6F3EC, border: #D7D1C5, light: #FFFFFF, dark: #121212, text: #121212, textDark: #121212, textLight: #5C5852, link: #B83A0C }`, `site.dark` `{ primary: #F1EEE8, body: #121110, border: #3B3834, light: #1D1C1A, dark: #F1EEE8, text: #F1EEE8, textDark: #F1EEE8, textLight: #ADA79D, link: #FF7A45 }`, `site.font.mono` `'Source Code Pro', monospace`, and `tokens.css` holds `--ds-site-light-link` and `--ds-site-font-mono`

## ADDED Requirements

### Requirement: Site colours are brand roles
Each `site.<theme>` colour SHALL equal the `brand.<theme>` role it stands for: primary, dark, text and textDark equal `text`; body equals `bg`; light equals `cardBg`; border equals `border`; textLight equals `textMuted`; link equals `accentText`.

#### Scenario: Every site colour matches its role
- **WHEN** the token test compares `site.light` and `site.dark` with `brand.light` and `brand.dark` through that mapping
- **THEN** all eighteen pairs are equal

#### Scenario: A site colour that drifts from its role
- **WHEN** the test runs on a source whose `site.dark.textLight` is `#B4AFB6` (its 0.7.0 value)
- **THEN** it fails, naming `site.dark.textLight` and `brand.dark.textMuted`
