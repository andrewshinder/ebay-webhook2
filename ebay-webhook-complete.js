/**
 * eBay Marketplace Account Deletion Webhook
 * Deploy this to get eBay production API access
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Your verification token - eBay will use this to verify notifications
const VERIFICATION_TOKEN = 'pokemon-cards-webhook-2024-secure-abc123';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check - shows your server is running
app.get('/', (req, res) => {
    res.json({
        status: '✅ eBay Webhook Server Running',
        message: 'Ready to handle eBay marketplace notifications',
        endpoints: {
            'account-deletion': '/ebay/account-deletion',
            'health': '/health'
        },
        timestamp: new Date().toISOString(),
        verificationToken: VERIFICATION_TOKEN
    });
});

// Health endpoint for monitoring
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Main eBay webhook endpoint - THIS IS WHAT eBay CALLS
app.post('/ebay/account-deletion', (req, res) => {
    const timestamp = new Date().toISOString();
    
    console.log(`📨 [${timestamp}] eBay webhook received`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
        // Handle eBay's challenge verification (required for setup)
        if (req.body.challenge_code) {
            console.log('🔐 Processing challenge verification...');
            
            const challengeCode = req.body.challenge_code;
            const verificationToken = req.body.verification_token;
            
            // Verify the token matches what we expect
            if (verificationToken !== VERIFICATION_TOKEN) {
                console.log(`❌ Token mismatch. Expected: ${VERIFICATION_TOKEN}, Got: ${verificationToken}`);
                return res.status(401).json({ 
                    error: 'Invalid verification token',
                    expected: VERIFICATION_TOKEN,
                    received: verificationToken
                });
            }
            
            // Create the challenge response eBay expects
            const challengeResponse = crypto
                .createHash('sha256')
                .update(challengeCode + VERIFICATION_TOKEN)
                .digest('hex');
            
            console.log(`✅ Challenge verified. Response: ${challengeResponse}`);
            
            return res.status(200).json({
                challengeResponse: challengeResponse
            });
        }
        
        // Handle actual marketplace account deletion notifications
        if (req.body.notification_type === 'MARKETPLACE_ACCOUNT_DELETION') {
            console.log('🗑️ Processing account deletion notification...');
            
            const notificationData = {
                type: req.body.notification_type,
                username: req.body.username || 'unknown',
                user_id: req.body.user_id || 'unknown',
                marketplace: req.body.marketplace || 'unknown',
                timestamp: timestamp
            };
            
            console.log('Account deletion details:', notificationData);
            
            // In a real app, you would:
            // 1. Delete user data from your database
            // 2. Remove stored personal information
            // 3. Log the action for compliance
            
            // For now, just acknowledge successful processing
            return res.status(200).json({
                status: 'success',
                message: 'Account deletion notification processed',
                processedAt: timestamp,
                notificationData: notificationData
            });
        }
        
        // Handle any other webhook notifications
        console.log('📌 Other notification received');
        return res.status(200).json({
            status: 'received',
            message: 'Notification processed successfully',
            timestamp: timestamp,
            body: req.body
        });
        
    } catch (error) {
        console.error(`💥 Error processing webhook: ${error.message}`);
        console.error(error.stack);
        
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error processing notification',
            error: error.message,
            timestamp: timestamp
        });
    }
});

// Handle any other POST requests
app.post('*', (req, res) => {
    console.log(`📬 Unknown POST to: ${req.path}`);
    res.status(404).json({ 
        error: 'Endpoint not found',
        available: '/ebay/account-deletion',
        path: req.path
    });
});

// Handle GET requests to unknown paths
app.get('*', (req, res) => {
    if (req.path !== '/' && req.path !== '/health') {
        res.status(404).json({
            error: 'Page not found',
            available: ['/', '/health'],
            webhookEndpoint: '/ebay/account-deletion (POST only)'
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log('🎉 eBay Webhook Server Started Successfully!');
    console.log('');
    console.log('📊 SERVER INFO:');
    console.log(`   🌐 Port: ${PORT}`);
    console.log(`   🏠 Local: http://localhost:${PORT}`);
    console.log(`   📋 Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('🔗 WEBHOOK ENDPOINT:');
    console.log(`   📍 Path: /ebay/account-deletion`);
    console.log(`   🔐 Token: ${VERIFICATION_TOKEN}`);
    console.log('');
    console.log('📝 FOR eBay PRODUCTION SETUP:');
    console.log(`   🌍 URL: [YOUR-DEPLOYED-URL]/ebay/account-deletion`);
    console.log(`   🎟️  Token: ${VERIFICATION_TOKEN}`);
    console.log('');
    console.log('✅ Ready to receive eBay notifications!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;