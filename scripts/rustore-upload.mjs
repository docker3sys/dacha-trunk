#!/usr/bin/env node
/**
 * Explicit APK upload to an EXISTING RuStore draft. Never creates, replaces,
 * submits or publishes a version. Auth/token values are never logged.
 * API docs are linked in docs/RUSTORE_SETUP.md.
 */
import { createHash, createPrivateKey, sign } from 'node:crypto';
import { createReadStream, openAsBlob } from 'node:fs';
import { readFile, stat, open } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_ORIGIN = 'https://public-api.rustore.ru';
const DEFAULT_PACKAGE = 'ru.dachatrunk.game';

export function parseArgs(args, env = process.env) {
  const result = {
    packageName: env.RUSTORE_PACKAGE_NAME || DEFAULT_PACKAGE,
    versionId: env.RUSTORE_VERSION_ID || '',
    apk: env.RUSTORE_APK_PATH || '',
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--help' || arg === '-h') result.help = true;
    else if (['--apk', '--version-id', '--package'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Нет значения для ${arg}.`);
      result[arg === '--apk' ? 'apk' : arg === '--version-id' ? 'versionId' : 'packageName'] = value;
    } else throw new Error(`Неизвестный аргумент: ${arg}. Используйте --help.`);
  }
  return result;
}

export function createAuthRequest(keyId, keyContent, now = new Date()) {
  if (!keyId || typeof keyId !== 'string' || !keyId.trim()) throw new Error('Не задан RUSTORE_KEY_ID.');
  const source = String(keyContent).trim().replace(/\\n/g, '\n');
  let key;
  try {
    if (source.includes('-----BEGIN')) key = createPrivateKey(source);
    else {
      const decoded = Buffer.from(source.replace(/\s/g, ''), 'base64');
      key = decoded.toString('utf8').startsWith('-----BEGIN')
        ? createPrivateKey(decoded)
        : createPrivateKey({ key: decoded, format: 'der', type: 'pkcs8' });
    }
  } catch {
    throw new Error('Приватный ключ RuStore не прочитан. Используйте Base64 PKCS8 из Консоли или PEM.');
  }
  if (key.asymmetricKeyType !== 'rsa') throw new Error('RuStore ожидает приватный RSA-ключ.');
  const timestamp = now.toISOString();
  const signature = sign('RSA-SHA512', Buffer.from(keyId + timestamp), key).toString('base64');
  return { keyId, timestamp, signature };
}

export async function readPrivateKey(value) {
  if (!value) throw new Error('Не задан RUSTORE_PRIVATE_KEY: путь к файлу либо содержимое ключа.');
  if (!value.includes('\n') && value.length < 4096) {
    try {
      if ((await stat(value)).isFile()) return await readFile(value, 'utf8');
    } catch (error) {
      if (!['ENOENT', 'ENAMETOOLONG', 'EINVAL', 'ENOTDIR'].includes(error.code)) {
        throw new Error('Не удалось прочитать файл приватного ключа. Проверьте путь и права доступа.');
      }
    }
  }
  return value;
}

export async function buildPlan(options) {
  if (!/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+$/.test(options.packageName)) {
    throw new Error('Неверное имя Android-пакета.');
  }
  if (!/^[1-9]\d*$/.test(String(options.versionId))) {
    throw new Error('Укажите ID существующего черновика через --version-id или RUSTORE_VERSION_ID.');
  }
  if (!options.apk) throw new Error('Укажите APK через --apk или RUSTORE_APK_PATH.');
  const apk = resolve(options.apk);
  if (extname(apk).toLowerCase() !== '.apk') throw new Error('Поддерживается только файл .apk.');
  const metadata = await stat(apk);
  if (!metadata.isFile() || metadata.size < 22 || metadata.size > 5 * 1024 ** 3) {
    throw new Error('APK должен быть обычным непустым файлом размером не более 5 ГиБ.');
  }
  const file = await open(apk, 'r');
  try {
    const header = Buffer.alloc(4);
    await file.read(header, 0, 4, 0);
    if (!header.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) throw new Error('Файл не похож на APK/ZIP.');
  } finally { await file.close(); }
  const hash = createHash('sha256');
  for await (const part of createReadStream(apk)) hash.update(part);
  return {
    apk,
    filename: basename(apk),
    sizeBytes: metadata.size,
    sha256: hash.digest('hex'),
    packageName: options.packageName,
    versionId: String(options.versionId),
    action: 'upload-apk-to-existing-draft',
    submitsForReview: false,
    publishes: false,
  };
}

async function requestJson(path, options, fetchImpl, stage) {
  const response = await fetchImpl(`${API_ORIGIN}${path}`, {
    ...options,
    redirect: 'error',
    signal: AbortSignal.timeout(stage === 'upload' ? 180_000 : 30_000),
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error(`RuStore ${stage}: ответ не JSON (HTTP ${response.status}).`); }
  if (!response.ok || data.code !== 'OK') {
    // Do not echo an arbitrary response body: it may contain tokens or account data.
    throw new Error(`RuStore ${stage}: запрос отклонён (HTTP ${response.status}, code ${String(data.code || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0,40)}). Проверьте доступ ключа и состояние черновика.`);
  }
  return data.body;
}

export async function uploadApk(plan, { keyId, privateKey, fetchImpl = fetch } = {}) {
  const authRequest = createAuthRequest(keyId, privateKey);
  const auth = await requestJson('/public/auth/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(authRequest),
  }, fetchImpl, 'auth');
  if (!auth?.jwe || typeof auth.jwe !== 'string') throw new Error('RuStore не вернул токен доступа.');
  const body = new FormData();
  body.append('file', await openAsBlob(plan.apk, { type: 'application/vnd.android.package-archive' }), plan.filename);
  const path = `/public/v1/application/${encodeURIComponent(plan.packageName)}/version/${encodeURIComponent(plan.versionId)}/apk?isMainApk=true&servicesType=Unknown`;
  await requestJson(path, {
    method: 'POST',
    headers: { 'Public-Token': auth.jwe, Accept: 'application/json' },
    body,
  }, fetchImpl, 'upload');
  return { uploaded: true, packageName: plan.packageName, versionId: plan.versionId, sha256: plan.sha256, submittedForReview: false, published: false };
}

export async function main(args = process.argv.slice(2), env = process.env) {
  const options = parseArgs(args, env);
  if (options.help) {
    console.log('RuStore: загрузка APK в существующий черновик\n\nnode scripts/rustore-upload.mjs --apk app-release.apk --version-id 123456 [--package ru.dachatrunk.game] [--dry-run]\n\nНужны RUSTORE_KEY_ID и RUSTORE_PRIVATE_KEY (путь или содержимое).\n--dry-run не обращается к сети и не требует ключей.\nСкрипт не создаёт черновики, не отправляет на модерацию и не публикует приложение.');
    return;
  }
  const plan = await buildPlan(options);
  console.log(JSON.stringify({ ...plan, apk: plan.filename, dryRun: options.dryRun }, null, 2));
  if (options.dryRun) return;
  const privateKey = await readPrivateKey(env.RUSTORE_PRIVATE_KEY);
  const result = await uploadApk(plan, { keyId: env.RUSTORE_KEY_ID, privateKey });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    // Only errors generated above are informative; network failures are kept generic.
    const safe = /^(RuStore|Не |Нет |Неверное|Укажите|Поддерживается|APK |Файл |Приватный)/.test(error.message)
      ? error.message : 'Операция не завершена. Проверьте файл, соединение и состояние черновика перед повторной загрузкой.';
    console.error(safe);
    process.exitCode = 1;
  });
}
