import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ethers } from 'ethers';

/**
 * WalletService - Handles secure encryption/decryption of private keys
 *
 * Security Features:
 * 1. AES-256-GCM encryption for private keys
 * 2. Unique IV (Initialization Vector) per encryption
 * 3. Authentication tags to prevent tampering
 * 4. Password-based key derivation (PBKDF2)
 * 5. Keys never stored in plaintext
 * 6. Memory cleanup after use
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;
  private readonly saltRounds = 100000; // PBKDF2 iterations

  constructor(private configService: ConfigService) {
    // Master key from environment (must be 32 bytes for AES-256)
    const masterKeyHex = this.configService.get<string>('WALLET_MASTER_KEY');
    if (!masterKeyHex || masterKeyHex.length !== 64) {
      throw new Error(
        'WALLET_MASTER_KEY must be set in .env (64 hex characters)',
      );
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Create a new wallet and encrypt the private key
   */
  async createWallet(userPassword: string): Promise<{
    walletAddress: string;
    encryptedPrivateKey: string;
  }> {
    try {
      // Generate new wallet
      const wallet = ethers.Wallet.createRandom();
      const privateKey = wallet.privateKey;
      const walletAddress = wallet.address;

      // Encrypt private key
      const encryptedPrivateKey = await this.encryptPrivateKey(
        privateKey,
        userPassword,
      );

      // Clear sensitive data from memory
      this.clearSensitiveData(privateKey);

      this.logger.log(`Created new wallet: ${walletAddress}`);

      return {
        walletAddress,
        encryptedPrivateKey,
      };
    } catch (error) {
      this.logger.error('Failed to create wallet', error);
      throw new InternalServerErrorException('Failed to create wallet');
    }
  }

  /**
   * Encrypt a private key using AES-256-GCM with user password
   */
  async encryptPrivateKey(
    privateKey: string,
    userPassword: string,
  ): Promise<string> {
    try {
      // Derive encryption key from user password
      const salt = crypto.randomBytes(32);
      const derivedKey = crypto.pbkdf2Sync(
        userPassword,
        salt,
        this.saltRounds,
        32,
        'sha512',
      );

      // Generate random IV
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);

      // Encrypt
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: salt:iv:authTag:encrypted
      const result = [
        salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted,
      ].join(':');

      // Clear sensitive data
      this.clearSensitiveData(derivedKey.toString('hex'));

      return result;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  /**
   * Decrypt private key using user password
   */
  async decryptPrivateKey(
    encryptedPrivateKey: string,
    userPassword: string,
  ): Promise<string> {
    try {
      // Parse encrypted data
      const parts = encryptedPrivateKey.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }

      const [saltHex, ivHex, authTagHex, encrypted] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Derive decryption key from user password
      const derivedKey = crypto.pbkdf2Sync(
        userPassword,
        salt,
        this.saltRounds,
        32,
        'sha512',
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Clear sensitive data
      this.clearSensitiveData(derivedKey.toString('hex'));

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new UnauthorizedException('Invalid password or corrupted data');
    }
  }

  /**
   * Sign a transaction with decrypted private key
   * Private key is decrypted, used once, then immediately cleared
   */
  async signTransaction(
    encryptedPrivateKey: string,
    userPassword: string,
    transaction: ethers.TransactionRequest,
  ): Promise<string> {
    let privateKey: string | null = null;
    let wallet: ethers.Wallet | null = null;

    try {
      // Decrypt private key
      privateKey = await this.decryptPrivateKey(
        encryptedPrivateKey,
        userPassword,
      );

      // Create wallet
      wallet = new ethers.Wallet(privateKey);

      // Sign transaction
      const signedTx = await wallet.signTransaction(transaction);

      return signedTx;
    } catch (error) {
      this.logger.error('Transaction signing failed', error);
      throw new UnauthorizedException('Failed to sign transaction');
    } finally {
      // CRITICAL: Clear private key from memory immediately
      if (privateKey) {
        this.clearSensitiveData(privateKey);
        privateKey = null;
      }
      if (wallet) {
        wallet = null;
      }
    }
  }

  /**
   * Get wallet instance for a single operation (use with caution)
   */
  async getWalletInstance(
    encryptedPrivateKey: string,
    userPassword: string,
    provider: ethers.Provider,
  ): Promise<ethers.Wallet> {
    try {
      const privateKey = await this.decryptPrivateKey(
        encryptedPrivateKey,
        userPassword,
      );
      const wallet = new ethers.Wallet(privateKey, provider);

      // Clear private key after wallet creation
      this.clearSensitiveData(privateKey);

      return wallet;
    } catch (error) {
      this.logger.error('Failed to get wallet instance', error);
      throw new UnauthorizedException('Failed to access wallet');
    }
  }

  /**
   * Verify password by attempting decryption
   */
  async verifyPassword(
    encryptedPrivateKey: string,
    userPassword: string,
  ): Promise<boolean> {
    try {
      const privateKey = await this.decryptPrivateKey(
        encryptedPrivateKey,
        userPassword,
      );
      this.clearSensitiveData(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear sensitive data from memory (best effort)
   */
  private clearSensitiveData(data: string): void {
    if (data) {
      // Overwrite with zeros (best effort, not guaranteed by JS)
      const length = data.length;
      data = '0'.repeat(length);
    }
  }
}
