# Food is Life

Een gedeelde weekplanner voor recepten, voorraad en boodschappen. Food is Life heeft nu één centrale SQLite-opslag voor het hele huishouden: alle apparaten op het LAN (of via Tailscale) gebruiken dezelfde gegevens.

## Beveiligingsmodel

Fase 1 heeft bewust geen gebruikersaccounts of login. Stel de app alleen beschikbaar op je eigen LAN of via Tailscale; publiceer poort 3000 niet rechtstreeks naar internet. Authenticatie, rechten en veilige externe toegang zijn een aparte vervolguitbreiding.

## Unraid-installatie

1. Maak de map `/mnt/user/appdata/food-is-life/data` aan.
2. Zet deze repository op je Unraid-server, bijvoorbeeld in `/mnt/user/appdata/food-is-life/app`.
3. Start de productiecontainer:

   ```bash
   docker compose up -d --build
   ```

4. Open `http://<unraid-ip>:3000` op ieder apparaat in het huishouden.

De meegeleverde `compose.yaml` gebruikt precies deze persistente mapping:

```yaml
volumes:
  - /mnt/user/appdata/food-is-life/data:/app/data
```

De SQLite-database wordt opgeslagen als `food-is-life.db` in die map. De container heeft een healthcheck op `/api/health` en herstart automatisch tenzij hij handmatig wordt gestopt.

## Eerste migratie uit de browser

Open na de upgrade Food is Life op het apparaat waarop de oude gegevens staan. De app vraagt eenmalig of bestaande localStorage-gegevens naar de centrale opslag mogen worden gekopieerd. Bevestig dit slechts op één browser. De oude gegevens worden niet automatisch verwijderd.

Gebruik je al een JSON-back-up? Kies **Instellingen → Importeer back-up**. Export en import blijven beschikbaar als back-up- en herstelfunctie, maar werken nu tegen de centrale opslag.

## Back-up en herstel

Maak regelmatig een export via **Instellingen → Exporteer back-up**. Bewaar het JSON-bestand buiten de appdata-map, bijvoorbeeld op een tweede share of in je back-upsysteem.

Een handmatige databaseback-up kan terwijl de app draait dankzij SQLite WAL, maar een consistente en eenvoudige aanpak is:

```bash
docker compose stop food-is-life
cp /mnt/user/appdata/food-is-life/data/food-is-life.db /mnt/user/backups/food-is-life.db
docker compose start food-is-life
```

Voor herstel stop je de container, vervang je zowel `food-is-life.db` als eventuele `food-is-life.db-wal` en `food-is-life.db-shm` uit dezelfde back-upset, en start je hem weer. Bij voorkeur gebruik je de JSON-functie in de interface: die valideert het formaat en herstelt transactioneel.

## Updaten

Maak vóór iedere update eerst een JSON-export of databaseback-up. Werk daarna de checkout bij en herbouw de image:

```bash
git fetch origin
git checkout main
git pull --ff-only
docker compose up -d --build
```

De database-migraties worden automatisch en eenmalig uitgevoerd bij het starten. Verwijder de map `/mnt/user/appdata/food-is-life/data` niet tijdens een update.

## Lokale ontwikkeling

Vereist: Node.js 22.12 of nieuwer.

```bash
npm ci
npm run build
npm run start
```

De productieachtige server luistert dan op <http://localhost:3000>. Voor alleen visuele Vite-ontwikkeling is `npm run dev:client` beschikbaar; de API vereist de Node-server.

| Opdracht | Doel |
| --- | --- |
| `npm run lint` | Controleert React- en servercode met OXLint. |
| `npm test` | Test migraties, versieconflicten, import en herstel. |
| `npm run build` | Typecheckt server/client en bouwt de productie-assets. |
| `npm run start` | Start de gecombineerde API- en webserver op poort 3000. |

## Techniek

```text
React/Vite-interface -> REST API -> Node.js -> SQLite (/app/data/food-is-life.db)
```

De API gebruikt recordversies voor recipes, ingredients, stock, preferences, history en iedere afzonderlijke weekplanning. Een update met een verlopen versie krijgt HTTP 409; de client haalt dan de actuele centrale versie opnieuw op in plaats van een wijziging van een ander apparaat te overschrijven. De kookactie werkt voorraad en kookhistorie in één SQLite-transactie bij.

Zie [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) voor het volledige ontwerp en API-contract.


