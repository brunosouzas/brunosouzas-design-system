## MODIFIED Requirements

### Requirement: Site palette tokens
The source SHALL define `site.light` and `site.dark`, each with exactly primary, body, border, light, dark, text, textDark, textLight and link (`color`); `site.font` primary, secondary and mono (`fontFamily`); `site.fontSize` base and baseSmall (`dimension`); and `site.heading` h1 to h6 and h1Small to h6Small (`number`, rem). A missing or extra one, or another type, is an error.

#### Scenario: Site palette entry missing
- **WHEN** the source has `site.dark` without `textLight`, and then `site.light` without `link`
- **THEN** each build fails, naming `site.dark.textLight`, then `site.light.link`, as missing (type color), and writes no file

#### Scenario: Measured site palette
- **WHEN** the build runs on the repository's source
- **THEN** `tokens.json` holds `site.light` `{ primary: #121212, body: #F6F3EC, border: #D7D1C5, light: #FFFFFF, dark: #121212, text: #121212, textDark: #121212, textLight: #5C5852, link: #B83A0C }`, `site.dark` `{ primary: #F1EEE8, body: #121110, border: #3B3834, light: #1D1C1A, dark: #F1EEE8, text: #F1EEE8, textDark: #F1EEE8, textLight: #ADA79D, link: #FF7A45 }`, `site.font.primary` `'Source Sans 3', sans-serif`, `site.font.secondary` `'Source Serif 4', serif`, `site.font.mono` `'Source Code Pro', monospace`, `site.fontSize.base` 16 and `site.heading.h1` 2.985984, and `tokens.css` holds `--ds-site-light-link` and `--ds-site-font-mono`

## ADDED Requirements

### Requirement: Site colours are brand roles
Each `site.<theme>` colour SHALL equal the `brand.<theme>` role it stands for: primary, dark, text and textDark equal `text`; body equals `bg`; light equals `cardBg`; border equals `border`; textLight equals `textMuted`; link equals `accentText`. The token test's mapping check, `siteRoleMismatches(source)`, returns every pair that differs as `<site path> ≠ <brand path>`.

#### Scenario: Every site colour matches its role
- **WHEN** the mapping check runs on the repository's source
- **THEN** it returns no mismatch for the eighteen pairs

#### Scenario: A site colour that drifts from its role
- **WHEN** the mapping check runs on a copy of the source whose `site.dark.textLight` is `#B4AFB6` (its 0.7.0 value)
- **THEN** it returns exactly `site.dark.textLight ≠ brand.dark.textMuted`

### Requirement: Site palette contrast
In each theme, `site.<theme>.text`, `textLight` and `link` SHALL each reach a WCAG 2.x contrast of at least 4.5:1 on `site.<theme>.body` and on `site.<theme>.light`. The token test's contrast check, `siteContrastBelow(source, 4.5)`, returns every pair under the floor with its ratio rounded to two decimals.

#### Scenario: Site pairs above the floor
- **WHEN** the contrast check runs on the repository's source
- **THEN** it returns no pair

#### Scenario: A link below the floor
- **WHEN** the contrast check runs on a copy of the source whose `site.light.link` is `#E04E17` (`brand.light.accent`)
- **THEN** it returns exactly `site.light.link` on `site.light.body` at 3.59 and `site.light.link` on `site.light.light` at 3.98
