import assert from 'node:assert/strict';
import test from 'node:test';
import { convert, formatValue, getUnitById, getUnitsByCategory } from '../src/lib/conversion-engine';
import { conversionPairs } from '../src/data/conversions';
import { categories } from '../src/data/categories';
import { normalizePath, withSiteUrl } from '../src/lib/url';

const closeTo = (actual: number, expected: number, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );
};

test('length: inch and mile match their exact SI definitions', () => {
  closeTo(convert(1, 'inch', 'centimeter'), 2.54);
  closeTo(convert(1, 'mile', 'kilometer'), 1.609344);
  closeTo(convert(12, 'inch', 'foot'), 1);
});

test('mass: kilogram to pound uses the international avoirdupois pound', () => {
  closeTo(convert(1, 'kilogram', 'pound'), 2.2046226218487757);
  closeTo(convert(1, 'stone', 'pound'), 14);
});

test('temperature: affine conversions are not plain multiplication', () => {
  closeTo(convert(0, 'celsius', 'fahrenheit'), 32);
  closeTo(convert(100, 'celsius', 'fahrenheit'), 212);
  closeTo(convert(0, 'celsius', 'kelvin'), 273.15);
  closeTo(convert(32, 'fahrenheit', 'celsius'), 0);
});

test('volume: US liquid gallon is 3.785411784 litres', () => {
  closeTo(convert(1, 'gallon', 'liter'), 3.785411784);
  closeTo(convert(1, 'cup', 'us_fluid_ounce'), 8);
});

test('fuel economy: inverse units round-trip', () => {
  const l100km = convert(30, 'mpg_us', 'liters_per_100km');
  closeTo(l100km, 7.8404861, 1e-6);
  closeTo(convert(l100km, 'liters_per_100km', 'mpg_us'), 30, 1e-6);
});

test('every declared conversion pair produces a finite, reversible result', () => {
  assert.ok(conversionPairs.length >= 100, 'expected a substantial pair catalogue');

  for (const pair of conversionPairs) {
    const forward = convert(1, pair.fromId, pair.toId);
    assert.ok(Number.isFinite(forward), `${pair.slug}: forward result is not finite`);
    // Affine scales (temperature) can legitimately go negative or hit zero.
    if (pair.categoryId !== 'temperature') {
      assert.ok(forward > 0, `${pair.slug}: forward result must be positive`);
    }

    const back = convert(forward, pair.toId, pair.fromId);
    assert.ok(
      Math.abs(back - 1) < 1e-9,
      `${pair.slug}: round-trip drifted to ${back}`
    );
  }
});

test('unknown or cross-category conversions fail closed', () => {
  assert.equal(convert(1, 'meter', 'kilogram'), 0);
  assert.equal(convert(1, 'not-a-unit', 'meter'), 0);
  assert.equal(convert(5, 'meter', 'meter'), 5);
});

test('every category has units and a resolvable base unit', () => {
  for (const category of categories) {
    const units = getUnitsByCategory(category.id);
    assert.ok(units.length > 0, `${category.id} has no units`);
    assert.ok(getUnitById(category.baseUnitId), `${category.id} base unit is missing`);
  }
});

test('formatValue removes floating point noise but keeps precision', () => {
  assert.equal(formatValue(0.1 + 0.2), '0.3');
  assert.equal(formatValue(0), '0');
  assert.equal(formatValue(2.54, 4), '2.5400');
  assert.equal(formatValue(1 / 3), '0.33333333');
});

test('canonical helpers always emit the trailing-slash form served by Pages', () => {
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath('/length-converter'), '/length-converter/');
  assert.equal(normalizePath('/convert/cm-to-inches/'), '/convert/cm-to-inches/');
  assert.equal(normalizePath('/about?ref=footer'), '/about/');
  assert.equal(withSiteUrl('https://example.com/', '/about'), 'https://example.com/about/');
});
