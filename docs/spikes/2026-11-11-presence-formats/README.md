# Evidence: presence-formats (AB#325)

Renders for the owner's gate of change `presence-formats` (design §10), made on 2026-11-11 with `npm run png` and Google Chrome on macOS (`/Applications/Google Chrome.app`, headless, device scale 1). Each PNG is a build output kept here only as evidence (under 200 KB each).

| File | Size | What it shows |
|---|---|---|
| `linkedin-banner-light.png` | 840 x 246 | the `linkedin-banner` fixture's golden at 792 wide (the desktop card's shown size) with `--zones`, on the light page ground `surface.light.background` `#F6F3EC` |
| `linkedin-banner-dark.png` | 840 x 246 | the same on the dark page ground `surface.dark.background` `#121110` |
| `stackledger-icon-light.png` | 232 x 232 | the `stackledger` link icon from an icon spec at size 184, on `#F6F3EC` |
| `stackledger-icon-dark.png` | 232 x 232 | the same with `surface: "dark"`, on `#121110` |
| `release-app-avatar.png` | 250 x 250 | the release App's avatar on the `neutral` ground, at 250 wide, no page ground |

The `--zones` overlay is drawn in the page, never in the image: for each zone of `LINKEDIN_PHOTO_ZONES` the photo circle (dashed ink) and the safe circle (dashed `illustration.accent`), named `desktop` and `ios`. No piece of the fixture enters a safe circle.

## Commands

From the repository root, after `npm ci`:

```sh
D=docs/spikes/2026-11-11-presence-formats
npm run png -- test/fixtures/covers/linkedin-banner.svg --out $D/linkedin-banner-light.png --width 792 --ground '#F6F3EC' --zones
npm run png -- test/fixtures/covers/linkedin-banner.svg --out $D/linkedin-banner-dark.png --width 792 --ground '#121110' --zones

npm run cover -- stackledger-icon.json --out stackledger-icon.svg
npm run cover -- stackledger-icon-dark.json --out stackledger-icon-dark.svg
npm run png -- stackledger-icon.svg --out $D/stackledger-icon-light.png --ground '#F6F3EC'
npm run png -- stackledger-icon-dark.svg --out $D/stackledger-icon-dark.png --ground '#121110'

npm run cover -- release-app.json --out release-app.svg
npm run png -- release-app.svg --out $D/release-app-avatar.png --width 250
```

The three specs are kept out of the repository (only fixtures enter it, spec cover-cli "Parity with the published proof covers"); they were:

```json
{ "id": "stackledger-icon", "format": "icon", "title": "stackledger", "description": "stackledger icon: the product's mark, a bent line through two stations.",
  "pieces": [{ "piece": "linkIcon", "icon": "stackledger", "size": 184 }] }
```

```json
{ "id": "stackledger-icon-dark", "format": "icon", "title": "stackledger", "description": "stackledger icon: the product's mark, a bent line through two stations.",
  "pieces": [{ "piece": "linkIcon", "icon": "stackledger", "size": 184, "surface": "dark" }] }
```

```json
{ "id": "release-app", "format": "avatar", "background": "neutral",
  "title": "Bruno Souza's release app", "description": "The b-with-moon symbol on the brand's cream ground." }
```

For the upload, the App icon is the same spec rendered at its own size, `npm run png -- release-app.svg --out release-app.png` (500 x 500), and the LinkedIn banner is the golden at its own size, `npm run png -- test/fixtures/covers/linkedin-banner.svg --out linkedin-banner.png` (1584 x 396, no `--zones`).

Chrome loaded the embedded faces without a virtual-time budget: the `og-headline` golden (serif headline, Source Sans labels) rendered in its own faces through `<img>` with the arguments of design §6 unchanged.
