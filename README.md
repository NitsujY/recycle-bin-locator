# Recycle Bin Locator

[![MIT License](https://img.shields.io/badge/licence-MIT-green.svg)](./LICENCE)

A fully static, client-side web application that helps users find nearby recycling collection points. Select the material you want to recycle, and the app shows the nearest suitable bins on a map and ranked list — no account required, no server needed.

- Detects your location automatically (or search by address)
- Filter by material category: Paper, Plastic, Glass, Light Bulb, Battery, and more
- Supports English and Traditional Chinese based on your browser locale
- Earn achievement badges as you log recycling visits
- Deployed on GitHub Pages at zero hosting cost

## Live Demo

[https://{your-username}.github.io/recycle-bin-locator](https://{your-username}.github.io/recycle-bin-locator)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + TypeScript |
| Build tool | Vite |
| Map | Leaflet.js + OpenStreetMap |
| Geocoding | Nominatim (OSM) |
| State management | Zustand |
| i18n | i18next |
| Styling | Tailwind CSS |

## Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

To refresh real data from the sibling data repository once (recommended default):

```bash
./sync-latest-data.sh
```

To keep polling in watch mode:

```bash
POLL_INTERVAL_SECONDS=900 ./sync-latest-data.sh --watch
```

To make production load data directly from the data repository (so app repo does not need committed snapshots), set:

```bash
VITE_DATA_REPO_URL=https://raw.githubusercontent.com/NitsujY/recycle-bin-locator-data/main/data/collection_points.json
```

To run the test suite:

```bash
npx vitest --run
```

## How to Add a New Language

1. Create `public/locales/{locale}/translation.json` with all translation keys (copy `public/locales/en/translation.json` as a starting point and translate each value).
2. Create `public/locales/{locale}/motivation.txt` with at least one motivational message per line.
3. Add the locale code to the `SUPPORTED_LOCALES` constant in `src/i18n/index.ts`.

No other code changes are required.

## How to Add a New Data Source

Implement the `SourceAdapter` interface defined in `recycle-bin-locator-data/sources/SourceAdapter.ts`:

```typescript
interface SourceAdapter {
  readonly sourceId: string;
  fetch(): Promise<RawRecord[]>;
  normalise(raw: RawRecord[]): CollectionPoint[];
}
```

Create a new adapter file under `recycle-bin-locator-data/sources/{source-id}/` and register it in the pipeline entry point. No changes to existing adapters are needed.

## Licence

[MIT](./LICENCE)
