# Wallet Security & Purchase System

## Overview

This system implements secure blockchain wallet management and share purchasing functionality. User private keys are encrypted and stored in the database, requiring a password for each transaction.

## Architecture

### 1. Wallet Security (`WalletService`)

**Encryption:** AES-256-GCM

- **Algorithm:** Industry-standard authenticated encryption
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **IV:** Unique 16-byte initialization vector per encryption
- **Auth Tag:** Prevents tampering with encrypted data
- **Master Key:** 256-bit key from environment variable

**Security Features:**

- Private keys NEVER stored in plaintext
- User password required for decryption
- Private keys cleared from memory immediately after use
- Separate encryption for each user
- Master key rotation support

### 2. Purchase Flow (`TransactionsService`)

```
1. User requests purchase estimate
   ↓
2. System calculates costs (shares + gas + platform fee)
   ↓
3. User confirms with password
   ↓
4. System verifies password
   ↓
5. System decrypts private key
   ↓
6. System creates wallet instance
   ↓
7. System signs transaction
   ↓
8. Private key cleared from memory
   ↓
9. Transaction sent to blockchain
   ↓
10. System tracks confirmation status
```

### 3. Transaction Tracking

**Database Schema:**

- Transaction ID (MongoDB ObjectId)
- User ID and wallet address
- Transaction type (PURCHASE, CLAIM_CREDITS, TRANSFER)
- Status (PENDING, CONFIRMING, CONFIRMED, FAILED)
- Project details
- Amount in DIONE and USD
- Gas fees and platform fees
- Blockchain transaction hash
- IP address and user agent (audit trail)
- Error messages if failed

**Status Flow:**

- PENDING → Transaction created, awaiting blockchain submission
- CONFIRMING → Submitted to blockchain, waiting for confirmations
- CONFIRMED → 3+ confirmations received
- FAILED → Transaction rejected or reverted

## API Endpoints

### Wallet Management

#### POST /users/wallet/create

Create a new wallet for authenticated user

```json
{
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Wallet created successfully. Keep your password safe!"
}
```

#### GET /users/wallet/info

Get wallet information (address only, never private key)

**Response:**

```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "hasWallet": true
}
```

#### POST /users/wallet/verify

Verify wallet password before purchase

```json
{
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "valid": true
}
```

### Transactions

#### POST /transactions/estimate

Get cost estimate before purchase

```json
{
  "projectId": 1,
  "shares": 10
}
```

**Response:**

```json
{
  "projectId": 1,
  "projectName": "Austin Solar Farm",
  "shares": 10,
  "pricePerShare": "0.01",
  "pricePerShareUSD": 0.00002,
  "totalCostDIONE": "0.1",
  "totalCostUSD": 0.0002,
  "platformFee": "0.0025",
  "platformFeeUSD": 0.000005,
  "estimatedGasFee": "0.001",
  "estimatedGasFeeUSD": 0.000002,
  "totalWithFees": "0.1035",
  "totalWithFeesUSD": 0.000207,
  "availableShares": 9990,
  "userBalance": "1.5",
  "userBalanceUSD": 0.003,
  "sufficientBalance": true
}
```

#### POST /transactions/purchase

Execute share purchase

```json
{
  "projectId": 1,
  "shares": 10,
  "password": "SecurePassword123!",
  "twoFactorCode": "123456" // Optional, for future 2FA
}
```

**Response:**

```json
{
  "success": true,
  "transactionId": "507f1f77bcf86cd799439011",
  "transactionHash": "0x1234...abcd",
  "projectId": 1,
  "shares": 10,
  "totalCost": "0.1",
  "platformFee": "0.0025",
  "gasFee": "0.001",
  "message": "Purchase transaction submitted successfully"
}
```

#### GET /transactions/:id

Get transaction status

**Response:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f191e810c19729de860ea",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "type": "PURCHASE",
  "status": "CONFIRMED",
  "projectId": 1,
  "projectName": "Austin Solar Farm",
  "shares": 10,
  "amountDIONE": "0.1",
  "amountUSD": 0.0002,
  "pricePerShare": "0.01",
  "platformFee": "0.0025",
  "gasFee": "0.00089",
  "transactionHash": "0x1234...abcd",
  "blockNumber": 12345,
  "confirmations": 3,
  "ipAddress": "192.168.1.1",
  "createdAt": "2025-12-06T10:30:00.000Z",
  "updatedAt": "2025-12-06T10:32:15.000Z"
}
```

#### GET /transactions/my-transactions

Get user transaction history with pagination

**Query Params:**

- `limit`: Number of transactions to return (default: 50)
- `skip`: Number of transactions to skip (default: 0)

**Response:**

```json
{
  "transactions": [...],
  "total": 25
}
```

#### GET /transactions/project/:projectId

Get all purchases for a specific project

**Query Params:**

- `limit`: Number of transactions (default: 50)

## Security Best Practices

### Development

1. Generate secure master key:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add to `.env`:

   ```
   WALLET_MASTER_KEY=your_64_character_hex_key
   ```

3. NEVER commit `.env` to version control

### Production

#### 1. Secret Management

- Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
- Rotate master key annually with migration strategy
- Use different keys for dev/staging/prod
- Implement key versioning for zero-downtime rotation

#### 2. Rate Limiting

```typescript
// Implement with @nestjs/throttler
@Throttle(5, 60) // 5 purchases per minute
async purchaseShares() { ... }
```

#### 3. Two-Factor Authentication

```typescript
// Verify 2FA before transaction
if (user.twoFactorEnabled) {
  await this.twoFactorService.verify(dto.twoFactorCode);
}
```

#### 4. Audit Logging

- Log all wallet access attempts
- Log all transaction attempts (success and failure)
- Monitor for suspicious patterns
- Alert on multiple failed password attempts

#### 5. Monitoring

- Transaction success/failure rates
- Average confirmation time
- Failed password attempts
- Unusual transaction patterns
- Gas price alerts

#### 6. Backup & Recovery

- Document wallet recovery process
- Test recovery procedures regularly
- Maintain encrypted backups of master key
- Implement key escrow for enterprise

## Smart Contract Integration

### Purchase Function

```solidity
function purchaseShares(uint256 projectId, uint256 shares)
    external
    payable
    nonReentrant
    whenNotPaused
{
    // Validates shares available
    // Calculates platform fee (2.5%)
    // Transfers funds to project and platform wallets
    // Mints ERC1155 tokens to buyer
    // Updates investment tracking
}
```

### Gas Optimization

- Conservative gas limit: 300,000 units
- Typical usage: ~180,000 units
- Current gas price: Dynamic from network

## Error Handling

### Common Errors

| Error                    | Cause                            | Solution                        |
| ------------------------ | -------------------------------- | ------------------------------- |
| Invalid password         | Wrong wallet password            | Re-enter correct password       |
| Insufficient balance     | Not enough DIONE                 | Fund wallet first               |
| Exceeds available shares | Project sold out                 | Choose fewer shares             |
| Transaction reverted     | Smart contract validation failed | Check project status            |
| Confirmation timeout     | Network congestion               | Transaction still pending, wait |

### Recovery Procedures

**Lost Password:**

- Private key is encrypted with user password
- If password lost, wallet is UNRECOVERABLE
- Users must backup their passwords securely
- Consider implementing password reset with security questions (enterprise only)

**Failed Transaction:**

- PENDING status: Transaction not yet submitted
- CONFIRMING status: Wait for blockchain confirmations
- FAILED status: Funds automatically refunded by smart contract
- Check transaction hash on blockchain explorer

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:e2e
```

### Manual Testing Flow

1. Create wallet: POST /users/wallet/create
2. Fund wallet with testnet DIONE
3. Get estimate: POST /transactions/estimate
4. Execute purchase: POST /transactions/purchase
5. Monitor status: GET /transactions/:id
6. Verify on blockchain: Check transaction hash
7. Verify shares: GET /investors/:address/portfolio

## Monitoring & Alerts

### Key Metrics

- Purchase success rate (target: >99%)
- Average confirmation time (target: <3 minutes)
- Failed password attempts per user (alert: >3 in 10 minutes)
- Wallet creation rate (monitor for abuse)
- Transaction fee costs

### Alert Conditions

- Multiple purchase failures
- Unusual transaction patterns
- High gas prices
- Failed confirmations
- Database encryption errors

## Compliance

### Data Protection

- Private keys encrypted at rest (AES-256-GCM)
- Private keys never in logs
- Password never stored (only used for encryption/decryption)
- GDPR compliant (right to deletion, encrypted storage)

### Financial Regulations

- KYC/AML: Implement user verification before wallet creation
- Transaction limits: Implement daily/monthly limits
- Reporting: Log all transactions for regulatory reporting
- Geographic restrictions: Implement region-based access control

## Future Enhancements

1. **Hardware Wallet Support:** Integrate with Ledger/Trezor
2. **Multi-Sig Wallets:** For enterprise accounts
3. **Gasless Transactions:** Meta-transactions for better UX
4. **Batch Purchases:** Buy shares in multiple projects at once
5. **Auto-Investment:** Recurring purchase schedules
6. **Price Alerts:** Notify users of price changes
7. **Mobile SDK:** React Native wallet management
8. **Biometric Auth:** Fingerprint/Face ID for mobile

## Support

For security issues, contact: security@solaria.io
For general support: support@solaria.io

## License

MIT
