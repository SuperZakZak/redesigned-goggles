# 🚀 Loy Project - Development Prompt

## Контекст проекта

**Проект:** Loy - цифровая платформа лояльности с интеграцией Apple Wallet и Google Wallet
**Локация:** `/Users/zakhar/Desktop/loy`
**Статус:** Итерация 2 завершена, готов к Итерации 3

## Техническое состояние

### ✅ Что уже реализовано (Итерации 1-2):

**Инфраструктура:**
- Node.js + Express + TypeScript
- MongoDB (Mongoose) + Redis
- Docker конфигурация
- Winston логирование
- Jest тестирование
- ESLint + Prettier

**Database & Models:**
- Customer model с автогенерацией cardNumber
- Transaction model для истории операций  
- CardTemplate model для дизайна карт
- Индексы и валидация настроены

**Repository Layer:**
- BaseRepository с CRUD и пагинацией
- CustomerRepository с поиском и фильтрацией
- TransactionRepository для истории

**Customer API (полностью работает):**
- POST `/api/customers` - создание клиентов
- GET `/api/customers` - список с пагинацией
- GET `/api/customers/:id` - данные клиента
- PUT `/api/customers/:id` - обновление
- POST `/api/customers/:id/credit` - пополнение баланса
- POST `/api/customers/:id/debit` - списание баланса
- GET `/api/customers/:id/transactions` - история
- GET `/api/customers/stats` - статистика
- GET `/api/health` - health check

**Validation & Security:**
- Joi схемы валидации
- Rate limiting
- Error handling middleware
- Логирование всех операций

### 🎯 Следующие задачи (Итерация 3):

**Приоритет 1: Apple Wallet интеграция**
- Установка `node-passbook`
- Создание PassService для генерации .pkpass файлов
- API endpoints для создания и обновления пассов
- Webhook для push уведомлений Apple

**Приоритет 2: Google Wallet интеграция**
- Настройка Google Wallet API
- Создание GoogleWalletService
- JWT токены для Google Wallet
- API endpoints для создания и обновления карт

**Приоритет 3: Authentication & Authorization**
- JWT аутентификация
- Middleware для защиты API
- Роли пользователей (admin, customer)
- Refresh токены

**Приоритет 4: Notifications**
- SMS уведомления (Twilio/SMS.ru)
- Email уведомления
- Push уведомления в кошельки

## Архитектурные принципы

**ОБЯЗАТЕЛЬНО соблюдать:**
- KISS принцип
- TypeScript everywhere (no 'any')
- Single Responsibility
- Max 50 lines per function
- Repository pattern
- Валидация всех входных данных
- Try-catch для async операций
- Логирование через Winston

**Структура файлов:**
```
src/
├── controllers/     # HTTP handlers
├── services/        # Business logic
├── models/          # MongoDB schemas  
├── types/           # TypeScript types
├── utils/           # Utility functions
├── config/          # Configuration
└── routes/          # API routes
```

## Запуск для разработки

```bash
# Запуск MongoDB и Redis
docker run -d --name loy-mongodb -p 27017:27017 mongo:7.0
docker run -d --name loy-redis -p 6379:6379 redis:7.2-alpine

# Установка зависимостей
npm install

# Сборка
npm run build

# Запуск
npm start
```

## Известные проблемы

1. **Дублирующиеся индексы Mongoose** - предупреждения в логах (не критично)
2. **API_PREFIX в .env** - указан `/api/v1`, но используется `/api`
3. **curl зависает** - возможно проблема с middleware или маршрутизацией

## Текущие переменные окружения

```bash
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1
MONGODB_URI=mongodb://localhost:27017/loy_dev
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## Полезные команды

```bash
# Проверка здоровья API
curl http://localhost:3000/api/health

# Создание клиента
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "firstName": "Иван", "lastName": "Петров", "phone": "+7-900-123-45-67", "registrationSource": "web"}'

# Список клиентов
curl http://localhost:3000/api/customers
```

## Следующие шаги

1. Выберите приоритетную задачу из Итерации 3
2. Изучите документацию соответствующего API (Apple Wallet/Google Wallet)
3. Создайте соответствующие модели и сервисы
4. Реализуйте API endpoints
5. Добавьте тесты
6. Обновите документацию

**Удачи в разработке! 🚀**
