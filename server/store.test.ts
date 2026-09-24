import assert from 'node:assert/strict';
import test from 'node:test';
import { HouseholdStore, VersionConflictError } from './store.js';

test('maakt migratie en seed-documenten aan', () => {
  const store = new HouseholdStore();
  const recipes = store.get<unknown[]>('recipes');
  assert.ok(recipes.value.length > 0);
  assert.equal(recipes.version, 1);
  store.close();
});

test('weigert een verouderde documentversie', () => {
  const store = new HouseholdStore();
  const stock = store.get<string[]>('stock');
  store.put('stock', ['ui'], stock.version);
  assert.throws(() => store.put('stock', ['knoflook'], stock.version), VersionConflictError);
  store.close();
});

test('importeert legacygegevens maar één keer en maakt een compatibele back-up', () => {
  const store = new HouseholdStore();
  store.importLegacy({
    recipes: [],
    ingredients: [],
    stock: ['ui'],
    history: [{ date: '2026-09-21', recipeId: 'test' }],
    preferences: { excludedRecipes: ['test'] },
    'week-2026-09-21': [],
  });
  assert.equal(store.get<string[]>('stock').value[0], 'ui');
  assert.throws(() => store.importLegacy({ stock: [] }), /al uitgevoerd/);
  const backup = store.backup();
  assert.deepEqual(backup.stock, ['ui']);
  assert.deepEqual(backup['week-2026-09-21'], []);
  store.close();
});

test('herstelt een back-up zonder de eenmalige-importstatus te wijzigen', () => {
  const store = new HouseholdStore();
  const stock = store.get<string[]>('stock');
  store.put('stock', ['oude'], stock.version);
  store.restore({ stock: ['nieuwe'] });
  assert.deepEqual(store.get<string[]>('stock').value, ['nieuwe']);
  store.close();
});

test('schrijft voorraad en geschiedenis atomair bij een kookactie', () => {
  const store = new HouseholdStore();
  const stock = store.get<string[]>('stock');
  const history = store.get<unknown[]>('history');
  store.put('stock', ['ui', 'tomaat'], stock.version);
  const result = store.cook({
    date: '2026-09-21',
    recipeId: 'test',
    ingredientIds: ['ui'],
    stockVersion: 2,
    historyVersion: history.version,
  });
  assert.deepEqual(result.stock.value, ['tomaat']);
  assert.deepEqual(result.history.value, [{ date: '2026-09-21', recipeId: 'test' }]);
  store.close();
});


