# 🍽 Food is Life

Weekplanner voor avondeten. Doordeweeks snel en voorspelbaar, in het weekend ruimte voor iets moois.

## Git-workflow

**Alle wijzigingen gaan via een branch — nooit direct op `main`.**

```bash
# Begin altijd zo:
git checkout main
git pull                          # zorg dat main up-to-date is
git checkout -b feature/mijn-feature

# Werk, commit tussentijds:
git add -A
git commit -m "Korte beschrijving"

# Klaar? Merge terug naar main:
git checkout main
git merge --no-ff feature/mijn-feature
git branch -d feature/mijn-feature
```

**Branchnamen:** gebruik een prefix die past bij de wijziging:

| Prefix | Wanneer |
|---|---|
| `feature/` | Nieuwe functionaliteit |
| `fix/` | Bugfix |
| `docs/` | Alleen documentatie |
| `refactor/` | Code opruimen zonder gedragswijziging |
| `chore/` | Dependencies, config, tooling |

`main` bevat altijd werkende, stabiele code.

---

## Starten

```bash
npm install
npm run dev
```

Draait op http://localhost:5173. Alle data wordt lokaal opgeslagen in de browser (localStorage).

### Docker

```bash
docker compose up --build
```

Open http://localhost:5173. Broncodewijzigingen worden direct door Vite verwerkt.

Na wijzigingen aan `package.json` of `package-lock.json`:

```bash
docker compose exec app npm ci
```

## Tabs

### Weekplanning
Overzicht van maandag t/m zondag. Klik op een dag om een maaltijd te kiezen, te wijzigen, of een notitie te zetten (restjes, afhalen).

Op zaterdag en zondag verschijnt de maaltijdkiezer met een prominente chip-rij van weekendgerechten en -projecten.

Als er een weekendproject gepland staat dat voorbereiding vereist, verschijnt een banner boven het rooster met de prep-taken en hun tijdstip.

Op werkdagen staat een 🥪 **Boterham** knop — klik om die dag over te slaan als je toch ergens anders eet.

**🛒 Boodschappenlijst** genereert op basis van de geplande maaltijden wat je nog moet kopen, rekening houdend met je voorraad. Lunchbenodigdheden (brood, ham, kaas, komkommer) worden automatisch meegenomen op basis van het aantal boterhamdagen.

**✓ Gekookt** verschijnt op dagkaarten van vandaag en het verleden zodra er een recept gepland staat. Vink aan welke ingrediënten op zijn — die gaan uit je voorraad.

### Recepten
Bibliotheek met filters:

- **Stijl** — Snel / Normaal / Weekend / Weekendproject
- **Seizoen** — Nu in seizoen / Lente / Zomer / Herfst / Winter / Heel jaar
- **Favorieten**

Filters zijn combineerbaar. Klik op een recept voor de volledige beschrijving, ingrediënten met hoeveelheden en bereidingsstappen inclusief een portiewisselaar.

Recepten toevoegen, bewerken en verwijderen via de bibliotheek. Toevoegen kan ook direct vanuit de maaltijdkiezer.

**🚫 Niet mijn ding** — knop op elk receptkaartje. Geeft een penalty in suggesties zodat het recept lager verschijnt. Nooit geblokkeerd.

### Voorraad
Overzicht van alle ingrediënten. Klik een ingrediënt aan om het als "in huis" te markeren. Voorraad beïnvloedt de boodschappenlijst en de ranking van suggesties.

### Ingrediënten
Tabel met seizoensinformatie per ingrediënt. Aanpassen wanneer iets niet klopt voor jouw regio.

## Receptcategorieën

| Stijl | Bedoeling |
|---|---|
| **Snel** | < 30 minuten actief, weinig handelingen |
| **Normaal** | 30–60 minuten, doordeweeks haalbaar |
| **Weekend** | Meer tijd en aandacht, maar op één dag klaar |
| **Weekendproject** | Lange doorlooptijd hoort erbij — actieve tijd valt mee |

Weekendprojecten tonen altijd twee tijden: actieve bereidingstijd en totale doorlooptijd.

## Seizoensscore

- **Perfect voor nu** — ingrediënten in piekseizoen
- **Goed voor dit seizoen** — ingrediënten in seizoen
- **Het hele jaar** — geen seizoensgebonden ingrediënten
- **Minder seizoensgebonden** — ingrediënten buiten hun seizoen

Seizoen blokkeert nooit een keuze — het is alleen een ranking-signaal.

## Maaltijdsuggesties

Ranking in de maaltijdkiezer:

1. Favorieten
2. Seizoensscore
3. Voorraad (veel in huis → hoger)
4. Hoe recent gegeten
5. Hoe vaak deze maand gegeten
6. "Niet mijn ding" → onderaan

## Backup & herstel

In de header: **↓ Backup** en **↑ Herstel**. Backup downloadt alle data als JSON. Herstel laadt een eerder bestand terug.

localStorage is browser- en apparaatspecifiek — maak regelmatig een backup.

## Seed data bijwerken

Verhoog `DATA_VERSION` in `src/lib/useAppState.ts` bij wijzigingen in seed-recepten of ingrediënten. Eigen data, planning en geschiedenis blijven bewaard.

## Mapstructuur

```
src/
  types.ts                  Datamodellen
  app.css                   Stijlen (forest green palet, responsive)
  data/
    recipes.ts              Seed-recepten (~50 stuks)
    ingredients.ts          Seed-ingrediënten met seizoendata
  lib/
    season.ts               Seizoenslogica en scoring
    history.ts              Kookhistorie helpers
    suggestions.ts          Ranking van suggesties
    scale.ts                Portiewisselaar (hoeveelheden schalen)
    backup.ts               Export / import
    useAppState.ts          Centrale state met localStorage
  components/
    WeekPlanner.tsx         Weekrooster
    MealPicker.tsx          Maaltijdkiezer modal
    CookedModal.tsx         Ingrediënten afstrepen na koken
    ShoppingList.tsx        Boodschappenlijst
    RecipeLibrary.tsx       Bibliotheek met filters
    RecipeCard.tsx          Receptkaartje
    RecipeDetail.tsx        Receptdetail met portiewisselaar
    RecipeForm.tsx          Toevoegen / bewerken
    IngredientEditor.tsx    Seizoendata editor
```

## Techniek

- React + TypeScript, gebouwd met Vite
- Geen backend, geen externe API's
- Persistentie via `localStorage`
- Geen UI-framework, plain CSS
- Tijdzone-veilig: datums worden lokaal opgeslagen (niet UTC)
