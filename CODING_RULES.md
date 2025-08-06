# Правила разработки проекта Loy для Cascade

## Режим: Always Apply

## Технологический стек (ОБЯЗАТЕЛЬНО)
- **Backend**: Node.js + Express + TypeScript
- **БД**: MongoDB + Mongoose
- **Кэш**: Redis
- **Wallet**: node-passbook (Apple), Google Wallet API
- **Логи**: Winston

## Принципы кода
- **KISS** - простота превыше всего
- **TypeScript везде** - никакого JavaScript
- **Один файл = одна ответственность**
- **Обязательная валидация** всех входных данных
- **Try-catch для всех async операций**

## Структура файлов
```
src/
├── controllers/     # HTTP handlers
├── services/        # Бизнес-логика  
├── models/         # MongoDB схемы
├── types/          # TypeScript типы
├── utils/          # Утилиты
└── config/         # Конфигурация
```

## Правила именования
- Переменные/функции: `camelCase`
- Классы/типы: `PascalCase` 
- Константы: `UPPER_CASE`
- Файлы: `camelCase.ts`

## Обязательный код-стиль

### Функции (макс 50 строк)
```typescript
async function createCustomer(data: CustomerData): Promise<Customer> {
  // 1. Валидация
  validateCustomerData(data);
  
  // 2. Бизнес-логика
  const customer = await customerRepository.create(data);
  
  // 3. Логирование
  logger.info('Customer created', { customerId: customer.id });
  
  return customer;
}
```

### Типы (строгая типизация)
```typescript
// НЕ используй any, unknown, as
type CustomerData = {
  name: string;
  phone: string;
  email: string;
  balance?: number;
};
```

### Обработка ошибок
```typescript
try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  throw new ServiceError('OPERATION_FAILED');
}
```

### MongoDB модели
```typescript
const customerSchema = new Schema<ICustomer>({
  customerId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, minlength: 2, maxlength: 50 },
  balance: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
```

## Сервисы (Repository Pattern)
```typescript
class CustomerService {
  constructor(private repo: CustomerRepository) {}
  
  async register(data: CustomerData): Promise<Customer> {
    validateCustomerData(data);
    const customer = await this.repo.create(data);
    await walletService.generateCards(customer.id);
    return customer;
  }
}
```

## Wallet интеграции
```typescript
// Apple Wallet
async generateApplePass(customerId: string): Promise<Buffer> {
  const customer = await customerRepo.findById(customerId);
  return passbook.createPass({
    serialNumber: generateSerialNumber(),
    organizationName: process.env.BUSINESS_NAME,
    // ...
  });
}

// Google Wallet  
async createGoogleObject(customerId: string): Promise<string> {
  const objectId = `${ISSUER_ID}.${customerId}`;
  await googleWalletClient.loyaltyobject.insert({
    resource: { id: objectId, accountId: customerId }
  });
  return objectId;
}
```

## Конфигурация
```typescript
// Все секреты в .env
const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID!
};
```

## КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО
❌ Хардкодить секреты в коде  
❌ Использовать `any` или `unknown`  
❌ Функции больше 50 строк  
❌ Игнорировать валидацию данных  
❌ Коммитить без тестов  
❌ `console.log` вместо `logger`  
❌ Прямое обращение к БД из контроллеров

## Обязательные проверки
✅ TypeScript компилируется  
✅ Все тесты проходят  
✅ ESLint без ошибок  
✅ Все секреты в .env  
✅ Логирование добавлено
