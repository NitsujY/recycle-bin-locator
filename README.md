# HK Recycle Locator 🌏♻️

[![MIT License](https://img.shields.io/badge/licence-MIT-green.svg)](./LICENCE)
[![Deploy to GitHub Pages](https://github.com/NitsujY/recycle-bin-locator/actions/workflows/deploy.yml/badge.svg)](https://github.com/NitsujY/recycle-bin-locator/actions/workflows/deploy.yml)

**Find the nearest recycling collection points across Hong Kong — instantly, on your phone or desktop.**

🔗 **Live app:** [nitsujy.github.io/recycle-bin-locator](https://nitsujy.github.io/recycle-bin-locator/)

---

## What it does

HK Recycle Locator helps Hong Kong residents find nearby recycling drop-off points maintained by the Environmental Protection Department (EPD):

- 📍 **Interactive map** showing recycling points near your current location
- ♻️ **Material filter** — paper, plastic, metal, glass, light bulbs, batteries
- 🔍 **Address / district search** to find points anywhere in Hong Kong
- 📋 **Slide-out location list** with address and accepted materials at a glance
- 🌐 **English and Traditional Chinese** interface
- 🏆 **Achievement system** that rewards regular recycling visits

---

## Keywords

Hong Kong recycling locator · 香港回收點 · 回收地圖 · HK recycle map · EPD recycling · paper recycling HK · plastic recycling Hong Kong · battery drop-off Hong Kong · glass recycling HK · metal recycling · 環保回收 · 廢物回收 · recycle bin near me Hong Kong

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 19 + TypeScript |
| Styling | Tailwind CSS |
| Map | Leaflet.js + OpenStreetMap |
| Geocoding | Nominatim (OSM) |
| State | Zustand |
| i18n | i18next |
| Build | Vite |
| Data source | Hong Kong EPD open dataset |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Local development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Run tests
npx vitest --run
```

## Data pipeline

Recycling point data is automatically fetched and normalised from the HK EPD open dataset by the companion [`recycle-bin-locator-data`](https://github.com/NitsujY/recycle-bin-locator-data) repository and published as `public/collection_points.json`.

To sync the latest data locally:

```bash
./sync-latest-data.sh
```

---

## Deployment

Every push to `main` automatically builds and deploys to **GitHub Pages** via the workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Live URL: **https://nitsujy.github.io/recycle-bin-locator/**

---

## Contributing

Pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Licence

[MIT](LICENCE)
