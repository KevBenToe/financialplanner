# Financial Planner / Finanzplaner

[English](#english) | [Deutsch](#deutsch)

## English

Financial Planner is a private, browser-based savings and financial-planning simulator. Create plans, compare scenarios, and see how contributions, subsidies, fees, taxes, withdrawals, and inflation affect your projected wealth.

The application runs entirely in the browser. It does not require an account and stores data locally with IndexedDB.

### Features

- Multiple savings plans with individual colours and categories
- Forecast scenarios with minimum, base, and maximum returns
- Historical-price mode with virtual share purchases
- Monthly calculations with contributions, subsidies, fees, taxes, pauses, and withdrawals
- Dashboard and single-plan views with line and annual stacked bar charts
- Flexible calculation date: today, +10 / +20 / +30 years, or a custom date
- JSON backup and restore, plus CSV parsing for historical prices
- Local-first IndexedDB persistence and PWA support

### Stack

- React 18, TypeScript, Vite
- Apache ECharts
- Dexie / IndexedDB
- Zod, Papa Parse, date-fns
- Vitest, React Testing Library, ESLint, Prettier

### Local development

```bash
npm install
npm run dev
```

### Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### GitHub Pages

The repository contains a GitHub Actions workflow that builds, tests, and deploys the app on every push to `main`.

1. Open repository **Settings** > **Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. Push to `main` and wait for the `Build Test Deploy` workflow to finish.
4. The site is published at `https://KevBenToe.github.io/financialplanner/`.

The Vite base path is derived automatically from `GITHUB_REPOSITORY` during the workflow.

### Privacy and notice

Financial data remains in the local browser storage unless you explicitly export it. This application is a planning simulation and does not provide investment or tax advice.

---

## Deutsch

Der Finanzplaner ist ein privater, browserbasierter Sparplan- und Finanzsimulator. Erstelle Sparplaene, vergleiche Szenarien und sieh, wie Einzahlungen, Zuschuesse, Gebuehren, Steuern, Entnahmen und Inflation dein geplantes Vermoegen beeinflussen.

Die Anwendung laeuft vollstaendig im Browser. Sie benoetigt kein Konto und speichert Daten lokal in IndexedDB.

### Funktionen

- Mehrere Sparplaene mit eigenen Farben und Kategorien
- Prognosen mit Mindest-, Basis- und Maximalrendite
- Historischer Modus mit virtuellen Anteilskaufen
- Monatliche Berechnung von Einzahlungen, Zuschussen, Gebuehren, Steuern, Pausen und Entnahmen
- Dashboard- und Einzelplanansicht mit Linien- und jaehrlichen Stapelbalkendiagrammen
- Flexibler Berechnungsstichtag: heute, +10 / +20 / +30 Jahre oder ein eigenes Datum
- JSON-Sicherung und -Wiederherstellung sowie CSV-Auswertung fuer historische Kurse
- Lokale IndexedDB-Speicherung und PWA-Unterstuetzung

### Lokal starten

```bash
npm install
npm run dev
```

### Qualitaetspruefungen

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### GitHub Pages

Der vorhandene GitHub-Actions-Workflow baut, testet und veroeffentlicht die Anwendung bei jedem Push auf `main`.

1. Im Repository **Settings** > **Pages** oeffnen.
2. Bei **Build and deployment** die Quelle **GitHub Actions** auswaehlen.
3. Auf `main` pushen und den Workflow `Build Test Deploy` abwarten.
4. Die Seite wird unter `https://KevBenToe.github.io/financialplanner/` veroeffentlicht.

### Datenschutz und Hinweis

Finanzdaten bleiben im lokalen Browser-Speicher, bis sie bewusst exportiert werden. Diese Anwendung ist ein Simulationstool und stellt keine Anlage- oder Steuerberatung dar.
