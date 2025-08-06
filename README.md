# Loy - Digital Loyalty Platform

Платформа для создания и управления цифровыми картами лояльности с интеграцией Apple Wallet и Google Wallet.

## 🚀 Особенности

- 📱 Интеграция с Apple Wallet и Google Wallet
- 🔄 Автоматические push-обновления баланса
- 👥 Полное управление клиентской базой
- 🔗 Интеграция с CRM/POS системами
- 🛡️ Безопасность и производительность
- 📊 Аналитика и отчетность

## 🛠️ Технологический стек

- **Backend**: Node.js + Express + TypeScript
- **База данных**: MongoDB + Mongoose
- **Кэш**: Redis
- **Wallet**: node-passbook (Apple), Google Wallet API
- **Логирование**: Winston
- **Контейнеризация**: Docker + Docker Compose
- **Прокси**: Nginx

## 📋 Требования

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker и Docker Compose (для разработки)
- MongoDB (если не используете Docker)
- Redis (если не используете Docker)

## 🚀 Быстрый старт

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd loy
npm install
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 3. Запуск с Docker (рекомендуется)

```bash
# Разработка
npm run docker:dev

# Продакшн
npm run docker:prod
```

### 4. Запуск без Docker

```bash
# Убедитесь, что MongoDB и Redis запущены локально
npm run dev
```

## 📁 Структура проекта

```
src/
├── controllers/     # HTTP обработчики
├── services/        # Бизнес-логика
├── models/         # MongoDB схемы
├── types/          # TypeScript типы
├── utils/          # Утилиты
├── config/         # Конфигурация
├── app.ts          # Express приложение
└── index.ts        # Точка входа
```

## 🔧 Доступные команды

```bash
# Разработка
npm run dev              # Запуск в режиме разработки
npm run build           # Сборка проекта
npm run start           # Запуск продакшн версии

# Тестирование
npm run test            # Запуск тестов
npm run test:watch      # Запуск тестов в watch режиме

# Линтинг и форматирование
npm run lint            # Проверка кода
npm run lint:fix        # Исправление ошибок линтинга
npm run format          # Форматирование кода

# Docker
npm run docker:dev      # Запуск dev окружения в Docker
npm run docker:prod     # Запуск prod окружения в Docker
```

## 🌐 API Endpoints

### Health Check
- `GET /health` - Проверка состояния сервиса

### Customers (планируется)
- `POST /api/v1/customers` - Создание клиента
- `GET /api/v1/customers` - Список клиентов
- `GET /api/v1/customers/:id` - Получение клиента
- `PUT /api/v1/customers/:id` - Обновление клиента

### Transactions (планируется)
- `POST /api/v1/transactions` - Создание транзакции
- `GET /api/v1/transactions` - История транзакций

### Wallets (планируется)
- `POST /api/v1/wallets/apple` - Создание Apple Wallet карты
- `POST /api/v1/wallets/google` - Создание Google Wallet карты

## 🖼️ Apple Wallet — Требования к ассетам

Все файлы должны храниться в директории `templates/apple/loy.pass/`.
Эти ассеты можно будет загружать и изменять через будущий веб-интерфейс админ-панели.

| Название файла | Обязателен | Размер (px) | Scale | Формат | Примечание |
| -------------- | ---------- | ----------- | ----- | ------- | ---------- |
| `icon.png`     | ✅         | 29 × 29     | @1x   | PNG     | Минимальный логотип, отображается в списке карт |
| `icon@2x.png`  | ✅         | 58 × 58     | @2x   | PNG     | Retina-версия `icon.png` |
| `logo.png`     | ✅         | ≤160 × 50   | @1x   | PNG     | Логотип на фронт-сайд карты, фон прозрачный |
| `logo@2x.png`  | ✅         | ≤320 × 100  | @2x   | PNG     | Retina-версия `logo.png` |
| `strip.png`    | ⬜         | 375 × 123   | @1x   | PNG     | Верхний баннер (при желании) |
| `strip@2x.png` | ⬜         | 750 × 246   | @2x   | PNG     | Retina-версия `strip.png` |
| `background.png` | ⬜       | 1800 × 2200 | @1x   | PNG     | Фоновое изображение |

Требования:
1. Цветовой профиль sRGB, 72 dpi.
2. Прозрачный фон (кроме `background.png`).
3. Без альфа-канала для `strip*` и `background.png` (Apple советует).
4. Размер файла < 1 MB.
5. Совпадение пропорций при масштабах `@1x/@2x`.

После загрузки новых ассетов через веб-интерфейс нужно перегенерировать `.pkpass` либо выполнить эндпоинт `POST /api/v1/passes/apple/:serialNumber/push`, чтобы устройства получили обновление.

---

## 🔒 Безопасность

- Helmet.js для заголовков безопасности
- CORS настройка
- Rate limiting
- JWT аутентификация
- Валидация входных данных
- Санитизация данных

## 📊 Мониторинг

- Winston для структурированного логирования
- Health check endpoint
- Graceful shutdown
- Error handling и reporting

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm run test

# Запуск тестов с покрытием
npm run test -- --coverage

# Запуск конкретного теста
npm run test -- --testNamePattern="Customer"
```

## 🐳 Docker

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up
```

## 📝 Логирование

Логи сохраняются в папке `logs/`:
- `app.log` - основные логи
- `error.log` - только ошибки
- `exceptions.log` - необработанные исключения
- `rejections.log` - необработанные Promise rejections

## 🤝 Разработка

1. Следуйте принципам KISS
2. Используйте TypeScript строго (без `any`)
3. Функции не более 50 строк
4. Обязательная валидация входных данных
5. Try-catch для всех async операций
6. Логирование важных операций

## 📄 Лицензия

MIT License

## 👥 Команда

Loy Development Team

---

## 🍏 Интеграция с Apple Wallet: Руководство и Решение

Этот раздел описывает финальное, рабочее решение для генерации `.pkpass` файлов для Apple Wallet, достигнутое после серии тестов и исправлений.

### 1. Выбор Библиотеки

Изначально использовалась библиотека `passkit-generator`, но она вызывала постоянные ошибки `Invalid PEM formatted message`. В итоге мы перешли на **`@walletpass/pass-js` v6.9.1** — современную, активно поддерживаемую библиотеку, которая решила все проблемы.

### 2. Подготовка Сертификатов (Ключевой этап)

Прямая работа с `.p12` файлами или базовыми `.pem` файлами оказалась ненадежной. Единственный стабильный метод — это подготовка сертификатов в несколько шагов. Все сертификаты должны находиться в директории `/certificates`.

**Шаг 1: Экспорт `.p12` файла**

- Из Связки Ключей (Keychain Access) на macOS экспортируйте ваш `Pass Type ID Certificate` в формате `.p12`. Установите пароль при экспорте и сохраните его в `.env` как `APPLE_WALLET_CERTIFICATE_PASSWORD`.

**Шаг 2: Извлечение сертификата (`cert.pem`)**

```bash
openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out certificates/cert.pem
```

**Шаг 3: Извлечение приватного ключа (`key.pem`)**

```bash
openssl pkcs12 -in Certificates.p12 -nocerts -out certificates/key.pem
```

**Шаг 4: Очистка ключа и сертификата от "Bag Attributes"**

OpenSSL добавляет в PEM-файлы метаданные (`Bag Attributes`), которые мешают библиотеке `@walletpass/pass-js`. Их нужно удалить вручную или с помощью скрипта, чтобы остались только секции `-----BEGIN CERTIFICATE-----` и `-----BEGIN PRIVATE KEY-----`.

- Создайте `cert-clean.pem` и `key-clean.pem` с очищенным содержимым.

**Шаг 5: Конвертация ключа в совместимый формат PKCS#8 (Решающий шаг)**

Внутренняя зависимость `node-forge` в `@walletpass/pass-js` лучше всего работает с ключами в формате PKCS#8. Это гарантирует максимальную совместимость.

```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in certificates/key-clean.pem -out certificates/key-pkcs8.pem
```

> **Важно**: Сертификат `Apple Worldwide Developer Relations Certification Authority` (WWDR) больше не нужен. Он уже включен в библиотеку `@walletpass/pass-js`.

### 3. Финальный Код для Генерации Карты

Используйте отдельные методы `setCertificate()` и `setPrivateKey()`. Это ключевое отличие от старых библиотек.

```javascript
// Пример из test-final-pass.js

const { Template } = require('@walletpass/pass-js');
const fs = require('fs').promises;
const path = require('path');

// 1. Пути к финальным, подготовленным файлам
const certPath = './certificates/cert-clean.pem';
const keyPath = './certificates/key-pkcs8.pem'; // Используем PKCS#8 ключ!

// 2. Чтение файлов
const certPem = await fs.readFile(certPath, 'utf-8');
const keyPem = await fs.readFile(keyPath, 'utf-8');

// 3. Создание и настройка шаблона
const template = new Template('generic');

// 4. Загрузка сертификата и ключа ОТДЕЛЬНЫМИ методами
template.setCertificate(certPem);
template.setPrivateKey(keyPem); // Пароль не нужен, так как ключ не зашифрован

// 5. Создание и наполнение карты
const pass = template.createPass({
  serialNumber: `loyalty-${Date.now()}`,
  description: 'Loy Digital Loyalty Card'
});

// ... (добавление полей, изображений и т.д.)

// 6. Генерация буфера и сохранение файла
const pkpass = await pass.asBuffer();
await fs.writeFile('loyalty-card.pkpass', pkpass);

console.log('Карта успешно сгенерирована!');
```

Это решение является надежным, безопасным и готовым к интеграции в основной сервис `passService.ts`.
