# Apple Wallet Integration - Текущий статус и документация

## 🎯 Проект: Loy - Digital Loyalty Platform
Платформа цифровых карт лояльности с интеграцией Apple Wallet и Google Wallet.

**Технологический стек:**
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Cache: Redis
- Apple Wallet: passkit-generator
- Google Wallet: Google Wallet API
- Logging: Winston

## ✅ ДОСТИГНУТЫЕ РЕЗУЛЬТАТЫ

### 1. Инфраструктура и сервер
- ✅ Сервер стабильно запускается на порту 3000
- ✅ MongoDB и Redis подключены через Docker
- ✅ APNs провайдер инициализируется успешно (production: true)
- ✅ Все зависимости установлены (включая passkit-generator)
- ✅ TypeScript компиляция проходит без ошибок

### 2. API Endpoints (рабочие)
- ✅ **Health Check**: `GET /health` - статус сервиса
- ✅ **Создание клиента**: `POST /api/v1/customers`
  ```json
  {
    "name": "Test User",
    "phone": "+79991234567", 
    "email": "test@example.com"
  }
  ```
  Ответ: `{ success: true, data: { customer: { id, name, phone, cardNumber, balance, ... } } }`

- ✅ **Генерация Apple Wallet карты**: `POST /api/v1/passes/apple`
  ```json
  { "customerId": "689258a11e385d089d1ee487" }
  ```
  Ожидаемый ответ: .pkpass файл (бинарный)
  Текущий ответ: `{ success: false, error: "Failed to generate Apple Wallet pass" }`

- ✅ **Резервный endpoint**: `POST /apple` (аналогично)

### 3. Исправленные проблемы
- ✅ Отсутствующий модуль `passkit-generator` - установлен
- ✅ APNs провайдер не инициализировался - исправлен на `production: true`
- ✅ Динамические импорты вызывали ошибки Mongoose - заменены на статические
- ✅ Неправильное использование API passkit-generator - исправлено:
  - Убраны `pass.headerFields.add()` и подобные методы
  - Убрано прямое присваивание read-only полей
  - Убраны поля из конструктора PKPass.from()
  - Используется правильная последовательность: создание объекта → установка serialNumber → добавление полей

### 4. Архитектура кода
**Два сервиса генерации Apple Wallet:**
1. `/src/services/pass.service.ts` - использует `@walletpass/pass-js`
2. `/src/services/passService.ts` - использует `passkit-generator` ⭐ (основной)

**Контроллеры и роуты:**
- `/src/controllers/pass.controller.ts`
- `/src/routes/passRoutes.ts`
- `/src/app.ts` - fallback route `/apple`

## ⚠️ ТЕКУЩАЯ ПРОБЛЕМА: Сертификаты Apple Wallet

### Описание ошибки
```
10:22:58 [error]: Failed to generate Apple pass {
  "error": "Invalid PEM formatted message."
}
```

### Контекст проблемы
1. **Код работает корректно** - все API исправлены, сервер стабилен
2. **Ошибка возникает на этапе подписи .pkpass файла**
3. **Проблема в сертификатах/ключах** для Apple Wallet

### Конфигурация сертификатов
**Файл**: `/src/config/wallet.ts`
```typescript
export const walletConfig = {
  appleWwdrPath: './certificates/wwdr-g4.pem',
  appleCertPath: './certificates/Certificates.p12', 
  appleCertPassword: 'paPlr8seGgpB'
}
```

**Структура папки certificates:**
```
certificates/
├── wwdr-g4.pem          # WWDR сертификат Apple
├── Certificates.p12     # Сертификат для подписи (содержит cert + key)
├── cert-clean.pem       # Извлеченный сертификат (PEM)
├── key-pkcs8.pem        # Извлеченный ключ (PEM)
└── ...
```

### Предыдущие попытки решения
Согласно памяти проекта, ранее были исправлены:
- ✅ Переменные окружения (приоритет APPLE_WALLET_* над APPLE_*)
- ✅ Пути к сертификатам (certificates/ вместо certs/)
- ✅ Конвертация WWDR из DER в PEM формат
- ✅ Извлечение cert.pem и key.pem из P12 файла
- ✅ Очистка PEM файлов от Bag Attributes

### Возможные причины текущей ошибки
1. **Неправильный формат P12 сертификата** или несовместимость с passkit-generator
2. **Неправильная кодировка PEM файлов**
3. **Устаревший или недействительный сертификат**
4. **Неправильный пароль для P12 файла**
5. **Проблемы с WWDR сертификатом**

## 🎯 СЛЕДУЮЩИЕ ШАГИ ДЛЯ РЕШЕНИЯ ПРОБЛЕМЫ С СЕРТИФИКАТАМИ

### 1. Диагностика текущих сертификатов
- Проверить валидность P12 файла и пароля
- Проверить формат WWDR сертификата
- Убедиться в актуальности сертификатов

### 2. Альтернативные подходы
- Попробовать использовать отдельные PEM файлы вместо P12
- Обновить сертификаты через Apple Developer Portal
- Рассмотреть альтернативные библиотеки (например, @walletpass/pass-js)

### 3. Тестирование
- Создать простой тестовый скрипт для проверки сертификатов
- Протестировать генерацию минимального .pkpass файла
- Валидировать сгенерированные файлы

## 📋 ТЕСТОВЫЕ КОМАНДЫ

### Запуск сервера
```bash
cd /Users/zakhar/Desktop/loy
npm run build
node dist/index.js
```

### Создание тестового клиента
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "phone": "+79991234567", "email": "test@example.com"}'
```

### Генерация Apple Wallet карты
```bash
curl -X POST http://localhost:3000/api/v1/passes/apple \
  -H "Content-Type: application/json" \
  -d '{"customerId": "CUSTOMER_ID_FROM_PREVIOUS_STEP"}' \
  --output test-wallet-pass.pkpass
```

### Проверка результата
```bash
file test-wallet-pass.pkpass  # Должен показать: Zip archive data
# Если показывает: JSON data - значит ошибка
```

## 🔧 КОНФИГУРАЦИЯ ОКРУЖЕНИЯ

### Переменные окружения (.env)
```
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
MONGODB_URI=mongodb://localhost:27017/loy_dev
REDIS_HOST=localhost
REDIS_PORT=6379

# Apple Wallet
APPLE_WALLET_WWDR_PATH=./certificates/wwdr-g4.pem
APPLE_WALLET_CERT_PATH=./certificates/Certificates.p12
APPLE_WALLET_CERT_PASSWORD=paPlr8seGgpB
```

### Docker сервисы
```bash
# MongoDB и Redis запущены в Docker
docker ps  # Проверить статус контейнеров
```

---

**Статус**: Готов к решению проблемы с сертификатами Apple Wallet
**Дата**: 2025-08-06
**Версия**: Итерация после исправления всех API проблем
