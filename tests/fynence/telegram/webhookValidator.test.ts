import test from 'node:test';
import assert from 'node:assert/strict';
import { WebhookSecurityValidator } from '../../../src/fynence/telegram/security/webhookValidator';

test('WebhookSecurityValidator: Webhook Token & Payload Validation', async (t) => {
  const validator = new WebhookSecurityValidator({
    botToken: 'token123',
    webhookSecret: 'super_secret_webhook_token_xyz',
    rateLimitPerMinute: 3,
    defaultFormat: 'both',
    defaultWeatherLocation: 'magelang',
  });

  await t.test('1. Validates matching secret token header', () => {
    assert.equal(validator.validateSecretToken('super_secret_webhook_token_xyz'), true);
  });

  await t.test('2. Rejects mismatched or missing secret token header', () => {
    assert.equal(validator.validateSecretToken('wrong_token'), false);
    assert.equal(validator.validateSecretToken(null), false);
    assert.equal(validator.validateSecretToken(undefined), false);
  });

  await t.test('3. Validates valid Telegram update structure', () => {
    const validUpdate = {
      update_id: 10001,
      message: {
        message_id: 1,
        chat: { id: 123 },
        text: '/daily',
      },
    };
    const res = validator.validateUpdatePayload(validUpdate);
    assert.equal(res.isValid, true);
  });

  await t.test('4. Rejects malformed or non-update payloads', () => {
    assert.equal(validator.validateUpdatePayload(null).isValid, false);
    assert.equal(validator.validateUpdatePayload({}).isValid, false);
    assert.equal(validator.validateUpdatePayload({ update_id: 'not-a-number' }).isValid, false);
    assert.equal(validator.validateUpdatePayload({ update_id: 100 }).isValid, false); // missing event type
  });
});
