# 🍽 Food is Life

Weekplanner voor avondeten. Doordeweeks snel en voorspelbaar, in het weekend ruimte voor iets moois.

## Starten

```bash
npm install
npm run dev
```

Draait op http://localhost:5173. Alle data wordt lokaal opgeslagen in de browser (localStorage).

## Tabs

### Weekplanning
Overzicht van maandag t/m zondag. Klik op een dag om een maaltijd te kiezen, te wijzigen, of een notitie te zetten (restjes, afhalen, broodjes).

Op zaterdag en zondag verschijnt een extra sectie **"Zin om uitgebreider te koken?"** met weekendprojecten, weekendgerechten en favorieten — als suggestie, niet als verplichting.

Als er een weekendproject gepland staat dat voorbereiding vereist, verschijnt een banner boven het rooster met de prep-taken en hun tijdstip.

**Boodschappenlijst** — knop rechtsboven in het weekrooster. Genereert op basis van de geplande maaltijden wat je nog moet kopen, rekening houdend met je voorraad. Ingrediënten die je al in huis hebt worden gemarkeerd met ⚠ "controleer hoeveel je nog hebt" — zonder hoeveelheden weet de app niet of je genoeg hebt.

**✓ Gekookt** — verschijnt op dagkaarten van vandaag en het verleden zodra er een recept gepland staat. Klik erop om aan te geven welke ingrediënten op zijn; die gaan uit je voorraad.

### Recepten
Bibliotheek met filters:

- **Stijl** — Snel / Normaal / Weekend / Weekendproject
- **Seizoen** — Nu in seizoen / Lente / Zomer / Herfst / Winter / Heel jaar
- **Favorieten**

Filters zijn combineerbaar. Klik op een recept voor de volledige beschrijving, ingrediënten met hoeveelheden, bereidingsstappen en prep-taken.

Recepten toevoegen, bewerken en verwijderen via de bibliotheek. Recept toevoegen kan ook direct vanuit de maaltijdkiezer.

**🚫 Niet mijn ding** — knop op elk receptkaartje. Geeft een penalty in suggesties zodat het recept lager verschijnt. Nooit geblokkeerd — je kunt het altijd gewoon kiezen.

### Voorraad
Overzicht van alle ingrediënten. Klik een ingrediënt aan om het als "in huis" te markeren. Voorraad beïnvloedt:
- De boodschappenlijst (wat moet je nog kopen?)
- De ranking van suggesties (recepten waarvoor je al veel in huis hebt, staan hoger)

### Ingrediënten
Tabel met seizoensinformatie per ingrediënt. Pas aan wanneer iets niet klopt voor jouw regio.

## Receptcategorieën

| Stijl | Bedoeling |
|---|---|
| **Snel** | < 30 minuten actief, weinig handelingen |
| **Normaal** | 30–60 minuten, doordeweeks haalbaar |
| **Weekend** | Meer tijd en aandacht, maar op één dag klaar |
| **Weekendproject** | Lange doorlooptijd hoort erbij — actieve tijd valt mee |

Weekendprojecten tonen altijd twee tijden: actieve bereidingstijd en totale doorlooptijd. Een stoofpot van 4 uur heeft misschien maar 30 minuten actieve tijd.

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
3. Voorraad (veel in huis → hoger)
4. Hoe recent gegeten
5. Hoe vaak deze maand gegeten
6. "Niet mijn ding" → onderaan

Nooit geblokkeerd, altijd vrij te kiezen.

## Backup & herstel

In de header staan twee knoppen:

- **↓ Backup** — downloadt alle data als JSON-bestand
- **↑ Herstel** — laadt een eerder gedownload bestand terug

localStorage is browser- en apparaatspecifiek. Maak regelmatig een backup, zeker voor je de browser wist of overstapt naar een ander apparaat.

## Data bijwerken

Nieuwe seed-recepten of ingrediënten worden automatisch ingeladen bij een versie-update — zonder dat je localStorage hoeft te wissen. Eigen toegevoegde recepten, planning, voorraad en geschiedenis blijven altijd bewaard.

Verhoog `DATA_VERSION` in `src/lib/useAppState.ts` als je wijzigingen in de seed-data wil doorvoeren.

## Mapstructuur

```
src/
  types.ts                  Alle datamodellen
  app.css                   Stijlen (inclusief responsive)
  data/
    recipes.ts              Seed-recepten (~36 stuks)
    ingredients.ts          Seed-ingrediënten met seizoendata
  lib/
    season.ts               Seizoenslogica en scoring
    history.ts              Kookhistorie helpers
    suggestions.ts          Ranking van suggesties
    backup.ts               Export / import
    useAppState.ts          Centrale state met localStorage
  components/
    WeekPlanner.tsx         Weekrooster
    MealPicker.tsx          Maaltijdkiezer modal
    CookedModal.tsx         "Wat is er op?" na het koken
    ShoppingList.tsx        Boodschappenlijst modal
    RecipeLibrary.tsx       Bibliotheek met filters
    RecipeCard.tsx          Receptkaartje
    RecipeDetail.tsx        Receptdetail modal
    RecipeForm.tsx          Toevoegen / bewerken formulier
    IngredientEditor.tsx    Seizoendata editor
```

## Techniek

- React + TypeScript, gebouwd met Vite
- Geen backend, geen externe API's
- Persistentie via `localStorage`
- Geen UI-framework, plain CSS
