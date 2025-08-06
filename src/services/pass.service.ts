import { Template } from '@walletpass/pass-js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Определим интерфейс для данных, которые будут на карте
interface IPassData {
  serialNumber: string;
  name: string;
  balance: number;
  level: string;
  cardNumber?: string; // Optional card number for display
}

class PassService {
  private template: Template;
  private isInitialized = false;

  constructor() {
    this.template = new Template('generic');
  }

  /**
   * Инициализирует сервис, загружая сертификаты и базовые данные шаблона.
   * Этот метод нужно вызвать один раз при старте приложения.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Пути должны строиться от корня проекта для корректной работы в production и dev.
      const projectRoot = path.join(__dirname, '../../');
      const certPath = path.join(projectRoot, 'certificates/cert-clean.pem');
      const keyPath = path.join(projectRoot, 'certificates/key-pkcs8.pem');
      const templateDir = path.join(projectRoot, 'templates/apple/loy.pass');

      // 1. Загрузка сертификатов
      const certPem = await fs.readFile(certPath, 'utf-8');
      const keyPem = await fs.readFile(keyPath, 'utf-8');

      this.template.setCertificate(certPem);
      this.template.setPrivateKey(keyPem);

      // 2. Загрузка базовых данных из pass.json
      const passJsonPath = path.join(templateDir, 'pass.json');
      const passJson = JSON.parse(await fs.readFile(passJsonPath, 'utf-8'));

      this.template.passTypeIdentifier = passJson.passTypeIdentifier;
      this.template.teamIdentifier = passJson.teamIdentifier;
      this.template.organizationName = passJson.organizationName;
      this.template.logoText = passJson.logoText;
      this.template.description = passJson.description;
      this.template.backgroundColor = passJson.backgroundColor;
      this.template.foregroundColor = passJson.foregroundColor;
      this.template.labelColor = passJson.labelColor;

      // 3. Загрузка изображений
      const templateFiles = await fs.readdir(templateDir);
      for (const file of templateFiles) {
        if (file.endsWith('.png')) {
          const imagePath = path.join(templateDir, file);
          const buffer = await fs.readFile(imagePath);
          const fileName = path.parse(file).name;
          const [imageType, density] = fileName.split('@');
          this.template.images.add(imageType as any, buffer, density as any);
        }
      }

      this.isInitialized = true;
      console.log('✅ PassService успешно инициализирован.');
    } catch (error) {
      console.error('❌ Ошибка при инициализации PassService:', error);
      throw new Error('Не удалось инициализировать сервис для генерации карт.');
    }
  }

  /**
   * Генерирует .pkpass файл для Apple Wallet.
   * @param data - Данные для персонализации карты.
   * @returns {Buffer} - Готовый .pkpass файл в виде буфера.
   */
  public async generateApplePass(data: IPassData): Promise<Buffer> {
    if (!this.isInitialized) {
      throw new Error('PassService не инициализирован. Вызовите initialize() перед использованием.');
    }

    // Создаем копию шаблона для новой карты с данными
    const passData = {
      serialNumber: data.serialNumber,
      barcodes: [
        {
          message: `https://loy.com/card/${data.cardNumber || data.serialNumber}`,
          format: 'QR' as any, // Используем правильный формат для @walletpass/pass-js
          messageEncoding: 'iso-8859-1',
        },
      ],
      // Устанавливаем поля через данные шаблона
      primaryFields: {
        balance: { label: 'Баланс', value: `${data.balance} ₽` }
      },
      secondaryFields: {
        level: { label: 'Уровень', value: data.level },
        cardNumber: { label: 'Номер карты', value: data.cardNumber || data.serialNumber }
      },
      headerFields: {
        customer: { label: 'Клиент', value: data.name }
      }
    };

    const pass = this.template.createPass(passData);

    // Генерируем буфер
    const passBuffer = await pass.asBuffer();

    return passBuffer;
  }
}

// Экспортируем единственный экземпляр сервиса (Singleton)
export const passService = new PassService();
