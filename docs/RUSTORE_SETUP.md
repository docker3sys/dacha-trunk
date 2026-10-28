# Android, рекламный блок и RuStore

Справочные страницы проверены 28 октября 2026 года. Репозиторий: `docker3sys/dacha-trunk`. Пакет игры: `ru.dachatrunk.game`.

В Android-проекте: minSDK 26 (Android 8.0), target/compile SDK 36, Gradle 8.14.3, Android Gradle Plugin 8.13.0, Yandex Mobile Ads 8.6.0 и RuStore Review 10.5.2. Debug использует отдельный пакет `ru.dachatrunk.game.debug`.

Первый release 1.0.0 выпускается с `YANDEX_ADS_DISABLED=true`: показ рекламы отключён, игровые бонусы бесплатные, рекламного дохода нет. Ниже отдельно описана настройка рекламной версии для будущего обновления.

## Первая сборка

1. Выполните `npm ci`, `npm test`, `npm run build` и `node scripts/sync-android.mjs`.
2. В каталоге `android` выполните `./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug`).
3. Установите APK на телефон. Это сборка с тестовой рекламой: она не приносит доход.

## Подключение рекламы

Добавьте Android-приложение в Рекламную сеть Яндекса, подтвердите права и создайте блок формата «Реклама с вознаграждением». После модерации используйте его идентификатор как `YANDEX_REWARDED_AD_UNIT_ID`. Сам ID рекламного блока не является паролем, но право получать выплаты и договор остаются у владельца аккаунта.

В debug используется `demo-rewarded-yandex`. Release не должен собираться с демонстрационным блоком. Для проверки интеграции применяйте тестовые объявления; запрос на закрытие рекламы, отсутствие сети или ошибка загрузки не должны выдавать награду.

В этой сборке удалено разрешение `AD_ID`, отключены location tracking и персонализация через `setUserConsent(false)`. Yandex SDK инициализируется при запросе рекламы. Его технические зависимости, включая AppMetrica, всё равно необходимо учесть в декларации данных: отключение персонализации не означает отсутствие любых сетевых данных.

[Интеграция Yandex Mobile Ads](https://ads.yandex.com/helpcenter/ru/dev/android/quick-start) · [Платформа РСЯ для приложений](https://partner.yandex.ru/apps)

## Подпись release

Для проекта уже подготовлен собственный ключ подписи и отдельная приватная резервная копия вне репозитория. Сохраните этот ключ: все обновления должны подписываться им же. Если собираете отдельный новый проект, создайте свой keystore через Android Studio → Build → Generate Signed Bundle / APK. Для локальной сборки задайте переменные окружения:

| Переменная | Значение |
| --- | --- |
| `ANDROID_KEYSTORE_PATH` | Абсолютный путь к собственному keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Пароль keystore |
| `ANDROID_KEY_ALIAS` | Имя ключа |
| `ANDROID_KEY_PASSWORD` | Пароль ключа |
| `YANDEX_REWARDED_AD_UNIT_ID` | Производственный ID rewarded-блока; не нужен при отключённой рекламе |

Если собственный рекламный блок ещё не создан, можно выпустить подписанную сборку без рекламы: установите `YANDEX_ADS_DISABLED=true`. В этом режиме реклама не инициализируется и не приносит доход. Условие не отключает обязательную подпись release. Перед выпуском отразите фактический режим рекламы в карточке и политике.

Затем выполните `./gradlew assembleRelease bundleRelease` в `android`. APK и AAB появятся в соответствующих каталогах `app/build/outputs/`.

Для GitHub Actions создайте environment `android-release`. Добавьте secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Первое значение — Base64 содержимого вашего keystore. Добавьте variable `YANDEX_REWARDED_AD_UNIT_ID` для рекламной версии. Запустите **Android APK → Run workflow → release**; для версии без рекламы включите `ads_disabled`. Workflow соберёт артефакт и не отправит его в магазин.

## Первая публикация в Консоли

В [RuStore Консоли](https://console.rustore.ru/) создайте игру и загрузите подписанный APK. Для обновлений сохраняйте пакет и сертификат, повышайте `versionCode`. Перенесите описание из `STORE_LISTING.md`, укажите контакт и возрастную категорию по анкете, проверьте декларацию данных по итоговому APK и рекламному SDK.

Подготовьте иконку PNG/JPG 512×512 (до 3 МБ) и минимум три настоящих скриншота телефона. Для первой версии удобнее APK: AAB требует отдельной настройки ключей в RuStore. Отправка на модерацию выполняется отдельно после заполнения карточки.

Готовая иконка — `public/icon-512.png`. Ссылка на политику для карточки: https://docker3sys.github.io/dacha-trunk/public/privacy.html. Текст в `docs/STORE_LISTING.md` соответствует первому выпуску без рекламы. При включении рекламы обновите карточку, декларацию данных и политику до публикации новой сборки.

[Требования к публикации](https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication)

## Оценки RuStore

SDK отзывов станет доступен после публикации. На телефоне нужны актуальный RuStore и вход пользователя в его аккаунт. Зарегистрируйте пакет и отпечаток сертификата в разделе Консоли **Push-уведомления → Проекты** согласно документации SDK. Отсутствие RuStore или отказ от отзыва не ограничивают игру; за оценки награды не выдаются.

[Документация SDK оценок](https://www.rustore.ru/help/sdk/reviews-ratings)

## Загрузка APK через API в существующий черновик

Для первого выпуска используйте Консоль. API создания версии имеет ограничения; этот проект специально не создаёт и не удаляет черновики. Скрипт загружает файл только в указанный `versionId`.

В Консоли создайте ключ API с доступом к нужному приложению и методу загрузки APK. Нужны `RUSTORE_KEY_ID` и приватный ключ, который выдаст RuStore. Приватный ключ сохраните за пределами репозитория. Не отправляйте его в Issue, README или чат.

Переменные окружения:

| Переменная | Назначение |
| --- | --- |
| `RUSTORE_KEY_ID` | ID ключа из Консоли |
| `RUSTORE_PRIVATE_KEY` | Путь к файлу с ключом, либо сам Base64/PEM ключ в защищённом окружении |
| `RUSTORE_VERSION_ID` | ID уже созданного черновика |
| `RUSTORE_PACKAGE_NAME` | Необязательно; по умолчанию `ru.dachatrunk.game` |

```sh
node scripts/rustore-upload.mjs --apk android/app/build/outputs/apk/release/app-release.apk --version-id 123456 --dry-run
node scripts/rustore-upload.mjs --apk android/app/build/outputs/apk/release/app-release.apk --version-id 123456
```

Замените `123456` реальным ID. `--dry-run` проверяет локальный файл и показывает план без обращения к API. При обычном запуске скрипт получает краткоживущий токен, отправляет APK и печатает итог без ключей и токена. Он не отправляет версию на модерацию и не публикует её. Если соединение оборвалось после отправки файла, сначала проверьте версию в Консоли/API и только потом решайте, нужно ли повторять загрузку.

RuStore предупреждает: файл, загруженный через API, может не отображаться в веб-интерфейсе до отправки черновика на модерацию. Это не повод повторно загружать файл.

[Авторизация API](https://www.rustore.ru/help/work-with-rustore-api/api-authorization-token) · [Загрузка APK](https://www.rustore.ru/help/work-with-rustore-api/api-upload-publication-app/apk-file-upload/file-upload-apk) · [Ограничения создания черновика](https://www.rustore.ru/help/work-with-rustore-api/api-upload-publication-app/create-draft-version)
