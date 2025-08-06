const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔬 АЛЬТЕРНАТИВНЫЙ ПОДХОД К РЕШЕНИЮ ПРОБЛЕМЫ\n');

// Попробуем использовать @walletpass/pass-js вместо passkit-generator
async function testAlternativeLibrary() {
  console.log('1. ТЕСТИРОВАНИЕ @walletpass/pass-js');
  console.log('==================================');
  
  try {
    // Проверяем есть ли библиотека
    try {
      require('@walletpass/pass-js');
      console.log('✅ @walletpass/pass-js уже установлена');
    } catch (e) {
      console.log('⚠️  @walletpass/pass-js не установлена, устанавливаем...');
      execSync('npm install @walletpass/pass-js', { stdio: 'inherit' });
      console.log('✅ @walletpass/pass-js установлена');
    }
    
    const { PKPass } = require('@walletpass/pass-js');
    
    // Создаем pass с альтернативной библиотекой
    const pass = new PKPass({
      'pass.json': JSON.stringify({
        formatVersion: 1,
        passTypeIdentifier: 'pass.com.loyloy.loyalty',
        teamIdentifier: '7K66482HM2',
        organizationName: 'Loy Digital Loyalty Platform',
        description: 'Test Loyalty Card',
        logoText: 'Loy',
        foregroundColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgb(60, 65, 76)',
        serialNumber: 'TEST-' + Date.now(),
        storeCard: {
          headerFields: [{
            key: 'loy',
            label: 'LOYALTY',
            value: 'Loy Club'
          }],
          primaryFields: [{
            key: 'balance',
            label: 'Баланс',
            value: '1000 ₽'
          }],
          secondaryFields: [{
            key: 'cardNumber',
            label: 'Номер карты',
            value: '1234567890'
          }],
          auxiliaryFields: []
        },
        barcode: {
          message: 'TEST123456',
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }
      })
    }, {
      wwdr: fs.readFileSync('./certificates/wwdr-g4.pem'),
      signerCert: fs.readFileSync('./certificates/cert-final.pem'),
      signerKey: fs.readFileSync('./certificates/key-final.pem')
    });
    
    const buffer = pass.getAsBuffer();
    
    if (buffer && buffer.length > 0) {
      const fileName = `alternative-test-${Date.now()}.pkpass`;
      fs.writeFileSync(fileName, buffer);
      console.log(`✅ Альтернативная библиотека работает! Файл: ${fileName}`);
      return true;
    }
    
  } catch (error) {
    console.log('❌ Альтернативная библиотека не работает:', error.message);
    return false;
  }
}

// Попробуем создать pass вручную используя OpenSSL
async function testManualApproach() {
  console.log('\n2. РУЧНОЕ СОЗДАНИЕ .pkpass С OPENSSL');
  console.log('====================================');
  
  try {
    // Создаем временную папку для pass
    const passDir = './temp-pass';
    if (fs.existsSync(passDir)) {
      execSync(`rm -rf "${passDir}"`);
    }
    fs.mkdirSync(passDir);
    
    // Создаем pass.json
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.loyloy.loyalty',
      teamIdentifier: '7K66482HM2',
      organizationName: 'Loy Digital Loyalty Platform',
      description: 'Test Loyalty Card',
      logoText: 'Loy',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(60, 65, 76)',
      serialNumber: 'MANUAL-' + Date.now(),
      storeCard: {
        headerFields: [{
          key: 'loy',
          label: 'LOYALTY',
          value: 'Loy Club'
        }],
        primaryFields: [{
          key: 'balance',
          label: 'Баланс',
          value: '1000 ₽'
        }],
        secondaryFields: [{
          key: 'cardNumber',
          label: 'Номер карты',
          value: '1234567890'
        }],
        auxiliaryFields: []
      },
      barcode: {
        message: 'MANUAL123456',
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      }
    };
    
    fs.writeFileSync(`${passDir}/pass.json`, JSON.stringify(passJson, null, 2));
    console.log('✅ pass.json создан');
    
    // Создаем manifest.json
    const passJsonContent = fs.readFileSync(`${passDir}/pass.json`);
    const passJsonHash = require('crypto').createHash('sha1').update(passJsonContent).digest('hex');
    
    const manifest = {
      'pass.json': passJsonHash
    };
    
    fs.writeFileSync(`${passDir}/manifest.json`, JSON.stringify(manifest, null, 2));
    console.log('✅ manifest.json создан');
    
    // Подписываем manifest
    const signCommand = `openssl smime -binary -sign -certfile "./certificates/wwdr-g4.pem" -signer "./certificates/cert-final.pem" -inkey "./certificates/key-final.pem" -in "${passDir}/manifest.json" -out "${passDir}/signature" -outform DER`;
    
    execSync(signCommand);
    console.log('✅ signature создан');
    
    // Создаем zip архив
    const zipCommand = `cd "${passDir}" && zip -r "../manual-test-${Date.now()}.pkpass" .`;
    execSync(zipCommand);
    console.log('✅ .pkpass архив создан');
    
    // Очищаем временную папку
    execSync(`rm -rf "${passDir}"`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Ручное создание не удалось:', error.message);
    return false;
  }
}

// Диагностика проблемы с node-forge
async function diagnoseNodeForge() {
  console.log('\n3. ДИАГНОСТИКА NODE-FORGE');
  console.log('==========================');
  
  try {
    const forge = require('node-forge');
    
    // Читаем сертификат и пытаемся его парсить напрямую
    const certPem = fs.readFileSync('./certificates/cert-final.pem', 'utf8');
    console.log('Первые 100 символов сертификата:');
    console.log(certPem.substring(0, 100));
    
    // Пытаемся парсить через node-forge
    const cert = forge.pki.certificateFromPem(certPem);
    console.log('✅ node-forge успешно парсит сертификат');
    console.log(`Subject: ${cert.subject.getField('CN').value}`);
    
    // Проверяем ключ
    const keyPem = fs.readFileSync('./certificates/key-final.pem', 'utf8');
    const privateKey = forge.pki.privateKeyFromPem(keyPem);
    console.log('✅ node-forge успешно парсит ключ');
    
    // Проверяем WWDR
    const wwdrPem = fs.readFileSync('./certificates/wwdr-g4.pem', 'utf8');
    const wwdrCert = forge.pki.certificateFromPem(wwdrPem);
    console.log('✅ node-forge успешно парсит WWDR');
    console.log(`WWDR Subject: ${wwdrCert.subject.getField('CN').value}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ node-forge не может парсить сертификаты:', error.message);
    
    // Показываем проблемный участок
    if (error.message.includes('Invalid PEM')) {
      console.log('\n🔍 Анализ PEM формата:');
      const files = ['./certificates/cert-final.pem', './certificates/key-final.pem', './certificates/wwdr-g4.pem'];
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`\n${file}:`);
        console.log(`- Длина: ${content.length} символов`);
        console.log(`- Начинается с: ${content.substring(0, 30)}`);
        console.log(`- Заканчивается на: ${content.substring(content.length - 30)}`);
        console.log(`- Содержит \\r: ${content.includes('\r')}`);
        console.log(`- Содержит \\n: ${content.includes('\n')}`);
      });
    }
    
    return false;
  }
}

async function main() {
  console.log('Тестируем альтернативные подходы к решению проблемы с сертификатами...\n');
  
  // 1. Диагностика node-forge
  const forgeWorks = await diagnoseNodeForge();
  
  // 2. Альтернативная библиотека
  const alternativeWorks = await testAlternativeLibrary();
  
  // 3. Ручное создание
  const manualWorks = await testManualApproach();
  
  console.log('\n📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ');
  console.log('======================');
  console.log(`node-forge диагностика: ${forgeWorks ? '✅' : '❌'}`);
  console.log(`@walletpass/pass-js: ${alternativeWorks ? '✅' : '❌'}`);
  console.log(`Ручное создание: ${manualWorks ? '✅' : '❌'}`);
  
  if (alternativeWorks || manualWorks) {
    console.log('\n🎉 НАЙДЕНО РАБОЧЕЕ РЕШЕНИЕ!');
    if (alternativeWorks) {
      console.log('✅ Используйте @walletpass/pass-js вместо passkit-generator');
    }
    if (manualWorks) {
      console.log('✅ Ручное создание .pkpass работает');
    }
  } else {
    console.log('\n❌ Все альтернативы не работают');
    console.log('Рекомендация: перевыпустить сертификаты через Apple Developer Portal');
  }
}

main().catch(console.error);
