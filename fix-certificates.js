const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 ИСПРАВЛЕНИЕ СЕРТИФИКАТОВ APPLE WALLET\n');

const config = {
  p12File: './certificates/Certificates.p12',
  password: 'paPlr8seGgpB',
  wwdrFile: './certificates/wwdr-g4.pem'
};

function regeneratePEMFiles() {
  console.log('1. ИЗВЛЕЧЕНИЕ ЧИСТЫХ PEM ФАЙЛОВ ИЗ P12');
  console.log('=======================================');
  
  try {
    // Извлекаем сертификат
    console.log('Извлекаем сертификат...');
    const certCommand = `openssl pkcs12 -in "${config.p12File}" -clcerts -nokeys -out "./certificates/cert-new.pem" -passin pass:${config.password}`;
    execSync(certCommand);
    console.log('✅ Сертификат извлечен: cert-new.pem');
    
    // Извлекаем приватный ключ без шифрования
    console.log('Извлекаем приватный ключ...');
    const keyCommand = `openssl pkcs12 -in "${config.p12File}" -nocerts -nodes -out "./certificates/key-new.pem" -passin pass:${config.password}`;
    execSync(keyCommand);
    console.log('✅ Ключ извлечен: key-new.pem');
    
    // Очищаем файлы от Bag Attributes
    console.log('\n2. ОЧИСТКА ОТ BAG ATTRIBUTES');
    console.log('=============================');
    
    cleanPEMFile('./certificates/cert-new.pem', './certificates/cert-final.pem', 'CERTIFICATE');
    cleanPEMFile('./certificates/key-new.pem', './certificates/key-final.pem', 'PRIVATE KEY');
    
    // Проверяем результат
    console.log('\n3. ПРОВЕРКА РЕЗУЛЬТАТА');
    console.log('======================');
    
    validatePEMFile('./certificates/cert-final.pem', 'сертификат');
    validatePEMFile('./certificates/key-final.pem', 'ключ');
    validatePEMFile('./certificates/wwdr-g4.pem', 'WWDR');
    
    return true;
  } catch (error) {
    console.log('❌ Ошибка при извлечении:', error.message);
    return false;
  }
}

function cleanPEMFile(inputFile, outputFile, type) {
  console.log(`Очищаем ${inputFile}...`);
  
  const content = fs.readFileSync(inputFile, 'utf8');
  
  // Находим начало и конец PEM блока
  const startMarker = `-----BEGIN ${type}-----`;
  const endMarker = `-----END ${type}-----`;
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker) + endMarker.length;
  
  if (startIndex === -1 || endIndex === -1) {
    console.log(`❌ Не найден PEM блок ${type} в ${inputFile}`);
    return false;
  }
  
  const cleanContent = content.substring(startIndex, endIndex) + '\n';
  fs.writeFileSync(outputFile, cleanContent);
  console.log(`✅ Очищен: ${outputFile}`);
  
  return true;
}

function validatePEMFile(filePath, type) {
  try {
    let command;
    if (filePath.includes('key')) {
      command = `openssl rsa -in "${filePath}" -check -noout`;
    } else {
      command = `openssl x509 -in "${filePath}" -text -noout`;
    }
    
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${type} валиден: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`❌ ${type} невалиден: ${filePath} - ${error.message}`);
    return false;
  }
}

function fixLineEndings() {
  console.log('\n4. ИСПРАВЛЕНИЕ ОКОНЧАНИЙ СТРОК');
  console.log('==============================');
  
  const files = [
    './certificates/cert-final.pem',
    './certificates/key-final.pem',
    './certificates/wwdr-g4.pem'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        // Читаем файл и нормализуем окончания строк
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Убеждаемся что файл заканчивается переводом строки
        if (!content.endsWith('\n')) {
          content += '\n';
        }
        
        fs.writeFileSync(file, content);
        console.log(`✅ Исправлены окончания строк: ${file}`);
      } catch (error) {
        console.log(`❌ Ошибка при исправлении ${file}: ${error.message}`);
      }
    }
  });
}

async function main() {
  console.log('Проверяем существование исходных файлов...');
  
  if (!fs.existsSync(config.p12File)) {
    console.log(`❌ P12 файл не найден: ${config.p12File}`);
    return;
  }
  
  if (!fs.existsSync(config.wwdrFile)) {
    console.log(`❌ WWDR файл не найден: ${config.wwdrFile}`);
    return;
  }
  
  console.log('✅ Исходные файлы найдены\n');
  
  // Регенерируем PEM файлы
  const success = regeneratePEMFiles();
  
  if (success) {
    // Исправляем окончания строк
    fixLineEndings();
    
    console.log('\n🎉 СЕРТИФИКАТЫ ИСПРАВЛЕНЫ!');
    console.log('==========================');
    console.log('Новые файлы:');
    console.log('- certificates/cert-final.pem (чистый сертификат)');
    console.log('- certificates/key-final.pem (чистый ключ)');
    console.log('- certificates/wwdr-g4.pem (WWDR сертификат)');
    console.log('\nТеперь запустите: node test-fixed-certificates.js');
  } else {
    console.log('\n❌ Не удалось исправить сертификаты');
    console.log('Возможно нужно перевыпустить сертификаты через Apple Developer Portal');
  }
}

main().catch(console.error);
