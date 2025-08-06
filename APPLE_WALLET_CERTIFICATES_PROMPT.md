# Промпт для решения проблемы с сертификатами Apple Wallet в проекте Loy

## 🎯 КОНТЕКСТ ПРОЕКТА

**Проект**: Loy - Digital Loyalty Platform (цифровые карты лояльности)
**Технологии**: Node.js + Express + TypeScript + MongoDB + Redis + passkit-generator
**Локация проекта**: `/Users/zakhar/Desktop/loy`

## ✅ ТЕКУЩИЙ СТАТУС (ВСЕ РАБОТАЕТ)

### Инфраструктура
- ✅ Сервер стабильно запускается: `node dist/index.js` (порт 3000)
- ✅ MongoDB и Redis подключены через Docker
- ✅ APNs провайдер инициализируется успешно
- ✅ TypeScript компиляция без ошибок: `npm run build`
- ✅ Все зависимости установлены (включая passkit-generator)

### API Endpoints (полностью рабочие)
- ✅ `GET /health` - статус сервиса
- ✅ `POST /api/v1/customers` - создание клиента
  ```json
  {"name": "Test User", "phone": "+79991234567", "email": "test@example.com"}
  ```
- ✅ `POST /api/v1/passes/apple` - генерация Apple Wallet карты
  ```json
  {"customerId": "CUSTOMER_ID"}
  ```

### Исправленные проблемы
- ✅ Отсутствующий модуль passkit-generator - установлен
- ✅ APNs провайдер - настроен на production: true
- ✅ API passkit-generator - исправлены все методы:
  - Убраны `pass.headerFields.add()` (не существует)
  - Убрано прямое присваивание read-only полей
  - Убраны поля из конструктора PKPass.from()
  - Используется правильная последовательность: создание → serialNumber → поля

## ⚠️ ЕДИНСТВЕННАЯ ПРОБЛЕМА: Сертификаты Apple Wallet

### Ошибка
```
[error]: Failed to generate Apple pass {
  "error": "Invalid PEM formatted message."
}
```

### Рабочий код (НЕ ТРОГАТЬ!)
**Файл**: `/src/services/passService.ts` (строки 28-65)
```typescript
const pass = await PKPass.from({
  model: path.resolve('templates', 'apple', 'loy.pass'),
  certificates: {
    wwdr: walletConfig.appleWwdrPath,
    signerCert: walletConfig.appleCertPath,
    signerKey: walletConfig.appleCertPath, // P12 file contains both cert and key
    signerKeyPassphrase: walletConfig.appleCertPassword,
  },
});

// Устанавливаем serialNumber и данные после создания объекта
pass.serialNumber = serialNumber;
pass.setBarcodes({
  message: customer.cardNumber || customer.id,
  format: 'PKBarcodeFormatQR',
  messageEncoding: 'iso-8859-1'
});

// Добавляем поля через методы
pass.headerFields.push({
  key: 'loy',
  label: 'LOYALTY',
  value: 'Loy Club'
});
// ... остальные поля
```

### Конфигурация сертификатов
**Файл**: `/src/config/wallet.ts`
```typescript
export const walletConfig = {
  appleWwdrPath: './certificates/wwdr-g4.pem',
  appleCertPath: './certificates/Certificates.p12',
  appleCertPassword: 'paPlr8seGgpB'
}
```

### Структура папки certificates
```
certificates/
├── wwdr-g4.pem          # WWDR сертификат Apple
├── Certificates.p12     # Сертификат для подписи (содержит cert + key)
├── cert-clean.pem       # Извлеченный сертификат (PEM)
├── key-pkcs8.pem        # Извлеченный ключ (PEM)
└── ...
```

## 🔍 ДИАГНОСТИКА ПРОБЛЕМЫ

### Предыдущие исправления (УЖЕ СДЕЛАНО)
- ✅ Переменные окружения исправлены
- ✅ Пути к сертификатам исправлены
- ✅ WWDR конвертирован из DER в PEM
- ✅ Извлечены cert.pem и key.pem из P12
- ✅ Очищены PEM файлы от Bag Attributes

### Возможные причины ошибки "Invalid PEM formatted message"
1. **P12 файл поврежден или неправильный пароль**
2. **Неправильная кодировка PEM файлов**
3. **Устаревший/недействительный сертификат**
4. **Проблемы с WWDR сертификатом**
5. **Несовместимость с библиотекой passkit-generator**

## 🎯 ЗАДАЧА

**НУЖНО**: Исправить ошибку "Invalid PEM formatted message" при генерации Apple Wallet карты

**ПОДХОДЫ**:
1. **Диагностировать текущие сертификаты** - проверить валидность, формат, пароли
2. **Попробовать альтернативные форматы** - использовать отдельные PEM файлы вместо P12
3. **Обновить сертификаты** - получить новые через Apple Developer Portal
4. **Тестировать пошагово** - создать минимальный тест для проверки сертификатов

## 🧪 ТЕСТОВЫЕ КОМАНДЫ

### Запуск и тестирование
```bash
cd /Users/zakhar/Desktop/loy

# 1. Сборка и запуск сервера
npm run build
node dist/index.js

# 2. В другом терминале - создание клиента
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "phone": "+79991234567", "email": "test@example.com"}'

# 3. Генерация карты (ЗДЕСЬ ОШИБКА)
curl -X POST http://localhost:3000/api/v1/passes/apple \
  -H "Content-Type: application/json" \
  -d '{"customerId": "CUSTOMER_ID_FROM_STEP_2"}' \
  --output test.pkpass

# 4. Проверка результата
file test.pkpass
# Ожидается: Zip archive data
# Получается: JSON data (ошибка)
```

### Проверка сертификатов
```bash
# Проверка P12 файла
openssl pkcs12 -info -in certificates/Certificates.p12 -passin pass:paPlr8seGgpB

# Проверка WWDR
openssl x509 -in certificates/wwdr-g4.pem -text -noout

# Проверка извлеченных PEM
openssl x509 -in certificates/cert-clean.pem -text -noout
openssl rsa -in certificates/key-pkcs8.pem -check
```

## 📋 ВАЖНЫЕ ФАЙЛЫ

**НЕ ИЗМЕНЯТЬ** (код работает правильно):
- `/src/services/passService.ts` - основной сервис генерации
- `/src/config/wallet.ts` - конфигурация путей
- `/src/app.ts` - роуты и middleware

**МОЖНО ИЗМЕНЯТЬ** (сертификаты и тесты):
- `/certificates/` - папка с сертификатами
- Создавать новые тестовые скрипты
- Обновлять сертификаты

## 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После исправления проблемы с сертификатами:
1. `curl` команда должна вернуть бинарный .pkpass файл
2. `file test.pkpass` должен показать "Zip archive data"
3. Файл должен открываться в Apple Wallet на iOS устройствах

---

**Начни с диагностики текущих сертификатов и предложи план решения проблемы "Invalid PEM formatted message".**
