# Implementatieplan: centrale opslag

## Architectuur

De bestaande React/Vite-interface blijft een SPA. Een Node.js-server serveert de productiebuild én een REST-API op poort 3000. De server gebruikt de ingebouwde `node:sqlite`-driver, zodat er geen native SQLite-add-on of afzonderlijke databasecontainer nodig is. De database staat standaard in `/app/data/food-is-life.db`.

```text
React UI -> /api/state/*, /api/import, /api/backup -> Node HTTP server -> SQLite
```

De client houdt een kleine lokale weergave van de opgehaalde gegevens bij. Thema en andere onbelangrijke UI-voorkeuren mogen lokaal blijven; huishoudgegevens worden niet meer naar localStorage geschreven.

## Datamodel en migraties

SQLite bevat:

- `schema_migrations(version, applied_at)` voor oplopende SQL-migraties;
- `documents(key, data, version, updated_at)` voor recepten, ingrediënten, voorraad, voorkeuren, kookgeschiedenis en elke weekplanning;
- `metadata(key, value)` voor eenmalige-importstatus.

Documenten zijn JSON, maar hebben elk een eigen recordversie. Sleutels zijn `recipes`, `ingredients`, `stock`, `preferences`, `history` en `week/YYYY-MM-DD`. Dit past bij de huidige applicatiestatus en houdt updates van verschillende weken onafhankelijk. Een eerste migratie maakt deze tabellen en index aan. Seeds worden alleen op een lege database geplaatst.

## API-contract

- `GET /api/health` retourneert `{ status: "ok" }`.
- `GET /api/state?week=YYYY-MM-DD` retourneert de domeindocumenten plus `{ value, version }` per document.
- `PUT /api/state/:key` accepteert `{ value, version }`. `version` moet de actuele recordversie zijn; bij succes stijgt die met één.
- `POST /api/import` accepteert het bestaande JSON/localStorage-formaat en schrijft alle documenten transactioneel. Dit mag maar eenmaal worden uitgevoerd.
- `GET /api/backup` geeft een compatibel JSON-back-upobject; `POST /api/restore` herstelt zo'n bestand transactioneel met expliciete versies.

Foutmeldingen zijn JSON. Een verkeerde versie geeft `409 CONFLICT` met de actuele waarde zodat een client kan herladen in plaats van een wijziging te overschrijven.

## Migratie van bestaande localStorage

Bij een eerste succesvolle verbinding inspecteert de client alleen de bekende oude keys (`recipes`, `ingredients`, `history`, `preferences`, `stock`, `week-*`). Als er gegevens zijn en de server nog niet is geïmporteerd, toont de app een eenmalige, bevestigde importactie. De payload wordt na een succesvolle serverimport niet lokaal verwijderd; JSON-export blijft een onafhankelijke back-upmogelijkheid.

## Concurrency en foutafhandeling

Iedere wijziging stuurt de versienummer(s) mee. De client werkt optimistisch in de UI, maar herstelt de actuele serverstatus en toont een foutmelding bij een 409 of netwerkfout. Samengestelde handelingen, zoals "gerecht gekookt", werken de voorraad en geschiedenis met een transactieroute bij; beide versies worden gecontroleerd in één SQLite-transactie.

## Docker en Unraid

De multi-stage Dockerfile bouwt de Vite-client en start daarna alleen de Node-runtime. De service draait op poort 3000 en heeft een healthcheck op `/api/health`. `compose.yaml` gebruikt de Unraid-mapping `/mnt/user/appdata/food-is-life/data:/app/data`. De image schrijft uitsluitend de SQLite-database naar die mount.

## Teststrategie

Node's ingebouwde test-runner test de migraties, versieconflicten, importbeperking en backup/herstel. Daarnaast draaien OXLint, de tests en de productiebuild. De Dockerfile wordt syntactisch gecontroleerd en is ontworpen voor `docker compose up -d --build` op Unraid.


