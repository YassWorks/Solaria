# Secure Share Purchase System - Testing Guide

## Prerequisites

1. **Generate Master Key for Wallet Encryption:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Add to `.env`:**
```env
WALLET_MASTER_KEY=<your_64_character_hex_from_step_1>
DIONE_RPC_URL=https://rpc.dione.io
CONTRACT_ADDRESS=0x46b95E77B72d3e973853150d91bF7aB00f0d3dC7
MONGO_URI=mongodb://localhost:27017/solaria
JWT_SECRET=your_jwt_secret
```

3. **Start MongoDB:**
```bash
docker run -d -p 27017:27017 --name solaria-mongo mongo:latest
```

4. **Start Server:**
```bash
pnpm run start:dev
```

## API Testing Flow

### 1. Register & Login

**Register User:**
```bash
POST http://localhost:5000/auth/register
Content-Type: application/json

{
  "email": "investor@example.com",
  "password": "SecurePassword123!",
  "fullname": "John Investor",
  "phone": "+1234567890",
  "cin": "ABC123456",
  "role": "USER"
}
```

**Login:**
```bash
POST http://localhost:5000/auth/login
Content-Type: application/json

{
  "email": "investor@example.com",
  "password": "SecurePassword123!"
}
```

**Save the JWT token from response.**

---

### 2. Create Wallet

**Create Wallet:**
```bash
POST http://localhost:5000/users/wallet/create
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

{
  "password": "MyWalletPassword123!"
}
```

**Response:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Wallet created successfully. Keep your password safe!"
}
```

**⚠️ IMPORTANT:** Save your wallet password! It's required for ALL purchases.

---

### 3. Fund Wallet (Testnet)

**Get Testnet DIONE from faucet or transfer manually.**

Your wallet address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

**Check Balance:**
```bash
GET http://localhost:5000/blockchain/balance/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

---

### 4. View Available Projects

**Get All Projects:**
```bash
GET http://localhost:5000/projects
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Get Project Details:**
```bash
GET http://localhost:5000/projects/1
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Example Response:**
```json
{
  "id": 1,
  "name": "Austin Solar Farm",
  "location": "Austin, TX",
  "totalShares": 10000,
  "sharesSold": 150,
  "pricePerShare": "0.01",
  "status": 1,
  "installationSizeKw": 500
}
```

---

### 5. Estimate Purchase Cost

**Get Estimate:**
```bash
POST http://localhost:5000/transactions/estimate
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

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
  "availableShares": 9850,
  "userBalance": "1.5",
  "userBalanceUSD": 0.003,
  "sufficientBalance": true
}
```

---

### 6. Purchase Shares

**Execute Purchase:**
```bash
POST http://localhost:5000/transactions/purchase
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

{
  "projectId": 1,
  "shares": 10,
  "password": "MyWalletPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "507f1f77bcf86cd799439011",
  "transactionHash": "0x1234567890abcdef...",
  "projectId": 1,
  "shares": 10,
  "totalCost": "0.1",
  "platformFee": "0.0025",
  "gasFee": "0.001",
  "message": "Purchase transaction submitted successfully"
}
```

---

### 7. Track Transaction Status

**Get Transaction Details:**
```bash
GET http://localhost:5000/transactions/507f1f77bcf86cd799439011
Authorization: Bearer <YOUR_JWT_TOKEN>
```

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
  "transactionHash": "0x1234567890abcdef...",
  "blockNumber": 12345,
  "confirmations": 3,
  "createdAt": "2025-12-06T10:30:00.000Z",
  "updatedAt": "2025-12-06T10:32:15.000Z"
}
```

**Status Flow:**
- `PENDING` → Transaction created
- `CONFIRMING` → Submitted to blockchain
- `CONFIRMED` → 3+ confirmations (SUCCESS!)
- `FAILED` → Transaction reverted

---

### 8. View Your Portfolio

**Get Portfolio:**
```bash
GET http://localhost:5000/investors/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/portfolio
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Response:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "totalInvestedDIONE": "0.1",
  "totalInvestedUSD": 0.0002,
  "portfolio": [
    {
      "projectId": 1,
      "projectName": "Austin Solar Farm",
      "shares": 10,
      "totalInvested": "0.1",
      "lifetimeKwhEarned": 0,
      "claimableKwh": 0
    }
  ]
}
```

---

### 9. View Transaction History

**Get Your Transactions:**
```bash
GET http://localhost:5000/transactions/my-transactions?limit=50&skip=0
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Get Project Transactions:**
```bash
GET http://localhost:5000/transactions/project/1?limit=50
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## Security Features Verification

### 1. Password Required for Purchase
Try purchasing without password:
```bash
POST http://localhost:5000/transactions/purchase
{
  "projectId": 1,
  "shares": 10
}
```
**Expected:** 400 Bad Request - password required

### 2. Invalid Password Protection
Try with wrong password:
```bash
POST http://localhost:5000/transactions/purchase
{
  "projectId": 1,
  "shares": 10,
  "password": "WrongPassword123!"
}
```
**Expected:** 401 Unauthorized - Invalid password

### 3. Insufficient Balance Protection
Try buying more than balance allows:
```bash
POST http://localhost:5000/transactions/estimate
{
  "projectId": 1,
  "shares": 1000000
}
```
**Expected:** `sufficientBalance: false` in response

### 4. Wallet Creation - Can't Duplicate
Try creating wallet twice:
```bash
POST http://localhost:5000/users/wallet/create
{
  "password": "AnotherPassword123!"
}
```
**Expected:** 400 Bad Request - User already has a wallet

---

## Testing Scenarios

### Scenario 1: Complete Purchase Flow
1. ✅ Register user
2. ✅ Login and get JWT
3. ✅ Create wallet
4. ✅ Fund wallet with testnet DIONE
5. ✅ View projects
6. ✅ Estimate purchase
7. ✅ Execute purchase with password
8. ✅ Monitor transaction status
9. ✅ Verify portfolio updated
10. ✅ Check transaction history

### Scenario 2: Failed Purchase (Insufficient Funds)
1. Create wallet with minimal funds
2. Try purchasing large amount
3. Verify estimate shows insufficient balance
4. Verify transaction rejected

### Scenario 3: Failed Purchase (Wrong Password)
1. Attempt purchase with incorrect password
2. Verify 401 Unauthorized error
3. Verify no transaction record created
4. Verify funds not deducted

### Scenario 4: Transaction Confirmation Monitoring
1. Execute purchase
2. Immediately check status (should be CONFIRMING)
3. Wait 30-60 seconds
4. Check status again (should be CONFIRMED with 3+ confirmations)
5. Verify blockNumber and transactionHash present

---

## Swagger UI Testing

**Open Swagger:**
```
http://localhost:5000/api
```

**Authorize:**
1. Click "Authorize" button
2. Enter: `Bearer <YOUR_JWT_TOKEN>`
3. All endpoints now authenticated

**Test Endpoints:**
- Try all endpoints in Swagger UI
- View request/response schemas
- Test validation errors

---

## Error Scenarios

### 1. Missing Master Key
Remove `WALLET_MASTER_KEY` from .env:
```
Expected: Server fails to start with error
"WALLET_MASTER_KEY must be set in .env (64 hex characters)"
```

### 2. Invalid Master Key Length
Set wrong length:
```env
WALLET_MASTER_KEY=abc123  # Too short
```
```
Expected: Server fails to start
```

### 3. Network Issues
Disconnect from blockchain:
```
Expected: Purchase fails with network error
Transaction marked as FAILED
Funds not deducted from wallet
```

---

## Database Verification

**Connect to MongoDB:**
```bash
docker exec -it solaria-mongo mongosh
use solaria
```

**Check Collections:**
```javascript
// View users with wallets
db.users.find({ walletAddress: { $exists: true } }).pretty()

// View transactions
db.transactions.find().sort({ createdAt: -1 }).pretty()

// View investors
db.investors.find().pretty()
```

**Verify Encryption:**
```javascript
// Check encrypted wallet (should be long encrypted string)
db.users.findOne({ email: "investor@example.com" }, { encryptedWallet: 1 })
```

**Expected:** Long encrypted string with format `salt:iv:authTag:encrypted`

---

## Performance Testing

### Load Test (10 concurrent purchases):
```bash
# Install autocannon
npm install -g autocannon

# Test purchase endpoint
autocannon -c 10 -d 30 \
  -m POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -b '{"projectId":1,"shares":1,"password":"MyWalletPassword123!"}' \
  http://localhost:5000/transactions/purchase
```

**Expected:**
- All requests succeed or fail gracefully
- No memory leaks
- Proper rate limiting (if implemented)

---

## Security Audit Checklist

- [ ] Private keys never logged
- [ ] Private keys encrypted in database
- [ ] Password never stored (only used for encryption)
- [ ] Master key in .env (not committed)
- [ ] All purchase attempts logged with IP
- [ ] Failed password attempts tracked
- [ ] Transaction confirmations verified
- [ ] Gas price estimates accurate
- [ ] Platform fee calculated correctly (2.5%)
- [ ] Insufficient balance prevented
- [ ] Smart contract validation working

---

## Troubleshooting

### Issue: "Invalid password or corrupted data"
**Cause:** Wrong password or database encryption key changed
**Solution:** Use correct password from wallet creation

### Issue: "Transaction reverted on blockchain"
**Cause:** Smart contract validation failed (e.g., not enough shares)
**Solution:** Check project status and available shares

### Issue: Transaction stuck in CONFIRMING
**Cause:** Network congestion or gas price too low
**Solution:** Wait longer, transaction will eventually confirm or fail

### Issue: "Wallet not configured"
**Cause:** User hasn't created wallet yet
**Solution:** Create wallet first: POST /users/wallet/create

---

## Next Steps

1. **Production Deployment:**
   - Use AWS Secrets Manager for WALLET_MASTER_KEY
   - Implement rate limiting (5 purchases/minute)
   - Enable 2FA for high-value transactions
   - Set up monitoring and alerts

2. **Enhancements:**
   - Add batch purchase (multiple projects)
   - Implement gasless transactions
   - Add price alerts
   - Mobile SDK for wallet management

3. **Compliance:**
   - Add KYC/AML verification
   - Implement transaction limits
   - Add regulatory reporting
   - Geographic restrictions

---

## Support

- **Security Issues:** security@solaria.io
- **Documentation:** See PURCHASE_SECURITY.md
- **API Docs:** http://localhost:5000/api

**Happy Testing! 🚀**
