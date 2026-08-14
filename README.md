# 🍽 Food is Life

Weekplanner voor avondeten. Doordeweeks snel en voorspelbaar, in het weekend ruimte voor iets moois.

## Starten

```bash
npm install
npm run dev
```

Draait op http://localhost:5173. Alle data wordt lokaal opgeslagen in de browser (localStorage).

## Wat het doet

### Weekplanning
Overzicht van maandag t/m zondag. Klik op een dag om een maaltijd te kiezen of een notitie te zetten (restjes, afhalen, broodjes).

Op zaterdag en zondag verschijnt een extra sectie **"Zin om uitgebreider te koken?"** met weekendprojecten, weekendgerechten en favorieten als suggestie — geen verplichting.

Als er een weekendproject gepland staat dat voorbereiding vereist, verschijnt een banner boven het rooster met de prep-taken en hun tijdstip.

### Recepten
Bibliotheek met filters:

- **Stijl** — Snel / Normaal / Weekend / Weekendproject
- **Seizoen** — Nu in seizoen / Lente / Zomer / Herfst / Winter / Heel jaar
- **Favorieten**

Filters zijn combineerbaar. Klik op een recept voor details inclusief ingrediënten, tijden en voorbereidingstaken.

Recepten toevoegen, bewerken en verwijderen via de bibliotheek.

### Ingrediënten
Tabel met seizoensinformatie per ingrediënt. Pas aan als iets niet klopt voor jouw regio. Wordt gebruikt voor de seizoensscore van recepten.

## Receptcategorieën

| Stijl | Bedoeling |
|---|---|
| **Snel** | < 30 minuten actief, weinig handelingen |
| **Normaal** | 30–60 minuten, doordeweeks haalbaar |
| **Weekend** | Meer tijd en aandacht, maar op één dag klaar |
| **Weekendproject** | Lange doorlooptijd hoort erbij — actieve tijd valt mee |

Een weekendproject toont altijd twee tijden: actieve bereidingstijd en totale doorlooptijd. Een stoofpot van 4 uur heeft misschien maar 30 minuten actieve tijd.

## Seizoensscore

Recepten krijgen een label op basis van hoeveel seizoensingrediënten nu in hun normale of piekseizoen zitten:

- **Perfect voor nu** — meerdere ingrediënten in piekseizoen
- **Goed voor dit seizoen** — ingrediënten in seizoen
- **Het hele jaar** — geen seizoensgebonden ingrediënten
- **Minder seizoensgebonden** — ingrediënten buiten hun seizoen

Seizoen blokkeert nooit een keuze. Het is alleen een ranking-signaal en een label.

## Maaltijdsuggesties

De volgorde in de maaltijdkiezer is gebaseerd op een lichte heuristiek:

1. Favorieten
2. Seizoensscore
3. Hoe recent gegeten
4. Hoe vaak deze maand gegeten

Geen blokkades, geen verplichtingen. Altijd vrij te kiezen.

## Datastructuur

```
src/
  types.ts              Alle datamodellen
  data/
    recipes.ts          Seed-recepten (~35 stuks)
    ingredients.ts      Seed-ingrediënten met seizoendata
  lib/
    season.ts           Seizoenslogica en scoring
    history.ts          Kookhistorie helpers
    suggestions.ts      Ranking van suggesties
    useAppState.ts      Centrale state met localStorage
  components/
    WeekPlanner.tsx     Weekrooster
    MealPicker.tsx      Maaltijdkiezer modal
    RecipeLibrary.tsx   Bibliotheek met filters
    RecipeCard.tsx      Receptkaartje
    RecipeDetail.tsx    Receptdetail modal
    RecipeForm.tsx      Toevoegen / bewerken formulier
    IngredientEditor.tsx Seizoendata editor
```

## Techniek

- React + TypeScript, gebouwd met Vite
- Geen backend, geen externe API's
- Persistentie via `localStorage`
- Geen UI-framework, plain CSS
