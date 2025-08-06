const { PKPass } = require('passkit-generator');
const path = require('path');
const fs = require('fs');

console.log('🧪 ТЕСТИРОВАНИЕ РАЗЛИЧНЫХ КОНФИГУРАЦИЙ СЕРТИФИКАТОВ\n');

// Различные конфигурации для тестирования
const configs = [
  {
    name: 'Конфигурация 1: P12 + WWDR (текущая)',
    certificates: {
      wwdr: './certificates/wwdr-g4.pem',
      signerCert: './certificates/Certificates.p12',
      signerKey: './certificates/Certificates.p12',
      signerKeyPassphrase: 'paPlr8seGgpB',
    }
  },
  {
    name: 'Конфигурация 2: Отдельные PEM файлы',
    certificates: {
      wwdr: './certificates/wwdr-g4.pem',
      signerCert: './certificates/cert-clean.pem',
      signerKey: './certificates/key-pkcs8.pem',
    }
  },
  {
    name: 'Конфигурация 3: Альтернативный WWDR',
    certificates: {
      wwdr: './certificates/wwdr.pem',
      signerCert: './certificates/Certificates.p12',
      signerKey: './certificates/Certificates.p12',
      signerKeyPassphrase: 'paPlr8seGgpB',
    }
  },
  {
    name: 'Конфигурация 4: Plain key вместо PKCS8',
    certificates: {
      wwdr: './certificates/wwdr-g4.pem',
      signerCert: './certificates/cert-clean.pem',
      signerKey: './certificates/key-plain.pem',
    }
  }
];

async function testConfiguration(config) {
  console.log(`\n📋 Тестируем: ${config.name}`);
  console.log('='.repeat(config.name.length + 15));
  
  // Проверяем существование всех файлов
  const missingFiles = [];
  for (const [key, filePath] of Object.entries(config.certificates)) {
    if (key !== 'signerKeyPassphrase' && !fs.existsSync(filePath)) {
      missingFiles.push(`${key}: ${filePath}`);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log('❌ Отсутствуют файлы:');
    missingFiles.forEach(file => console.log(`   ${file}`));
    return false;
  }
  
  console.log('✅ Все файлы найдены');
  
  try {
    // Пытаемся создать PKPass с минимальными данными
    const pass = await PKPass.from({
      model: path.resolve('templates', 'apple', 'loy.pass'),
      certificates: config.certificates,
    });
    
    console.log('✅ PKPass объект создан успешно');
    
    // Пытаемся установить базовые данные
    pass.serialNumber = 'TEST-' + Date.now();
    pass.setBarcodes({
      message: 'TEST123',
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1'
    });
    
    console.log('✅ Данные установлены успешно');
    
    // Пытаемся сгенерировать .pkpass файл
    const buffer = pass.getAsBuffer();
    
    if (buffer && buffer.length > 0) {
      console.log(`✅ .pkpass файл сгенерирован (${buffer.length} байт)`);
      
      // Сохраняем для проверки
      const testFileName = `test-${Date.now()}.pkpass`;
      fs.writeFileSync(testFileName, buffer);
      console.log(`💾 Сохранен как: ${testFileName}`);
      
      return true;
    } else {
      console.log('❌ Пустой буфер при генерации');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Ошибка:', error.message);
    
    // Дополнительная диагностика для разных типов ошибок
    if (error.message.includes('Invalid PEM')) {
      console.log('💡 Проблема с форматом PEM - проверьте кодировку файлов');
    } else if (error.message.includes('PKCS12')) {
      console.log('💡 Проблема с P12 файлом - проверьте пароль');
    } else if (error.message.includes('certificate')) {
      console.log('💡 Проблема с сертификатом - возможно истек срок действия');
    }
    
    return false;
  }
}

async function main() {
  console.log('Проверяем шаблон pass...');
  const templatePath = path.resolve('templates', 'apple', 'loy.pass');
  if (!fs.existsSync(templatePath)) {
    console.log(`❌ Шаблон не найден: ${templatePath}`);
    console.log('Создаем минимальный шаблон для тестирования...');
    
    // Создаем минимальную структуру шаблона
    const templateDir = path.dirname(templatePath);
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_ID || 'pass.com.loy.loyalty',
      teamIdentifier: process.env.APPLE_WALLET_TEAM_ID || 'YOUR_TEAM_ID',
      organizationName: 'Loy Digital Loyalty Platform',
      description: 'Test Loyalty Card',
      logoText: 'Loy',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(60, 65, 76)',
      storeCard: {
        headerFields: [],
        primaryFields: [],
        secondaryFields: [],
        auxiliaryFields: []
      }
    };
    
    fs.writeFileSync(path.join(templatePath, 'pass.json'), JSON.stringify(passJson, null, 2));
    console.log('✅ Минимальный шаблон создан');
  } else {
    console.log('✅ Шаблон найден');
  }
  
  let successCount = 0;
  
  for (const config of configs) {
    const success = await testConfiguration(config);
    if (success) {
      successCount++;
      console.log(`\n🎉 УСПЕХ! Конфигурация "${config.name}" работает!`);
    }
  }
  
  console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
  console.log('===========================');
  console.log(`Успешных конфигураций: ${successCount}/${configs.length}`);
  
  if (successCount === 0) {
    console.log('\n❌ НИ ОДНА КОНФИГУРАЦИЯ НЕ РАБОТАЕТ');
    console.log('Рекомендации:');
    console.log('1. Проверьте сертификаты через diagnose-certificates.js');
    console.log('2. Перевыпустите сертификаты через Apple Developer Portal');
    console.log('3. Убедитесь в правильности паролей');
  } else {
    console.log('\n✅ НАЙДЕНА РАБОЧАЯ КОНФИГУРАЦИЯ');
    console.log('Обновите src/config/wallet.ts с рабочими параметрами');
  }
}

main().catch(console.error);
