# Apple Wallet Dynamic Updates Implementation

## Overview

This document describes the implementation of Apple Wallet dynamic updates for the Loy Digital Loyalty Platform. The system enables real-time updates of Apple Wallet passes when customer balance or other data changes.

## Architecture

### Components Implemented

1. **WalletDevice Model** (`src/models/walletDevice.ts`)
   - Stores device registration information
   - Links customers to their registered devices
   - Tracks push tokens and update timestamps

2. **WalletDeviceRepository** (`src/services/repositories/walletDeviceRepository.ts`)
   - Handles database operations for wallet devices
   - Manages device registration/unregistration
   - Tracks pass update status

3. **PushNotificationService** (`src/services/pushNotification.service.ts`)
   - Integrates with Apple Push Notification Service (APNs)
   - Sends silent push notifications to trigger pass updates
   - Handles bulk notifications for multiple devices

4. **WalletController** (`src/controllers/wallet.controller.ts`)
   - Implements Apple's required web service endpoints
   - Handles device registration and pass delivery
   - Manages authentication and error logging

5. **Apple Wallet Authentication Middleware** (`src/utils/walletAuth.middleware.ts`)
   - Validates Apple Wallet web service requests
   - Ensures proper authentication using pass type identifier
   - Validates request parameters

6. **Wallet Routes** (`src/routes/wallet.route.ts`)
   - Defines Apple Wallet web service endpoints
   - Applies authentication and validation middleware

7. **Customer Service Integration** (`src/services/customerService.ts`)
   - Sends push notifications when balance changes
   - Integrates wallet updates into business logic

## Apple Wallet Web Service Endpoints

All endpoints are mounted under `/api/v1/wallet` and require Apple Wallet authentication.

### Device Registration
```
POST /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
```
- Registers a device to receive pass updates
- Stores push token for notifications

### Get Updatable Passes
```
GET /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier?passesUpdatedSince=:timestamp
```
- Returns serial numbers of passes that need updates
- Supports incremental updates based on timestamp

### Get Latest Pass
```
GET /v1/passes/:passTypeIdentifier/:serialNumber
```
- Returns the latest version of a pass
- Generates pass with current customer data

### Device Unregistration
```
DELETE /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
```
- Unregisters a device from receiving updates

### Error Logging
```
POST /v1/log
```
- Receives error logs from devices

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Apple Wallet
APPLE_WALLET_TEAM_ID=your-apple-team-id
APPLE_WALLET_PASS_TYPE_ID=pass.com.yourcompany.loy
APPLE_WALLET_CERTIFICATE_PATH=./certificates/apple-wallet.p12
APPLE_WALLET_CERTIFICATE_PASSWORD=your-certificate-password

# Apple Push Notification Service (APNs)
APNS_CERT_PATH=./certificates/apns-cert.pem
APNS_KEY_PATH=./certificates/apns-key.pem
APNS_PASSPHRASE=your-apns-certificate-passphrase
```

### Required Certificates

1. **Apple Wallet Certificate** (`.p12` format)
   - Used for signing wallet passes
   - Obtained from Apple Developer Portal

2. **APNs Certificate** (`.pem` format)
   - Used for sending push notifications
   - Separate certificate from wallet signing certificate

## Data Flow

### Pass Update Cycle

1. **Customer Balance Change**
   - Customer service updates balance in database
   - Triggers wallet update notification

2. **Push Notification**
   - System retrieves push tokens for customer's devices
   - Sends silent push notification via APNs
   - Marks passes as updated in database

3. **Device Response**
   - Device receives push notification
   - Queries for updatable passes
   - Downloads latest pass version

4. **Pass Display**
   - Device displays updated pass to user
   - User sees current balance and information

## Security

### Authentication
- All wallet endpoints require `Authorization: ApplePass <passTypeIdentifier>` header
- Pass type identifier must match configured value
- Request parameters are validated for format and security

### Data Protection
- Push tokens are securely stored and encrypted
- Customer data is protected during pass generation
- Error logs exclude sensitive information

## Testing

### Test Script
Run the comprehensive test script:
```bash
node test-apple-wallet-updates.js
```

### Manual Testing Steps

1. **Start the server**
   ```bash
   npm start
   ```

2. **Create a test customer**
   ```bash
   curl -X POST http://localhost:3000/api/v1/customers \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'
   ```

3. **Register a device**
   ```bash
   curl -X POST http://localhost:3000/api/v1/wallet/v1/devices/test-device/registrations/pass.com.loy.card/CUSTOMER_ID \
     -H "Authorization: ApplePass pass.com.loy.card" \
     -H "Content-Type: application/json" \
     -d '{"pushToken":"test-token"}'
   ```

4. **Update customer balance**
   ```bash
   curl -X POST http://localhost:3000/api/v1/customers/CUSTOMER_ID/credit \
     -H "Content-Type: application/json" \
     -d '{"amount":50,"description":"Test","source":"admin"}'
   ```

5. **Check for pass updates**
   ```bash
   curl -H "Authorization: ApplePass pass.com.loy.card" \
     http://localhost:3000/api/v1/wallet/v1/devices/test-device/registrations/pass.com.loy.card
   ```

## Monitoring and Logging

### Key Metrics to Monitor
- Push notification delivery rates
- Pass update request frequency
- Device registration/unregistration rates
- Error rates for wallet endpoints

### Log Messages
- Device registration events
- Push notification sending results
- Pass generation and delivery
- Authentication failures
- APNs connection status

## Troubleshooting

### Common Issues

1. **Push notifications not working**
   - Check APNs certificate validity
   - Verify certificate format (PEM)
   - Ensure production/sandbox environment matches

2. **Authentication failures**
   - Verify pass type identifier configuration
   - Check Authorization header format
   - Validate certificate permissions

3. **Pass generation errors**
   - Ensure wallet service is properly initialized
   - Check certificate paths and permissions
   - Verify template files exist

### Debug Commands

```bash
# Check APNs certificate
openssl x509 -in certificates/apns-cert.pem -text -noout

# Verify server health
curl http://localhost:3000/health

# Test wallet endpoint authentication
curl -H "Authorization: ApplePass pass.com.loy.card" \
  http://localhost:3000/api/v1/wallet/v1/log \
  -d '{"logs":[]}'
```

## Production Deployment

### Pre-deployment Checklist
- [ ] APNs certificates configured for production
- [ ] Pass type identifier registered with Apple
- [ ] Environment variables set correctly
- [ ] Database indexes created for wallet devices
- [ ] Monitoring and alerting configured
- [ ] Load testing completed

### Performance Considerations
- Push notifications are sent asynchronously
- Database queries are optimized with proper indexes
- Error handling prevents transaction failures
- Bulk notification sending for efficiency

## Future Enhancements

1. **Advanced Loyalty Features**
   - Dynamic loyalty levels based on spending
   - Personalized offers and promotions
   - Location-based notifications

2. **Analytics and Insights**
   - Pass usage analytics
   - Customer engagement metrics
   - A/B testing for pass designs

3. **Multi-tenant Support**
   - Support for multiple brands/businesses
   - Customizable pass templates
   - Brand-specific configurations

## Support and Maintenance

### Regular Tasks
- Monitor APNs certificate expiration
- Review push notification delivery rates
- Update pass templates as needed
- Clean up inactive device registrations

### Emergency Procedures
- APNs service outage handling
- Certificate renewal process
- Database recovery procedures
- Rollback procedures for failed deployments

---

For technical support or questions about this implementation, refer to the project documentation or contact the development team.
