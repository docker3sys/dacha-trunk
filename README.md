# Багажник на дачу

Небольшая головоломка: поворачивайте и укладывайте вещи в багажник, чтобы подготовиться к поездке. В первой версии — 30 уровней, три главы, четыре цвета машины за игровые монеты и сохранение прогресса на устройстве.

[Играть в браузере](https://docker3sys.github.io/dacha-trunk/) · [Сообщить о проблеме](https://github.com/docker3sys/dacha-trunk/issues)

[Скачать APK 1.0.0 для Android](https://github.com/docker3sys/dacha-trunk/releases/download/v1.0.0/dacha-trunk-1.0.0.apk) · [Релиз и AAB](https://github.com/docker3sys/dacha-trunk/releases/tag/v1.0.0)

Первая подписанная версия работает без рекламы. Android 8.0 и новее. [Игровые скриншоты](docs/store-assets/) сняты с этой сборки.

## Версии

| Версия | Назначение |
| --- | --- |
| GitHub Pages | Игровая демонстрация; подсказки без настоящей рекламы и без рекламного дохода |
| Android debug | Установка и проверка на телефоне; демонстрационный блок Яндекса |
| Android release 1.0.0 | Первая подписанная сборка: реклама явно отключена через `YANDEX_ADS_DISABLED=true`; бонусы бесплатные, рекламного дохода нет |

Код Android включает Yandex Mobile Ads для будущего включения рекламы с наградой и RuStore Review для оценок. В сборках с рекламой награда выдаётся только после подтверждения рекламного SDK. Для заработка нужен собственный действующий рекламный блок и новая сборка с включённой рекламой. Публикация в GitHub не означает публикацию в RuStore: статус магазина зависит от загрузки сборки в Консоль и модерации.

## Локальный запуск

Нужен Node.js 24.

```sh
npm ci
npm run dev
```

Откройте адрес, который напечатает сервер. Статические модули нужно запускать через HTTP, а не двойным щелчком по `index.html`.

```sh
npm test
node --test docs/tooling-tests/rustore-upload.test.mjs
npm run build
```

Сборка сайта появляется в `dist/`. Workflow **Web checks and GitHub Pages** проверяет код и обновляет игровую страницу из ветки `main`. В настройках репозитория **Settings → Pages → Source** должен быть выбран **GitHub Actions**.

## Android

Нужны JDK 17+, Android SDK 36 и Build Tools 36.0.0.

```sh
npm run build
node scripts/sync-android.mjs
cd android
./gradlew assembleDebug
```

В Windows используйте `gradlew.bat`. APK появится в `android/app/build/outputs/apk/debug/`. Также тестовый APK доступен в артефактах workflow **Android APK** после успешного запуска.

Основной пакет — `ru.dachatrunk.game`, тестовый — `ru.dachatrunk.game.debug` (обе версии могут стоять рядом). Перед первой публикацией проверьте доступность основного пакета и выбранный ключ подписи; обновления должны сохранять идентичность приложения.

## Публикация и реклама

- [Подготовка RuStore, ключей и рекламного блока](docs/RUSTORE_SETUP.md).
- [Текст карточки игры](docs/STORE_LISTING.md).
- [Проверка перед выпуском](docs/RELEASE_CHECKLIST.md).
- [Политика конфиденциальности](https://docker3sys.github.io/dacha-trunk/public/privacy.html) · [исходный текст](docs/PRIVACY_POLICY.md).

Секреты, сертификаты подписи, пароли и приватный ключ RuStore не входят в репозиторий. Скрипт `scripts/rustore-upload.mjs` отправляет APK только в существующую версию-черновик и не запускает модерацию или публикацию.

## Шрифт и материалы

Шрифт Manrope хранится в `public/fonts/manrope.ttf` и загружается из файлов игры, без обращения к Google Fonts. Авторские права: Copyright 2018 The Manrope Project Authors. Лицензия — [SIL Open Font License 1.1](public/fonts/OFL.txt); её текст включён в сайт и Android-сборку. Иконка магазина: [PNG 512×512](public/icon-512.png), исходник — [SVG](public/icon.svg).
