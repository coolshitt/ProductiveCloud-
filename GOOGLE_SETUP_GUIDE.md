# 🚀 Google Drive Sync Setup Guide - Productive Cloud

## Overview
This guide will help you set up Google Drive integration for automatic online backup and cross-device synchronization of your Productive Cloud data.

## 🔑 Prerequisites
- Google account
- Basic understanding of web development concepts
- Access to Google Cloud Console

## 📋 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name: `ProductiveCloud-Sync`
   - Click "Create"

3. **Select Your Project**
   - Make sure your new project is selected in the dropdown

### Step 2: Enable Google Drive API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" > "Library"

2. **Search for Google Drive API**
   - Search for "Google Drive API"
   - Click on "Google Drive API" from results

3. **Enable the API**
   - Click "Enable" button
   - Wait for the API to be enabled

### Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - In the left sidebar, click "APIs & Services" > "Credentials"

2. **Create Credentials**
   - Click "Create Credentials" button
   - Select "OAuth 2.0 Client IDs"

3. **Configure OAuth Consent Screen**
   - If prompted, click "Configure Consent Screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: `Productive Cloud`
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - Skip scopes section, click "Save and Continue"
   - Add test users if needed
   - Click "Save and Continue"

4. **Create OAuth Client ID**
   - Application type: `Web application`
   - Name: `Productive Cloud Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `http://localhost` (for local development)
     - Your actual domain (when deployed)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for local development)
     - `http://localhost` (for local development)
     - Your actual domain (when deployed)
   - Click "Create"

5. **Copy Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Keep these secure!

### Step 4: Create API Key

1. **Create API Key**
   - In Credentials page, click "Create Credentials"
   - Select "API key"

2. **Restrict API Key** (Recommended)
   - Click on the created API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domains
   - Under "API restrictions", select "Restrict key"
   - Select "Google Drive API"
   - Click "Save"

3. **Copy API Key**
   - Copy the API key

### Step 5: Update Configuration

1. **Edit `google-sync.js`**
   - Open `google-sync.js` in your code editor
   - Replace the placeholder values:

```javascript
constructor() {
    this.clientId = 'YOUR_ACTUAL_CLIENT_ID_HERE'; // Replace with your OAuth client ID
    this.apiKey = 'YOUR_ACTUAL_API_KEY_HERE'; // Replace with your API key
    // ... rest of the code
}
```

2. **Save the file**

### Step 6: Test the Integration

1. **Open Google Sync Panel**
   - Open `google-sync-panel.html` in your browser
   - Check browser console for any errors

2. **Sign In**
   - Click "Sign In to Google"
   - Complete OAuth flow
   - Grant necessary permissions

3. **Test Sync**
   - Click "Manual Sync" to test cloud backup
   - Check sync status and logs

## 🔧 Configuration Options

### Auto-Sync Interval
The default auto-sync interval is 5 minutes. You can modify this in `google-sync.js`:

```javascript
// In startAutoSync() method
this.syncInterval = setInterval(async () => {
    if (this.isAuthenticated) {
        await this.syncToCloud();
    }
}, 5 * 60 * 1000); // Change 5 to desired minutes
```

### Backup Folder Name
The backup folder name can be customized:

```javascript
// In ensureBackupFolder() method
const folderMetadata = {
    name: 'ProductiveCloud_Backups', // Change this name
    mimeType: 'application/vnd.google-apps.folder',
    description: 'Productive Cloud automatic backups and sync data'
};
```

## 🚨 Security Considerations

1. **Keep Credentials Secure**
   - Never commit API keys to public repositories
   - Use environment variables in production
   - Regularly rotate API keys

2. **Restrict API Access**
   - Limit API key to specific domains
   - Use OAuth consent screen restrictions
   - Monitor API usage

3. **Data Privacy**
   - All data is encrypted in transit
   - Google Drive provides additional security
   - Consider data retention policies

## 🐛 Troubleshooting

### Common Issues

1. **"Google API not available"**
   - Check if Google API script is loaded
   - Verify internet connection
   - Check browser console for errors

2. **"OAuth consent screen not configured"**
   - Complete OAuth consent screen setup
   - Add your domain to authorized origins
   - Wait for changes to propagate (may take up to 24 hours)

3. **"API key not valid"**
   - Verify API key is correct
   - Check if API key has proper restrictions
   - Ensure Google Drive API is enabled

4. **"Permission denied"**
   - Check OAuth scopes
   - Verify user has granted permissions
   - Check if user is in test users list

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
// Enable verbose logging
localStorage.setItem('google_sync_debug', 'true');

// Check sync status
console.log('Sync Status:', window.googleDriveSync.getSyncStatus());

// Check authentication
console.log('Authenticated:', window.googleDriveSync.isAuthenticated);
```

## 📱 Integration with Main App

### Adding Sync Button to Main App

1. **Include Google Sync Script**
   ```html
   <script src="https://apis.google.com/js/api.js"></script>
   <script src="google-sync.js"></script>
   ```

2. **Add Sync Button**
   ```html
   <button onclick="window.googleDriveSync.manualSync()">🔄 Sync to Cloud</button>
   <button onclick="window.googleDriveSync.manualRestore()">📥 Restore from Cloud</button>
   ```

3. **Check Sync Status**
   ```javascript
   const status = window.googleDriveSync.getSyncStatus();
   console.log('Last sync:', status.lastSyncTime);
   ```

## 🌐 Production Deployment

### Domain Configuration
1. **Update OAuth Credentials**
   - Add your production domain to authorized origins
   - Update redirect URIs
   - Remove localhost origins

2. **Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_API_KEY=your_api_key
   ```

3. **HTTPS Required**
   - Google OAuth requires HTTPS in production
   - Ensure SSL certificate is valid

## 📊 Monitoring and Analytics

### Google Cloud Console
- **APIs & Services > Dashboard**: Monitor API usage
- **APIs & Services > Credentials**: Manage credentials
- **IAM & Admin > IAM**: User access management

### Application Logs
- Check browser console for sync logs
- Monitor sync status in the control panel
- Review Google Drive backup folder

## 🔄 Backup and Recovery

### Manual Backup
```javascript
// Force immediate sync
await window.googleDriveSync.manualSync();
```

### Manual Restore
```javascript
// Restore from latest cloud backup
await window.googleDriveSync.manualRestore();
```

### Backup History
- Check Google Drive folder: `ProductiveCloud_Backups`
- Each backup includes timestamp and device info
- Automatic cleanup can be implemented

## 🎯 Next Steps

1. **Test thoroughly** with your data
2. **Monitor sync performance** and reliability
3. **Implement error handling** for production use
4. **Add user notifications** for sync events
5. **Consider implementing** conflict resolution for multi-device sync

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Google Cloud configuration
3. Test with minimal data first
4. Check Google Cloud Console for API errors

---

**🎉 Congratulations!** Your Productive Cloud now has enterprise-grade cloud synchronization capabilities!
