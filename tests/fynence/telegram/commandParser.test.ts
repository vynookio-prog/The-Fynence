import test from 'node:test';
import assert from 'node:assert/strict';
import { TelegramCommandParser } from '../../../src/fynence/telegram/parser/commandParser';

test('TelegramCommandParser: Command & Argument Parsing', async (t) => {
  const parser = new TelegramCommandParser();

  await t.test('1. Parses /start command case-insensitively and with bot suffix', () => {
    const res1 = parser.parse('/start');
    assert.equal(res1.command, 'start');

    const res2 = parser.parse('/START@TheFynenceBot');
    assert.equal(res2.command, 'start');
  });

  await t.test('2. Parses /help command', () => {
    const res = parser.parse('/help');
    assert.equal(res.command, 'help');
  });

  await t.test('3. Parses /daily command with default daily sections', () => {
    const res = parser.parse('/daily');
    assert.equal(res.command, 'daily');
    assert.ok(res.sections.includes('daily_news'));
    assert.ok(res.sections.includes('finance'));
    assert.ok(res.sections.includes('markets'));
    assert.ok(res.sections.includes('weather'));
  });

  await t.test('4. Parses /finance command with macro finance sections', () => {
    const res = parser.parse('/FINANCE');
    assert.equal(res.command, 'finance');
    assert.ok(res.sections.includes('finance'));
    assert.ok(res.sections.includes('economy'));
    assert.ok(res.sections.includes('markets'));
  });

  await t.test('5. Parses /market command with market & asset sections', () => {
    const res = parser.parse('/market');
    assert.equal(res.command, 'market');
    assert.ok(res.sections.includes('markets'));
    assert.ok(res.sections.includes('forex'));
    assert.ok(res.sections.includes('crypto'));
  });

  await t.test('6. Parses /weather command', () => {
    const res = parser.parse('/weather');
    assert.equal(res.command, 'weather');
    assert.ok(res.sections.includes('weather'));
  });

  await t.test('7. Parses /newspaper with custom sections and aliases', () => {
    const res = parser.parse('/newspaper finance economy markets');
    assert.equal(res.command, 'newspaper');
    assert.deepEqual(res.sections, ['finance', 'economy', 'markets']);
    assert.equal(res.unsupportedSections.length, 0);

    const res2 = parser.parse('/newspaper market cuaca fin');
    assert.deepEqual(res2.sections, ['markets', 'weather', 'finance']);
  });

  await t.test('8. Flags invalid/unsupported sections properly', () => {
    const res = parser.parse('/newspaper finance sports politics');
    assert.equal(res.command, 'newspaper');
    assert.deepEqual(res.sections, ['finance']);
    assert.deepEqual(res.unsupportedSections, ['sports', 'politics']);
  });

  await t.test('9. Handles unrecognized commands gracefully', () => {
    const res = parser.parse('/unknowncommand');
    assert.equal(res.command, 'unknown');
  });
});
