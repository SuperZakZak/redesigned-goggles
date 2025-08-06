const { PKPass } = require('passkit-generator');
const path = require('path');
const fs = require('fs');

console.log('🧪 ТЕСТИРОВАНИЕ ИСПРАВЛЕННЫХ СЕРТИФИКАТОВ\n');

// Конфигурация с исправленными сертификатами
const fixedConfig = {
  name: 'Исправленные PEM сертификаты',
  certificates: {
    wwdr: './certificates/wwdr-g4.pem',
    signerCert: './certificates/cert-final.pem',
    signerKey: './certificates/key-final.pem',
  }
};

async function testFixedConfiguration() {
  console.log(`📋 Тестируем: ${fixedConfig.name}`);
  console.log('='.repeat(fixedConfig.name.length + 15));
  
  // Проверяем существование всех файлов
  const missingFiles = [];
  for (const [key, filePath] of Object.entries(fixedConfig.certificates)) {
    if (!fs.existsSync(filePath)) {
      missingFiles.push(`${key}: ${filePath}`);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log('❌ Отсутствуют файлы:');
    missingFiles.forEach(file => console.log(`   ${file}`));
    return false;
  }
  
  console.log('✅ Все файлы найдены');
  
  // Показываем размеры файлов
  for (const [key, filePath] of Object.entries(fixedConfig.certificates)) {
    const stats = fs.statSync(filePath);
    console.log(`   ${key}: ${stats.size} байт`);
  }
  
  try {
    console.log('\n🔄 Создаем PKPass объект...');
    const pass = await PKPass.from({
      model: path.resolve('templates', 'apple', 'loy.pass'),
      certificates: fixedConfig.certificates,
    });
    
    console.log('✅ PKPass объект создан успешно');
    
    console.log('🔄 Устанавливаем данные карты...');
    const serialNumber = 'TEST-' + Date.now();
    pass.serialNumber = serialNumber;
    
    // Устанавливаем штрихкод
    pass.setBarcodes({
      message: 'TEST123456',
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1'
    });
    
    // Добавляем поля карты
    pass.headerFields.push({
      key: 'loy',
      label: 'LOYALTY',
      value: 'Loy Club'
    });
    
    pass.primaryFields.push({
      key: 'balance',
      label: 'Баланс',
      value: '1000 ₽',
      currencyCode: 'RUB'
    });
    
    pass.secondaryFields.push({
      key: 'cardNumber',
      label: 'Номер карты',
      value: '1234567890'
    });
    
    console.log('✅ Данные установлены успешно');
    
    console.log('🔄 Генерируем .pkpass файл...');
    const buffer = pass.getAsBuffer();
    
    if (buffer && buffer.length > 0) {
      console.log(`✅ .pkpass файл сгенерирован (${buffer.length} байт)`);
      
      // Сохраняем файл
      const fileName = `loy-test-${Date.now()}.pkpass`;
      fs.writeFileSync(fileName, buffer);
      console.log(`💾 Сохранен как: ${fileName}`);
      
      // Проверяем что это действительно zip-архив
      const fileType = require('child_process').execSync(`file "${fileName}"`, { encoding: 'utf8' });
      console.log(`📄 Тип файла: ${fileType.trim()}`);
      
      if (fileType.includes('Zip archive')) {
        console.log('✅ Файл является валидным Zip-архивом (.pkpass)');
        
        // Показываем содержимое архива
        try {
          const zipContents = require('child_process').execSync(`unzip -l "${fileName}"`, { encoding: 'utf8' });
          console.log('\n📦 Содержимое .pkpass архива:');
          console.log(zipContents);
        } catch (e) {
          console.log('⚠️  Не удалось показать содержимое архива');
        }
        
        return true;
      } else {
        console.log('❌ Файл НЕ является Zip-архивом');
        return false;
      }
      
    } else {
      console.log('❌ Пустой буфер при генерации');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Ошибка:', error.message);
    console.log('Стек ошибки:', error.stack);
    
    // Дополнительная диагностика
    if (error.message.includes('Invalid PEM')) {
      console.log('\n💡 Все еще проблема с PEM форматом');
      console.log('Возможные причины:');
      console.log('1. Несовместимость версии passkit-generator');
      console.log('2. Проблема с кодировкой файлов');
      console.log('3. Нужны другие сертификаты');
    }
    
    return false;
  }
}

async function main() {
  console.log('Проверяем шаблон pass...');
  const templatePath = path.resolve('templates', 'apple', 'loy.pass');
  if (!fs.existsSync(templatePath)) {
    console.log(`❌ Шаблон не найден: ${templatePath}`);
    return;
  }
  
  console.log('✅ Шаблон найден\n');
  
  const success = await testFixedConfiguration();
  
  console.log('\n📊 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ');
  console.log('=========================');
  
  if (success) {
    console.log('🎉 УСПЕХ! Исправленные сертификаты работают!');
    console.log('\n✅ СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Обновите src/config/wallet.ts с новыми путями к сертификатам');
    console.log('2. Перезапустите сервер');
    console.log('3. Протестируйте API endpoint');
    console.log('\nНовая конфигурация для wallet.ts:');
    console.log('```typescript');
    console.log('appleCertPath: path.resolve("certificates", "cert-final.pem"),');
    console.log('appleKeyPath: path.resolve("certificates", "key-final.pem"),');
    console.log('appleWwdrPath: path.resolve("certificates", "wwdr-g4.pem"),');
    console.log('// Убрать appleCertPassword - больше не нужен');
    console.log('```');
  } else {
    console.log('❌ Исправленные сертификаты все еще не работают');
    console.log('\n🔍 ДАЛЬНЕЙШИЕ ДЕЙСТВИЯ:');
    console.log('1. Проверить версию passkit-generator');
    console.log('2. Попробовать альтернативную библиотеку');
    console.log('3. Перевыпустить сертификаты через Apple Developer Portal');
  }
}

main().catch(console.error);
