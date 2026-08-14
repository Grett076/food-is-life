import type { Ingredient } from '../types';

export const INGREDIENTS: Ingredient[] = [
  // Groenten — seizoensgebonden
  { id: 'asparagus',   name: 'Asperges',     seasonStartMonth: 4,  seasonEndMonth: 6,  peakMonths: [5] },
  { id: 'strawberry',  name: 'Aardbeien',    seasonStartMonth: 5,  seasonEndMonth: 8,  peakMonths: [6, 7] },
  { id: 'pumpkin',     name: 'Pompoen',      seasonStartMonth: 9,  seasonEndMonth: 11, peakMonths: [10] },
  { id: 'leek',        name: 'Prei',         seasonStartMonth: 9,  seasonEndMonth: 3,  peakMonths: [11, 12, 1] },
  { id: 'kale',        name: 'Boerenkool',   seasonStartMonth: 10, seasonEndMonth: 2,  peakMonths: [11, 12] },
  { id: 'mushroom',    name: 'Paddenstoelen',seasonStartMonth: 9,  seasonEndMonth: 11, peakMonths: [10] },
  { id: 'zucchini',    name: 'Courgette',    seasonStartMonth: 6,  seasonEndMonth: 9,  peakMonths: [7, 8] },
  { id: 'tomato',      name: 'Tomaat',       seasonStartMonth: 6,  seasonEndMonth: 9,  peakMonths: [7, 8] },
  { id: 'apple',       name: 'Appel',        seasonStartMonth: 8,  seasonEndMonth: 12, peakMonths: [9, 10] },
  { id: 'pear',        name: 'Peer',         seasonStartMonth: 8,  seasonEndMonth: 11, peakMonths: [9, 10] },
  { id: 'cauliflower', name: 'Bloemkool',    seasonStartMonth: 9,  seasonEndMonth: 12, peakMonths: [10, 11] },
  { id: 'sprouts',     name: 'Spruitjes',    seasonStartMonth: 10, seasonEndMonth: 2,  peakMonths: [11, 12] },
  { id: 'potato',      name: 'Aardappel',    seasonStartMonth: 6,  seasonEndMonth: 3,  peakMonths: [8, 9] },
  { id: 'spinach',     name: 'Spinazie',     seasonStartMonth: 4,  seasonEndMonth: 6,  peakMonths: [5] },
  { id: 'eggplant',    name: 'Aubergine',    seasonStartMonth: 7,  seasonEndMonth: 9,  peakMonths: [8] },
  { id: 'bellpepper',  name: 'Paprika',      seasonStartMonth: 7,  seasonEndMonth: 10, peakMonths: [8, 9] },
  { id: 'carrot',      name: 'Wortel',       seasonStartMonth: 7,  seasonEndMonth: 12, peakMonths: [9, 10] },
  { id: 'celery',      name: 'Selderij',     seasonStartMonth: 8,  seasonEndMonth: 12, peakMonths: [10, 11] },
  { id: 'fennel',      name: 'Venkel',       seasonStartMonth: 8,  seasonEndMonth: 11, peakMonths: [9, 10] },

  // Basisprodukten — het hele jaar
  { id: 'onion',       name: 'Ui' },
  { id: 'garlic',      name: 'Knoflook' },
  { id: 'lemon',       name: 'Citroen' },
  { id: 'chickpeas',   name: 'Kikkererwten' },
  { id: 'lentils',     name: 'Linzen' },
  { id: 'coconut',     name: 'Kokosmelk' },
  { id: 'ginger',      name: 'Gember' },
  { id: 'wine',        name: 'Wijn' },
  { id: 'miso',        name: 'Miso' },
  { id: 'noodles',     name: 'Noedels' },

  // Vlees & vis
  { id: 'beef',        name: 'Rundvlees' },
  { id: 'chicken',     name: 'Kip' },
  { id: 'pork',        name: 'Varkensvlees' },
  { id: 'lamb',        name: 'Lamsvlees' },
  { id: 'fish',        name: 'Vis' },
  { id: 'shrimp',      name: 'Garnalen' },
  { id: 'clams',       name: 'Mosselen/venusschelpen', seasonStartMonth: 9, seasonEndMonth: 4, peakMonths: [10, 11, 12] },
  { id: 'bacon',       name: 'Spek' },

  // Zuivel & droog
  { id: 'egg',         name: 'Ei' },
  { id: 'bread',       name: 'Brood' },
  { id: 'cheese',      name: 'Kaas' },
  { id: 'cream',       name: 'Room' },
  { id: 'flour',       name: 'Meel' },
  { id: 'pasta',       name: 'Pasta' },
  { id: 'rice',        name: 'Rijst' },
  { id: 'butter',      name: 'Boter' },
];
