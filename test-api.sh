#!/bin/bash

# Loy API Testing Script
# Убедитесь, что MongoDB запущен и приложение работает на порту 3000

API_BASE="http://localhost:3000/api"

echo "🚀 Тестирование Loy Customer API"
echo "================================"

# Проверка health check
echo "1. Health Check:"
curl -s "$API_BASE/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Создание клиента
echo "2. Создание клиента:"
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_BASE/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Иван",
    "lastName": "Петров",
    "phone": "+7-900-123-45-67",
    "registrationSource": "web"
  }')

echo "$CUSTOMER_RESPONSE" | jq '.' || echo "❌ Customer creation failed"

# Извлечение ID клиента
CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.data.customer.id' 2>/dev/null)
echo "Customer ID: $CUSTOMER_ID"
echo ""

if [ "$CUSTOMER_ID" != "null" ] && [ "$CUSTOMER_ID" != "" ]; then
  # Получение данных клиента
  echo "3. Получение данных клиента:"
  curl -s "$API_BASE/customers/$CUSTOMER_ID" | jq '.' || echo "❌ Get customer failed"
  echo ""

  # Пополнение баланса
  echo "4. Пополнение баланса на 100 рублей:"
  curl -s -X POST "$API_BASE/customers/$CUSTOMER_ID/credit" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 100,
      "description": "Тестовое пополнение",
      "source": "admin"
    }' | jq '.' || echo "❌ Credit balance failed"
  echo ""

  # Списание баланса
  echo "5. Списание 30 рублей:"
  curl -s -X POST "$API_BASE/customers/$CUSTOMER_ID/debit" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 30,
      "description": "Тестовая покупка",
      "source": "purchase"
    }' | jq '.' || echo "❌ Debit balance failed"
  echo ""

  # История транзакций
  echo "6. История транзакций:"
  curl -s "$API_BASE/customers/$CUSTOMER_ID/transactions" | jq '.' || echo "❌ Get transactions failed"
  echo ""
fi

# Список клиентов
echo "7. Список клиентов:"
curl -s "$API_BASE/customers?limit=5" | jq '.' || echo "❌ Get customers failed"
echo ""

# Статистика
echo "8. Статистика клиентов:"
curl -s "$API_BASE/customers/stats" | jq '.' || echo "❌ Get stats failed"
echo ""

echo "✅ Тестирование завершено!"
echo ""
echo "💡 Для повторного запуска:"
echo "   chmod +x test-api.sh && ./test-api.sh"
