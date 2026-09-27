import test from 'node:test';
import assert from 'node:assert/strict';
import { TelegramCallbackParser } from '../../../src/fynence/telegram/parser/callbackParser';

test('TelegramCallbackParser: Callback Query Parsing', async (t) => {
  const parser = new TelegramCallbackParser();

  await t.test('1. Parses edition callbacks', () => {
    assert.deepEqual(parser.parse('edition:daily'), { type: 'edition', edition: 'daily' });
    assert.deepEqual(parser.parse('edition:finance'), { type: 'edition', edition: 'finance' });
    assert.deepEqual(parser.parse('edition:market'), { type: 'edition', edition: 'market' });
    assert.deepEqual(parser.parse('edition:weather'), { type: 'edition', edition: 'weather' });
  });

  await t.test('2. Parses format selection callbacks', () => {
    assert.deepEqual(parser.parse('format:image:daily'), { type: 'format', format: 'image', edition: 'daily' });
    assert.deepEqual(parser.parse('format:pdf:finance'), { type: 'format', format: 'pdf', edition: 'finance' });
    assert.deepEqual(parser.parse('format:both:daily'), { type: 'format', format: 'both', edition: 'daily' });
  });

  await t.test('3. Parses action callbacks', () => {
    assert.deepEqual(parser.parse('action:help'), { type: 'action', action: 'help' });
    assert.deepEqual(parser.parse('action:custom'), { type: 'action', action: 'custom' });
    assert.deepEqual(parser.parse('action:sources'), { type: 'action', action: 'sources' });
  });

  await t.test('4. Rejects invalid or untrusted payloads', () => {
    assert.equal(parser.parse('malicious:command').type, 'unknown');
    assert.equal(parser.parse('edition:unsupported').type, 'unknown');
    assert.equal(parser.parse(null as any).type, 'unknown');
  });
});
