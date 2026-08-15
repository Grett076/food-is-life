# Roadmap

Dingen die we willen maar nog niet bouwen.

---

## Infrastructuur (eerst ophalen)

- [ ] Persoonlijke GitHub account aanmaken
- [ ] GPG key aanmaken + koppelen aan persoonlijk account
- [ ] `~/.gitconfig` conditional include voor `~/prive/` (persoonlijk account)
- [ ] Cloudflare account aanmaken
- [ ] App deployen op Cloudflare Pages vanuit persoonlijke GitHub repo

---

## Multi-user (vereist backend)

Stack: Cloudflare Workers + D1 (SQLite).

- [ ] Datamodel ontwerpen: `users`, `recipes` (gedeeld), `week_plans` (per user), `preferences` (per user), `day_types` (per user), `stock` (per user), `history` (per user)
- [ ] Cloudflare Workers API opzetten
- [ ] App migreren van localStorage naar API
- [ ] Gebruikerswissel in de header (jij / Steeph)
- [ ] Gedeelde receptenbibliotheek — iedereen ziet alle recepten
- [ ] Eigen weekplanning per gebruiker
- [ ] "Inspiratieswitch" — optioneel inkijken in elkaars planning (later bepalen)
- [ ] Sync hoeft niet real-time — pull on open is voldoende voor v1

---

## Lunch & werkdagenplanner (vereist multi-user voor volle waarde)

- [ ] Dagtype per gebruiker: `kantoor` / `thuis` / `vrij` / `weekend`
  - Standaard: ma–vr = kantoor, za–zo = weekend
  - Wekelijks aanpasbaar (vaste vrije dag, thuiswerken)
- [ ] Lunchprofiel per gebruiker
  - Jij: boterham op kantoordagen
  - Steeph: yoghurt (of wat dan ook)
  - Vrije dag / thuiswerken: eigen instelling
- [ ] Boodschappenlijst berekent lunch per gebruiker op basis van dagtypes
- [ ] Basis voor Ted-planning (schoollunch op specifieke dagen) — universeler dan de oude Ted-feature

---

## Mobiele UI (native feel)

Nu is het een desktop website die je ook op mobiel kan gebruiken. Dat moet anders.

- [ ] Navigatie naar beneden (tab bar) in plaats van bovenin
- [ ] Grotere touch targets
- [ ] Bottom sheet modals die echt native voelen
- [ ] Weekplanning als swipeable dagen (één dag tegelijk op mobiel)
- [ ] PWA instellen (installeerbaar op homescreen, app-icoon)
  - `manifest.json` met naam, kleur, icoon
  - Service worker voor offline werking
- [ ] iOS safe area insets (notch / home indicator)

---

## Kleine dingen

- [ ] Uitgesloten recepten zichtbaar gemarkeerd in de maaltijdkiezer (nu zakken ze gewoon naar onderen)
- [ ] Recept importeren via URL (vereist backend — CORS blokkeert dit in browser)
- [ ] "Wat kan ik maken?" — filter op wat er in huis is
