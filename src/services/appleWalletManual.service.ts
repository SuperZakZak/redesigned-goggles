import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { walletConfig } from '../config/wallet';
import { logger } from '../config/logger';
import { ICustomer } from '../models/customer';

/**
 * Custom Apple Wallet service using manual OpenSSL approach
 * This bypasses the passkit-generator library issues with PEM parsing
 * 
 * FIXED: Removes webServiceURL with localhost to prevent Apple Wallet rejection
 */
export class AppleWalletManualService {
  private tempDir: string;
  private certificates: {
    wwdr: string;
    signerCert: string;
    signerKey: string;
  };

  constructor() {
    this.tempDir = path.resolve('temp');
    this.certificates = {
      wwdr: path.resolve('certificates', 'wwdr-g4.pem'),
      signerCert: path.resolve('certificates', 'cert-final.pem'),
      signerKey: path.resolve('certificates', 'key-final.pem')
    };
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Copy template files (images) to working directory
   */
  private copyTemplateFiles(workDir: string): void {
    const templateDir = path.resolve('templates', 'apple', 'loy.pass');
    
    if (!fs.existsSync(templateDir)) {
      logger.warn('Template directory not found', { templateDir });
      return;
    }

    // Copy all image files from template
    const imageFiles = ['icon.png', 'icon@2x.png', 'icon@3x.png', 'logo.png', 'logo@2x.png', 'logo@3x.png'];
    
    for (const imageFile of imageFiles) {
      const srcPath = path.join(templateDir, imageFile);
      const destPath = path.join(workDir, imageFile);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        logger.debug('Copied template image', { imageFile, srcPath, destPath });
      } else {
        logger.warn('Template image not found', { imageFile, srcPath });
      }
    }
  }

  /**
   * Generate Apple Wallet pass for customer
   */
  async generatePass(customer: ICustomer): Promise<Buffer> {
    const serialNumber = `LOY-${customer._id.toString()}-${Date.now()}`;
    const passId = uuidv4();
    const workDir = path.join(this.tempDir, passId);

    try {
      logger.info('Generating Apple Wallet pass', { 
        customerId: customer._id.toString(), 
        serialNumber 
      });

      // Create working directory
      fs.mkdirSync(workDir, { recursive: true });

      // 1. Copy template files (images)
      this.copyTemplateFiles(workDir);

      // 2. Create pass.json
      await this.createPassJson(workDir, customer, serialNumber);

      // 2. Create manifest.json
      await this.createManifest(workDir);

      // 3. Sign manifest
      await this.signManifest(workDir);

      // 4. Create .pkpass archive
      const pkpassBuffer = await this.createPkpassArchive(workDir);

      logger.info('Apple Wallet pass generated successfully', { 
        customerId: customer._id.toString(),
        serialNumber,
        size: pkpassBuffer.length
      });

      return pkpassBuffer;

    } catch (error: any) {
      logger.error('Failed to generate Apple Wallet pass', { 
        customerId: customer._id.toString(),
        error: error.message 
      });
      throw new Error(`Failed to generate Apple Wallet pass: ${error.message}`);
    } finally {
      // Cleanup working directory
      if (fs.existsSync(workDir)) {
        execSync(`rm -rf "${workDir}"`);
      }
    }
  }

  /**
   * Create pass.json file
   * FIXED: Creates static passes without webServiceURL to prevent Apple Wallet rejection
   */
  private async createPassJson(workDir: string, customer: ICustomer, serialNumber: string): Promise<void> {
    // Create pass.json structure using 'generic' type (like working pass)
    const passJson: any = {
      formatVersion: 1,
      passTypeIdentifier: walletConfig.applePassTypeId,
      teamIdentifier: walletConfig.appleTeamId,
      organizationName: 'Loy',
      description: 'Loy Digital Loyalty Card',
      logoText: 'Loy Club',
      backgroundColor: 'rgb(255, 255, 255)',
      foregroundColor: 'rgb(0, 0, 0)',
      labelColor: 'rgb(0, 0, 0)',
      serialNumber,
      generic: {
        headerFields: [
          {
            key: 'customer',
            label: 'Клиент',
            value: customer.name || 'Клиент'
          }
        ],
        primaryFields: [
          {
            key: 'balance',
            label: 'Баланс',
            value: customer.balance || 0
          }
        ],
        secondaryFields: [
          {
            key: 'level',
            label: 'Уровень',
            value: 'Bronze'
          }
        ]
      },
      barcodes: [
        {
          message: `https://loy.com/card/${customer._id.toString()}`,
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }
      ]
    };

    // Add webServiceURL and authenticationToken only if BASE_URL is a valid public HTTPS URL
    // This prevents Apple Wallet from rejecting passes with localhost URLs
    const baseUrl = process.env.BASE_URL;
    if (baseUrl && 
        baseUrl.startsWith('https://') && 
        !baseUrl.includes('localhost') && 
        !baseUrl.includes('127.0.0.1')) {
      passJson.webServiceURL = `${baseUrl}/api/v1/wallet`;
      passJson.authenticationToken = this.generateAuthToken(customer._id.toString(), serialNumber);
      logger.info('Creating dynamic pass with webServiceURL', { webServiceURL: passJson.webServiceURL });
    } else {
      logger.info('Creating static pass (no webServiceURL)', { 
        reason: baseUrl ? 'localhost/invalid URL detected' : 'no BASE_URL configured',
        baseUrl: baseUrl || 'undefined'
      });
    }

    const passJsonPath = path.join(workDir, 'pass.json');
    fs.writeFileSync(passJsonPath, JSON.stringify(passJson, null, 2));
    
    logger.debug('pass.json created', { passJsonPath });
  }

  /**
   * Create manifest.json with file hashes
   */
  private async createManifest(workDir: string): Promise<void> {
    const files = fs.readdirSync(workDir).filter(file => file !== 'manifest.json' && file !== 'signature');
    const manifest: Record<string, string> = {};

    for (const file of files) {
      const filePath = path.join(workDir, file);
      const fileContent = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
      manifest[file] = hash;
    }

    const manifestPath = path.join(workDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    logger.debug('manifest.json created', { manifestPath, filesCount: files.length });
  }

  /**
   * Sign manifest using OpenSSL
   */
  private async signManifest(workDir: string): Promise<void> {
    const manifestPath = path.join(workDir, 'manifest.json');
    const signaturePath = path.join(workDir, 'signature');

    // Validate certificate files exist
    this.validateCertificates();

    // FIXED: Proper OpenSSL command to include WWDR intermediate certificate
    // The -certfile parameter should include BOTH the signer cert AND WWDR cert
    // Create a temporary combined certificate file
    const combinedCertPath = path.join(workDir, 'combined-certs.pem');
    const signerCertContent = fs.readFileSync(this.certificates.signerCert, 'utf8');
    const wwdrCertContent = fs.readFileSync(this.certificates.wwdr, 'utf8');
    fs.writeFileSync(combinedCertPath, signerCertContent + '\n' + wwdrCertContent);

    const signCommand = [
      'openssl', 'smime',
      '-binary', '-sign',
      '-certfile', `"${combinedCertPath}"`,
      '-signer', `"${this.certificates.signerCert}"`,
      '-inkey', `"${this.certificates.signerKey}"`,
      '-in', `"${manifestPath}"`,
      '-out', `"${signaturePath}"`,
      '-outform', 'DER'
    ].join(' ');

    try {
      logger.debug('Executing OpenSSL sign command', { command: signCommand });
      execSync(signCommand, { 
        stdio: 'pipe',
        timeout: 30000 // 30 second timeout
      });
      logger.debug('Manifest signed successfully', { signaturePath });
    } catch (error: any) {
      logger.error('Failed to sign manifest', { 
        error: error.message,
        command: signCommand,
        timeout: error.signal === 'SIGTERM' ? 'Command timed out after 30 seconds' : 'Unknown error'
      });
      throw new Error(`Failed to sign manifest: ${error.message}`);
    } finally {
      // Cleanup temporary combined certificate file
      if (fs.existsSync(combinedCertPath)) {
        fs.unlinkSync(combinedCertPath);
      }
    }
  }

  /**
   * Create .pkpass archive
   */
  private async createPkpassArchive(workDir: string): Promise<Buffer> {
    const archivePath = path.join(this.tempDir, `pass-${Date.now()}.pkpass`);
    
    try {
      // Create zip archive with store method (no compression) like working pass
      const zipCommand = `cd "${workDir}" && zip -0 -r "${archivePath}" .`;
      logger.debug('Executing zip command', { command: zipCommand });
      execSync(zipCommand, { 
        stdio: 'pipe',
        timeout: 15000 // 15 second timeout
      });

      // Read the archive into buffer
      const buffer = fs.readFileSync(archivePath);
      
      // Cleanup archive file
      fs.unlinkSync(archivePath);
      
      logger.debug('PKPass archive created', { size: buffer.length });
      return buffer;
      
    } catch (error: any) {
      logger.error('Failed to create PKPass archive', { 
        error: error.message,
        timeout: error.signal === 'SIGTERM' ? 'Command timed out after 15 seconds' : 'Unknown error'
      });
      throw new Error(`Failed to create PKPass archive: ${error.message}`);
    }
  }

  /**
   * Generate authentication token for wallet web service
   */
  private generateAuthToken(customerId: string, serialNumber: string): string {
    const payload = { customerId, serialNumber, timestamp: Date.now() };
    const secret = process.env.WALLET_AUTH_SECRET || 'default-secret';
    
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Validate that all required certificate files exist
   */
  private validateCertificates(): void {
    const requiredFiles = [
      { path: this.certificates.wwdr, name: 'WWDR certificate' },
      { path: this.certificates.signerCert, name: 'Signer certificate' },
      { path: this.certificates.signerKey, name: 'Signer key' }
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`${file.name} not found: ${file.path}`);
      }
    }

    logger.debug('All certificates validated', { certificates: this.certificates });
  }

  /**
   * Update existing pass data (for dynamic updates)
   */
  async updatePass(customer: ICustomer, serialNumber: string): Promise<Buffer> {
    logger.info('Updating Apple Wallet pass', { 
      customerId: customer._id.toString(), 
      serialNumber 
    });

    // Generate new pass with updated data
    return this.generatePass(customer);
  }
}

// Export singleton instance
export const appleWalletManualService = new AppleWalletManualService();
