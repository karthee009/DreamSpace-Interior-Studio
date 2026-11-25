import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEstimateLines, calculateTotals, round2 } from '../src/utils/estimate.js';

const products = [
  { id: 1, name: 'Sofa', price: '28000.00' },
  { id: 2, name: 'Coffee table', price: '6500.50' }
];

test('estimate lines use DB prices and compute line totals', () => {
  const lines = buildEstimateLines([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }], products);
  assert.equal(lines[0].lineTotal, 56000);
  assert.equal(lines[1].lineTotal, 19501.5);
  assert.equal(typeof lines[0].unitPrice, 'number');
});

test('unknown product throws', () => {
  assert.throws(() => buildEstimateLines([{ productId: 99, quantity: 1 }], products));
});

test('totals without tax', () => {
  const t = calculateTotals([{ quantity: 2, unitPrice: 1500 }, { quantity: 1, unitPrice: 250 }]);
  assert.deepEqual(t, { subtotal: 3250, taxAmount: 0, total: 3250 });
});

test('totals with 18% GST', () => {
  const t = calculateTotals([{ quantity: 1, unitPrice: 1000 }], 18);
  assert.deepEqual(t, { subtotal: 1000, taxAmount: 180, total: 1180 });
});

test('floating point rounding is handled', () => {
  assert.equal(round2(0.1 + 0.2), 0.3);
  const t = calculateTotals([{ quantity: 3, unitPrice: 0.1 }]);
  assert.equal(t.subtotal, 0.3);
});
