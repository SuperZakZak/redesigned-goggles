# 🚀 Руководство по запуску и тестированию Loy API

## Предварительные требования

- Node.js 18+ 
- npm или yarn
- MongoDB (локально или через Docker)
- curl и jq для тестирования (опционально)

## Варианты запуска MongoDB

### Вариант 1: MongoDB через Homebrew (рекомендуется для Mac)

```bash
# Установка MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Запуск MongoDB
brew services start mongodb/brew/mongodb-community

# Проверка статуса
brew services list | grep mongodb
```

### Вариант 2: MongoDB через Docker

```bash
# Запуск Docker Desktop, затем:
docker run -d --name loy-mongodb -p 27017:27017 mongo:7.0

# Проверка статуса
docker ps | grep loy-mongodb
```

### Вариант 3: MongoDB Atlas (облачная БД)

1. Зарегистрируйтесь на [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Создайте бесплатный кластер
3. Получите строку подключения
4. Обновите `.env` файл:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/loy_dev
```

## Запуск приложения

### 1. Установка зависимостей

```bash
cd /Users/zakhar/Desktop/loy
npm install
```

### 2. Настройка переменных окружения

```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env при необходимости
nano .env
```

### 3. Сборка проекта

```bash
npm run build
```

### 4. Запуск приложения

```bash
# Запуск в production режиме
npm start

# Или в development режиме (если настроен)
npm run dev
```

## Тестирование API

### Автоматическое тестирование

```bash
# Сделайте скрипт исполняемым
chmod +x test-api.sh

# Запустите тестирование
./test-api.sh
```

### Ручное тестирование

#### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

#### 2. Создание клиента

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Иван",
    "lastName": "Петров",
    "phone": "+7-900-123-45-67",
    "registrationSource": "web"
  }'
```

#### 3. Получение списка клиентов

```bash
curl http://localhost:3000/api/customers
```

#### 4. Пополнение баланса

```bash
curl -X POST http://localhost:3000/api/customers/{CUSTOMER_ID}/credit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "description": "Тестовое пополнение",
    "source": "admin"
  }'
```

#### 5. Списание баланса

```bash
curl -X POST http://localhost:3000/api/customers/{CUSTOMER_ID}/debit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 30,
    "description": "Тестовая покупка",
    "source": "purchase"
  }'
```

## Доступные API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/health` | Health check |
| POST | `/api/customers` | Создание клиента |
| GET | `/api/customers` | Список клиентов |
| GET | `/api/customers/stats` | Статистика клиентов |
| GET | `/api/customers/:id` | Данные клиента |
| PUT | `/api/customers/:id` | Обновление клиента |
| POST | `/api/customers/:id/credit` | Пополнение баланса |
| POST | `/api/customers/:id/debit` | Списание баланса |
| GET | `/api/customers/:id/transactions` | История операций |

## Troubleshooting

### MongoDB не подключается

```bash
# Проверьте статус MongoDB
brew services list | grep mongodb
# или
docker ps | grep mongo

# Проверьте порт
lsof -i :27017
```

### Приложение не запускается

```bash
# Проверьте логи
tail -f logs/app.log

# Проверьте переменные окружения
cat .env
```

### API возвращает ошибки

```bash
# Проверьте статус приложения
curl http://localhost:3000/api/health

# Проверьте логи ошибок
tail -f logs/error.log
```

## Следующие шаги

После успешного тестирования API можно переходить к:

1. 🍎 Интеграции с Apple Wallet
2. 📱 Интеграции с Google Wallet  
3. 🔐 JWT аутентификации
4. 📧 Системе уведомлений
5. 🏪 POS интеграции
6. 📊 Admin панели

## Поддержка

При возникновении проблем:
1. Проверьте логи в папке `logs/`
2. Убедитесь, что MongoDB запущен
3. Проверьте переменные окружения в `.env`
4. Убедитесь, что порт 3000 свободен
