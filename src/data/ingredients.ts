import type { Ingredient } from '../types';

// Seizoensinformatie per ingredient (maanden 1–12)
// seasonStartMonth → seasonEndMonth = normaal seizoen
// Cross-year voorbeeld: wintergroenten nov→feb = start 11, end 2
export const INGREDIENTS: Ingredient[] = [
  { id: 'asparagus', name: 'Asperges', seasonStartMonth: 4, seasonEndMonth: 6, peakMonths: [5] },
  { id: 'strawberry', name: 'Aardbeien', seasonStartMonth: 5, seasonEndMonth: 8, peakMonths: [6, 7] },
  { id: 'pumpkin', name: 'Pompoen', seasonStartMonth: 9, seasonEndMonth: 11, peakMonths: [10] },
  { id: 'leek', name: 'Prei', seasonStartMonth: 9, seasonEndMonth: 3, peakMonths: [11, 12, 1] },
  { id: 'kale', name: 'Boerenkool', seasonStartMonth: 10, seasonEndMonth: 2, peakMonths: [11, 12] },
  { id: 'mushroom', name: 'Paddenstoelen', seasonStartMonth: 9, seasonEndMonth: 11, peakMonths: [10] },
  { id: 'zucchini', name: 'Courgette', seasonStartMonth: 6, seasonEndMonth: 9, peakMonths: [7, 8] },
  { id: 'tomato', name: 'Tomaat', seasonStartMonth: 6, seasonEndMonth: 9, peakMonths: [7, 8] },
  { id: 'apple', name: 'Appel', seasonStartMonth: 8, seasonEndMonth: 12, peakMonths: [9, 10] },
  { id: 'pear', name: 'Peer', seasonStartMonth: 8, seasonEndMonth: 11, peakMonths: [9, 10] },
  { id: 'cauliflower', name: 'Bloemkool', seasonStartMonth: 9, seasonEndMonth: 12, peakMonths: [10, 11] },
  { id: 'sprouts', name: 'Spruitjes', seasonStartMonth: 10, seasonEndMonth: 2, peakMonths: [11, 12] },
  { id: 'potato', name: 'Aardappel', seasonStartMonth: 6, seasonEndMonth: 3, peakMonths: [8, 9] },
  { id: 'onion', name: 'Ui' },
  { id: 'garlic', name: 'Knoflook' },
  { id: 'carrot', name: 'Wortel', seasonStartMonth: 7, seasonEndMonth: 12, peakMonths: [9, 10] },
  { id: 'beef', name: 'Rundvlees' },
  { id: 'chicken', name: 'Kip' },
  { id: 'pork', name: 'Varkensvlees' },
  { id: 'pasta', name: 'Pasta' },
  { id: 'rice', name: 'Rijst' },
  { id: 'egg', name: 'Ei' },
  { id: 'bread', name: 'Brood' },
  { id: 'cheese', name: 'Kaas' },
  { id: 'cream', name: 'Room' },
  { id: 'flour', name: 'Meel' },
  { id: 'spinach', name: 'Spinazie', seasonStartMonth: 4, seasonEndMonth: 6, peakMonths: [5] },
];
