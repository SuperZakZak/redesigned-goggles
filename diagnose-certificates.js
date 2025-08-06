const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 ДИАГНОСТИКА СЕРТИФИКАТОВ APPLE WALLET\n');

// Конфигурация из wallet.ts
const config = {
  appleCertPath: './certificates/Certificates.p12',
  appleCertPassword: 'paPlr8seGgpB',
  appleWwdrPath: './certificates/wwdr-g4.pem', // Исправлено с pass(2).cer
  
  // Альтернативные PEM файлы
  certPemPath: './certificates/cert-clean.pem',
  keyPemPath: './certificates/key-pkcs8.pem'
};

function checkFileExists(filePath) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${filePath} - ${exists ? 'существует' : 'НЕ НАЙДЕН'}`);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`   Размер: ${stats.size} байт`);
  }
  
  return exists;
}

function validateCertificate(certPath, type) {
  console.log(`\n📋 Проверка ${type}: ${certPath}`);
  
  if (!checkFileExists(certPath)) {
    return false;
  }
  
  try {
    let command;
    
    if (certPath.endsWith('.p12')) {
      // Проверка P12 файла
      command = `openssl pkcs12 -info -in "${certPath}" -passin pass:${config.appleCertPassword} -noout`;
    } else if (certPath.includes('key')) {
      // Проверка приватного ключа
      command = `openssl rsa -in "${certPath}" -check -noout`;
    } else {
      // Проверка X.509 сертификата
      command = `openssl x509 -in "${certPath}" -text -noout`;
    }
    
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Сертификат валиден');
    
    // Извлекаем полезную информацию
    if (certPath.endsWith('.p12')) {
      console.log('   P12 файл содержит сертификат и ключ');
    } else if (output.includes('Subject:')) {
      const subjectMatch = output.match(/Subject: (.+)/);
      if (subjectMatch) {
        console.log(`   Subject: ${subjectMatch[1].trim()}`);
      }
      
      const validityMatch = output.match(/Not After : (.+)/);
      if (validityMatch) {
        console.log(`   Действителен до: ${validityMatch[1].trim()}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Ошибка валидации:', error.message);
    return false;
  }
}

function testPEMFormat(filePath) {
  console.log(`\n🔍 Проверка PEM формата: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Файл не найден');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Проверяем PEM заголовки и окончания
  const pemPatterns = [
    { start: '-----BEGIN CERTIFICATE-----', end: '-----END CERTIFICATE-----' },
    { start: '-----BEGIN PRIVATE KEY-----', end: '-----END PRIVATE KEY-----' },
    { start: '-----BEGIN RSA PRIVATE KEY-----', end: '-----END RSA PRIVATE KEY-----' }
  ];
  
  let validPem = false;
  
  for (const pattern of pemPatterns) {
    if (content.includes(pattern.start) && content.includes(pattern.end)) {
      console.log(`✅ Найден валидный PEM блок: ${pattern.start}`);
      validPem = true;
    }
  }
  
  if (!validPem) {
    console.log('❌ Не найдено валидных PEM блоков');
    console.log('Первые 200 символов файла:');
    console.log(content.substring(0, 200));
  }
  
  // Проверяем на наличие Bag Attributes
  if (content.includes('Bag Attributes')) {
    console.log('⚠️  Найдены Bag Attributes - могут вызывать проблемы');
  }
  
  return validPem;
}

async function main() {
  console.log('1. ПРОВЕРКА СУЩЕСТВОВАНИЯ ФАЙЛОВ');
  console.log('================================');
  
  const files = [
    config.appleCertPath,
    config.appleWwdrPath,
    config.certPemPath,
    config.keyPemPath
  ];
  
  files.forEach(file => checkFileExists(file));
  
  console.log('\n2. ВАЛИДАЦИЯ СЕРТИФИКАТОВ');
  console.log('=========================');
  
  const p12Valid = validateCertificate(config.appleCertPath, 'P12 сертификат');
  const wwdrValid = validateCertificate(config.appleWwdrPath, 'WWDR сертификат');
  const certPemValid = validateCertificate(config.certPemPath, 'PEM сертификат');
  const keyPemValid = validateCertificate(config.keyPemPath, 'PEM ключ');
  
  console.log('\n3. ПРОВЕРКА PEM ФОРМАТА');
  console.log('=======================');
  
  testPEMFormat(config.appleWwdrPath);
  testPEMFormat(config.certPemPath);
  testPEMFormat(config.keyPemPath);
  
  console.log('\n4. РЕКОМЕНДАЦИИ');
  console.log('===============');
  
  if (!p12Valid) {
    console.log('❌ P12 файл недействителен - проверьте пароль или перевыпустите сертификат');
  }
  
  if (!wwdrValid) {
    console.log('❌ WWDR сертификат недействителен - скачайте новый с Apple Developer Portal');
  }
  
  if (p12Valid && wwdrValid) {
    console.log('✅ Основные сертификаты валидны');
    console.log('💡 Попробуем использовать отдельные PEM файлы вместо P12');
  }
  
  if (certPemValid && keyPemValid && wwdrValid) {
    console.log('✅ Все PEM файлы валидны - можно использовать альтернативную конфигурацию');
  }
  
  console.log('\n5. СЛЕДУЮЩИЕ ШАГИ');
  console.log('==================');
  console.log('1. Если P12 валиден - проверить совместимость с passkit-generator');
  console.log('2. Если PEM файлы валидны - создать тест с PEM конфигурацией');
  console.log('3. Если все невалидно - перевыпустить сертификаты через Apple Developer Portal');
}

main().catch(console.error);
