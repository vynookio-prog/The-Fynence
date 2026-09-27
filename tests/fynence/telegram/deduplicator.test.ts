import test from 'node:test';
import assert from 'node:assert/strict';
import { TelegramRequestDeduplicator } from '../../../src/fynence/telegram/security/deduplicator';

test('TelegramRequestDeduplicator: Duplicate Request Protection', async (t) => {
  await t.test('1. Prevents duplicate in-flight requests', () => {
    const deduplicator = new TelegramRequestDeduplicator(15_000);
    const chatId = 999;

    assert.equal(deduplicator.check(chatId, 'daily', ['news']).isDuplicate, false);

    deduplicator.startRequest(chatId, 'daily', ['news']);

    const duplicateCheck = deduplicator.check(chatId, 'daily', ['news']);
    assert.equal(duplicateCheck.isDuplicate, true);
    assert.equal(duplicateCheck.isInFlight, true);
    assert.ok(duplicateCheck.message?.includes('already being processed'));
  });

  await t.test('2. Protects against duplicate requests within debounce window', () => {
    const deduplicator = new TelegramRequestDeduplicator(10_000);
    const chatId = 999;

    deduplicator.startRequest(chatId, 'finance_economy', ['finance', 'economy']);
    deduplicator.completeRequest(chatId, 'finance_economy', ['finance', 'economy']);

    const check = deduplicator.check(chatId, 'finance_economy', ['finance', 'economy']);
    assert.equal(check.isDuplicate, true);
    assert.equal(check.isInFlight, false);
    assert.ok(check.message?.includes('just generated'));
  });

  await t.test('3. Allows different edition types or sections concurrently', () => {
    const deduplicator = new TelegramRequestDeduplicator(10_000);
    const chatId = 999;

    deduplicator.startRequest(chatId, 'daily', ['news']);
    const checkMarket = deduplicator.check(chatId, 'market', ['forex']);
    assert.equal(checkMarket.isDuplicate, false);
  });
});
