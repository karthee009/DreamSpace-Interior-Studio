import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, orderTransitions } from '../src/utils/orderFlow.js';

test('valid forward transitions', () => {
  assert.ok(canTransition('PENDING', 'CONFIRMED'));
  assert.ok(canTransition('CONFIRMED', 'IN_PRODUCTION'));
  assert.ok(canTransition('IN_PRODUCTION', 'READY'));
  assert.ok(canTransition('READY', 'DELIVERED'));
  assert.ok(canTransition('DELIVERED', 'INSTALLED'));
});

test('cannot skip steps or go backwards', () => {
  assert.equal(canTransition('PENDING', 'READY'), false);
  assert.equal(canTransition('READY', 'CONFIRMED'), false);
});

test('final states are locked', () => {
  assert.deepEqual(orderTransitions.INSTALLED, []);
  assert.deepEqual(orderTransitions.CANCELLED, []);
  assert.equal(canTransition('DELIVERED', 'CANCELLED'), false);
});

test('unknown status is rejected safely', () => {
  assert.equal(canTransition('NOPE', 'CONFIRMED'), false);
});
