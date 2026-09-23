# Food is Life

> Een lokale weekplanner voor avondeten, recepten, voorraad en boodschappen.

## What it does

Food is Life helpt met het plannen van maaltijden voor de week. Je beheert recepten en ingrediënten, houdt voorraad bij en maakt een boodschappenlijst op basis van de planning. De app is bedoeld voor persoonlijk gebruik en slaat alle gegevens lokaal in de browser op.

## Requirements

- Node.js `^20.19.0` of `>=22.12.0`
- npm
- Docker Engine met Docker Compose (optioneel, voor de containerworkflow)

## Getting started

Installeer de afhankelijkheden vanuit een uitgecheckte repository:

```bash
npm ci
```

Start de ontwikkelserver:

```bash
npm run dev
```

Open daarna <http://localhost:5173>.

### Docker

Start de ontwikkelomgeving in een container:

```bash
docker compose up --build
```

Open daarna <http://localhost:5173>. Broncodewijzigingen worden direct door Vite verwerkt.

Na wijzigingen aan `package.json` of `package-lock.json` vernieuw je de containerafhankelijkheden:

```bash
docker compose exec app npm ci
```

## Usage

| Opdracht | Doel |
| --- | --- |
| `npm run dev` | Start de ontwikkelserver. |
| `npm run lint` | Controleert de code met OXLint. |
| `npm run build` | Typecheckt de app en maakt een productiebuild in `dist/`. |
| `npm run preview` | Serveert de productiebuild lokaal. |

In de app kun je:

- maaltijden plannen voor de hele week, inclusief boterhamdagen en weekendprojecten;
- recepten toevoegen, aanpassen, favoriet maken of uitsluiten;
- voorraad bijhouden en een boodschappenlijst genereren;
- recepten filteren op stijl, seizoen en favorieten;
- gegevens exporteren als JSON-back-up en later herstellen.

Gegevens zijn browser- en apparaatspecifiek. Maak via **Instellingen** regelmatig een back-up voordat je van browser of apparaat wisselt.

## Architecture / How it works

```text
index.html → src/main.tsx → App → useAppState → browser localStorage
```

De app is een React- en TypeScript-single-page-app, gebouwd met Vite. Er is geen backend, database of externe API. Recepten en seizoensgegevens starten vanuit `src/data/`; `src/lib/useAppState.ts` beheert de lokale applicatiestatus. `public/sw.js` verzorgt offline fallback via een service worker.

Verhoog `DATA_VERSION` in `src/lib/useAppState.ts` wanneer seed-recepten of -ingrediënten veranderen. Eigen gegevens, planning en kookgeschiedenis blijven behouden.

## Contributing

Werk nooit direct op `main`. Maak een branch met een passend prefix:

- `feature/` voor functionaliteit;
- `fix/` voor bugfixes;
- `docs/` voor documentatie;
- `refactor/` voor interne opschoning;
- `chore/` voor tooling of dependencies.

```bash
git checkout main
git pull
git checkout -b feature/korte-omschrijving
```

Controleer de wijziging vóór je commit:

```bash
npm run lint
npm run build
```

Commit kleine, samenhangende wijzigingen:

```bash
git add -A
git commit -m "feat: korte omschrijving"
```

Push de branch en open een pull request naar `main` als de repository een remote reviewflow gebruikt. `main` moet altijd stabiel en werkend blijven.
