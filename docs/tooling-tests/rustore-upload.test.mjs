import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs, createAuthRequest, buildPlan, uploadApk, main } from '../../scripts/rustore-upload.mjs';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const keyBase64 = keys.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');

test('auth signs exactly keyId + ISO timestamp with RSA SHA512', () => {
  const data = createAuthRequest('123', keyBase64, new Date('2026-10-28T08:00:00.000Z'));
  assert.equal(data.timestamp, '2026-10-28T08:00:00.000Z');
  assert.ok(verify('RSA-SHA512', Buffer.from(data.keyId + data.timestamp), keys.publicKey, Buffer.from(data.signature, 'base64')));
  assert.ok(!verify('RSA-SHA512', Buffer.from('different-message'), keys.publicKey, Buffer.from(data.signature, 'base64')));
});

test('PEM is accepted; malformed key and incomplete flags fail', () => {
  assert.ok(createAuthRequest('123', keys.privateKey.export({ type: 'pkcs8', format: 'pem' })).signature);
  assert.throws(() => createAuthRequest('123', 'not-a-key'), /Приватный ключ/);
  assert.throws(() => parseArgs(['--version-id']), /Нет значения/);
  assert.throws(() => parseArgs(['--publish']), /Неизвестный аргумент/);
});

test('upload calls only auth and existing-draft APK endpoint; token stays in header', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dacha-upload-test-'));
  try {
    const apk = join(dir, 'app-release.apk');
    await writeFile(apk, Buffer.concat([Buffer.from('PK\x03\x04'), Buffer.alloc(64)]));
    const plan = await buildPlan(parseArgs(['--apk', apk, '--version-id', '999'], {}));
    const requests = [];
    const result = await uploadApk(plan, { keyId: '123', privateKey: keyBase64, fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({ code: 'OK', body: requests.length === 1 ? { jwe: 'PRIVATE_TEST_TOKEN' } : {} }), { status: 200 });
    } });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, 'https://public-api.rustore.ru/public/auth/');
    assert.equal(requests[1].url, 'https://public-api.rustore.ru/public/v1/application/ru.dachatrunk.game/version/999/apk?isMainApk=true&servicesType=Unknown');
    assert.equal(requests[1].options.headers['Public-Token'], 'PRIVATE_TEST_TOKEN');
    assert.equal(requests[1].options.redirect, 'error');
    assert.equal(requests[1].options.body.get('file').size, 68);
    assert.equal(result.published, false);
    assert.equal(result.submittedForReview, false);
    assert.ok(!JSON.stringify(result).includes('PRIVATE_TEST_TOKEN'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('dry run uses no credentials or network', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dacha-dry-run-'));
  const oldFetch = globalThis.fetch;
  const oldLog = console.log;
  try {
    const apk = join(dir, 'app-release.apk');
    await writeFile(apk, Buffer.concat([Buffer.from('PK\x03\x04'), Buffer.alloc(64)]));
    globalThis.fetch = () => { throw new Error('Network must not be used'); };
    console.log = () => {};
    await main(['--apk', apk, '--version-id', '999', '--dry-run'], {});
    await assert.rejects(buildPlan(parseArgs(['--apk', apk, '--version-id', '../bad'], {})), /ID существующего/);
    await assert.rejects(buildPlan(parseArgs(['--apk', apk, '--version-id', '999', '--package', '../../bad'], {})), /Неверное имя/);
  } finally {
    globalThis.fetch = oldFetch;
    console.log = oldLog;
    await rm(dir, { recursive: true, force: true });
  }
});

test('API rejection does not echo token or private response data', async () => {
  await assert.rejects(uploadApk({ apk: 'unused' }, { keyId: '123', privateKey: keyBase64, fetchImpl: async () => new Response(JSON.stringify({ code: 'error', message: 'PRIVATE_SERVER_VALUE' }), { status: 401 }) }), error => {
    assert.match(error.message, /HTTP 401/);
    assert.ok(!error.message.includes('PRIVATE_SERVER_VALUE'));
    return true;
  });
});
