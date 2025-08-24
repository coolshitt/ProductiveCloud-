/**
 * 🚀 Google Drive Integration for Productive Cloud
 * Provides automatic online backup, real-time sync, and cross-device data handling
 */

class GoogleDriveSync {
    constructor() {
        this.clientId = '909901612935-18hopd0jrr5ng5637b0930149iuctia5.apps.googleusercontent.com';
        this.apiKey = 'YOUR_GOOGLE_API_KEY'; // Replace with your actual API key from Google Cloud Console
        this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        this.scopes = 'https://www.googleapis.com/auth/drive.file';
        
        this.isAuthenticated = false;
        this.accessToken = null;
        this.backupFolderId = null;
        this.syncInterval = null;
        this.lastSyncTime = null;
        
        this.initializeGoogleAPI();
    }
    
    /**
     * Initialize Google API client
     */
    initializeGoogleAPI() {
        try {
            // Check if API key is configured
            if (this.apiKey === 'YOUR_GOOGLE_API_KEY') {
                console.error('❌ Google API Key not configured!');
                console.error('Please update the apiKey in google-sync.js with your actual API key from Google Cloud Console');
                this.showSetupError();
                return;
            }
            
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    apiKey: this.apiKey,
                    clientId: this.clientId,
                    discoveryDocs: this.discoveryDocs,
                    scope: this.scopes
                }).then(() => {
                    console.log('✅ Google API initialized successfully');
                    this.setupAuthListeners();
                }).catch(error => {
                    console.error('❌ Google API initialization failed:', error);
                    this.showSetupError();
                });
            });
        } catch (error) {
            console.error('❌ Error loading Google API:', error);
            this.showSetupError();
        }
    }
    
    /**
     * Show setup error message
     */
    showSetupError() {
        const errorMessage = `
🚨 Google Drive Sync Setup Required!

To enable Google Drive sync, you need to:

1. Go to Google Cloud Console
2. Create an API Key
3. Update the apiKey in google-sync.js

Current Status:
✅ Client ID: Configured
❌ API Key: Missing

See GOOGLE_SETUP_GUIDE.md for detailed instructions.
        `;
        
        console.error(errorMessage);
        
        // Show error in UI if sync panel is available
        if (typeof addLogEntry === 'function') {
            addLogEntry('❌ API Key not configured. Please follow setup guide.', 'error');
        }
    }
    
    /**
     * Setup authentication listeners
     */
    setupAuthListeners() {
        gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => {
            this.isAuthenticated = isSignedIn;
            if (isSignedIn) {
                this.onSignIn();
            } else {
                this.onSignOut();
            }
        });
    }
    
    /**
     * Sign in to Google
     */
    async signIn() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance.isSignedIn.get()) {
                await authInstance.signIn();
                this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
                console.log('✅ Signed in to Google Drive');
                return true;
            }
            return true;
        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            return false;
        }
    }
    
    /**
     * Sign out from Google
     */
    async signOut() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            this.isAuthenticated = false;
            this.accessToken = null;
            this.stopAutoSync();
            console.log('✅ Signed out from Google Drive');
        } catch (error) {
            console.error('❌ Google sign-out failed:', error);
        }
    }
    
    /**
     * Handle successful sign-in
     */
    async onSignIn() {
        this.isAuthenticated = true;
        this.accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        
        // Create or find backup folder
        await this.ensureBackupFolder();
        
        // Start auto-sync
        this.startAutoSync();
        
        // Perform initial sync
        await this.syncToCloud();
        
        console.log('✅ Google Drive sync activated');
    }
    
    /**
     * Handle sign-out
     */
    onSignOut() {
        this.isAuthenticated = false;
        this.accessToken = null;
        this.stopAutoSync();
        console.log('ℹ️ Google Drive sync deactivated');
    }
    
    /**
     * Ensure backup folder exists in Google Drive
     */
    async ensureBackupFolder() {
        try {
            // Search for existing backup folder
            const response = await gapi.client.drive.files.list({
                q: "name='ProductiveCloud_Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                spaces: 'drive'
            });
            
            if (response.result.files.length > 0) {
                this.backupFolderId = response.result.files[0].id;
                console.log('✅ Found existing backup folder');
            } else {
                // Create new backup folder
                const folderMetadata = {
                    name: 'ProductiveCloud_Backups',
                    mimeType: 'application/vnd.google-apps.folder',
                    description: 'Productive Cloud automatic backups and sync data'
                };
                
                const folder = await gapi.client.drive.files.create({
                    resource: folderMetadata,
                    fields: 'id'
                });
                
                this.backupFolderId = folder.result.id;
                console.log('✅ Created new backup folder');
            }
        } catch (error) {
            console.error('❌ Error ensuring backup folder:', error);
        }
    }
    
    /**
     * Start automatic synchronization
     */
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Sync every 5 minutes
        this.syncInterval = setInterval(async () => {
            if (this.isAuthenticated) {
                await this.syncToCloud();
            }
        }, 5 * 60 * 1000);
        
        console.log('🔄 Auto-sync started (every 5 minutes)');
    }
    
    /**
     * Stop automatic synchronization
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Auto-sync stopped');
        }
    }
    
    /**
     * Sync local data to Google Drive
     */
    async syncToCloud() {
        if (!this.isAuthenticated || !this.backupFolderId) {
            console.log('⚠️ Cannot sync: not authenticated or no backup folder');
            return false;
        }
        
        try {
            console.log('🔄 Starting cloud sync...');
            
            // Get all local data
            const syncData = this.prepareSyncData();
            
            // Create backup file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `productive_cloud_backup_${timestamp}.json`;
            
            // Upload to Google Drive
            const fileMetadata = {
                name: fileName,
                parents: [this.backupFolderId],
                description: 'Productive Cloud automatic backup'
            };
            
            const file = await gapi.client.drive.files.create({
                resource: fileMetadata,
                media: {
                    mimeType: 'application/json',
                    body: JSON.stringify(syncData, null, 2)
                }
            });
            
            this.lastSyncTime = new Date();
            console.log('✅ Cloud sync completed successfully');
            
            // Store sync metadata locally
            this.storeSyncMetadata(file.result.id, fileName);
            
            return true;
        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            return false;
        }
    }
    
    /**
     * Prepare data for cloud sync
     */
    prepareSyncData() {
        const syncData = {
            exportInfo: {
                app: 'Productive Cloud',
                version: '2.0',
                exportDate: new Date().toISOString(),
                syncType: 'automatic',
                source: 'google_drive_sync'
            },
            modules: {},
            system: {
                syncTimestamp: new Date().toISOString(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            }
        };
        
        // Add CRM data
        const crmProjects = localStorage.getItem('projectCRM_projects');
        const crmTheme = localStorage.getItem('projectCRM_theme');
        const crmTimerState = localStorage.getItem('crm_timer_state');
        
        if (crmProjects || crmTheme || crmTimerState) {
            try {
                syncData.modules.crm = {
                    module: 'Project CRM',
                    version: '1.0',
                    data: {
                        projects: crmProjects ? JSON.parse(crmProjects) : [],
                        theme: crmTheme || 'light',
                        timer: crmTimerState ? JSON.parse(crmTimerState) : { totalTime: 0, savedSessions: [] }
                    }
                };
            } catch (error) {
                console.warn('⚠️ Error preparing CRM data for sync:', error);
            }
        }
        
        // Add habits data
        const habits = localStorage.getItem('habits');
        const progress = localStorage.getItem('progress');
        const theme = localStorage.getItem('theme');
        
        if (habits || progress || theme) {
            try {
                syncData.modules.habits = {
                    module: 'Habit Tracker',
                    version: '1.0',
                    data: {
                        habits: habits ? JSON.parse(habits) : [],
                        progress: progress ? JSON.parse(progress) : {},
                        theme: theme || 'light'
                    }
                };
            } catch (error) {
                console.warn('⚠️ Error preparing habits data for sync:', error);
            }
        }
        
        // Add other localStorage data
        const otherData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !key.startsWith('projectCRM_') && !key.startsWith('crm_') && key !== 'habits' && key !== 'progress' && key !== 'theme') {
                try {
                    otherData[key] = localStorage.getItem(key);
                } catch (error) {
                    console.warn(`⚠️ Error reading localStorage key ${key}:`, error);
                }
            }
        }
        
        if (Object.keys(otherData).length > 0) {
            syncData.localStorage = {
                note: 'Additional application data',
                data: otherData
            };
        }
        
        return syncData;
    }
    
    /**
     * Store sync metadata locally
     */
    storeSyncMetadata(fileId, fileName) {
        const syncMetadata = {
            lastSyncTime: this.lastSyncTime.toISOString(),
            lastSyncFile: fileName,
            lastSyncFileId: fileId,
            syncStatus: 'success'
        };
        
        localStorage.setItem('google_sync_metadata', JSON.stringify(syncMetadata));
    }
    
    /**
     * Restore data from Google Drive
     */
    async restoreFromCloud() {
        if (!this.isAuthenticated || !this.backupFolderId) {
            console.log('⚠️ Cannot restore: not authenticated or no backup folder');
            return false;
        }
        
        try {
            console.log('🔄 Starting cloud restore...');
            
            // Get latest backup file
            const response = await gapi.client.drive.files.list({
                q: `'${this.backupFolderId}' in parents and mimeType='application/json' and trashed=false`,
                orderBy: 'createdTime desc',
                pageSize: 1,
                fields: 'files(id,name,createdTime)'
            });
            
            if (response.result.files.length === 0) {
                console.log('ℹ️ No backup files found in cloud');
                return false;
            }
            
            const latestFile = response.result.files[0];
            console.log(`📥 Restoring from: ${latestFile.name}`);
            
            // Download file content
            const fileContent = await gapi.client.drive.files.get({
                fileId: latestFile.id,
                alt: 'media'
            });
            
            // Parse and restore data
            const restoreData = JSON.parse(fileContent.body);
            await this.restoreDataToLocal(restoreData);
            
            console.log('✅ Cloud restore completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Cloud restore failed:', error);
            return false;
        }
    }
    
    /**
     * Restore data to local storage
     */
    async restoreDataToLocal(restoreData) {
        try {
            // Restore CRM data
            if (restoreData.modules && restoreData.modules.crm && restoreData.modules.crm.data) {
                const crmData = restoreData.modules.crm.data;
                
                if (crmData.projects) {
                    localStorage.setItem('projectCRM_projects', JSON.stringify(crmData.projects));
                }
                if (crmData.theme) {
                    localStorage.setItem('projectCRM_theme', crmData.theme);
                }
                if (crmData.timer) {
                    localStorage.setItem('crm_timer_state', JSON.stringify(crmData.timer));
                }
                
                console.log('✅ CRM data restored');
            }
            
            // Restore habits data
            if (restoreData.modules && restoreData.modules.habits && restoreData.modules.habits.data) {
                const habitsData = restoreData.modules.habits.data;
                
                if (habitsData.habits) {
                    localStorage.setItem('habits', JSON.stringify(habitsData.habits));
                }
                if (habitsData.progress) {
                    localStorage.setItem('progress', JSON.stringify(habitsData.progress));
                }
                if (habitsData.theme) {
                    localStorage.setItem('theme', habitsData.theme);
                }
                
                console.log('✅ Habits data restored');
            }
            
            // Restore other localStorage data
            if (restoreData.localStorage && restoreData.localStorage.data) {
                Object.entries(restoreData.localStorage.data).forEach(([key, value]) => {
                    try {
                        localStorage.setItem(key, value);
                    } catch (error) {
                        console.warn(`⚠️ Error restoring localStorage key ${key}:`, error);
                    }
                });
                
                console.log('✅ Additional data restored');
            }
            
            // Set import flags for modules to refresh
            localStorage.setItem('crm_data_imported', 'true');
            localStorage.setItem('habits_data_imported', 'true');
            localStorage.setItem('google_sync_restore', 'true');
            
            console.log('✅ All data restored successfully');
            
        } catch (error) {
            console.error('❌ Error restoring data:', error);
            throw error;
        }
    }
    
    /**
     * Get sync status
     */
    getSyncStatus() {
        const metadata = localStorage.getItem('google_sync_metadata');
        if (metadata) {
            try {
                return JSON.parse(metadata);
            } catch (error) {
                console.warn('⚠️ Error parsing sync metadata:', error);
            }
        }
        
        return {
            lastSyncTime: null,
            lastSyncFile: null,
            lastSyncFileId: null,
            syncStatus: 'never'
        };
    }
    
    /**
     * Manual sync trigger
     */
    async manualSync() {
        if (!this.isAuthenticated) {
            console.log('⚠️ Please sign in to Google Drive first');
            return false;
        }
        
        return await this.syncToCloud();
    }
    
    /**
     * Manual restore trigger
     */
    async manualRestore() {
        if (!this.isAuthenticated) {
            console.log('⚠️ Please sign in to Google Drive first');
            return false;
        }
        
        return await this.restoreFromCloud();
    }
}

// Global instance
window.googleDriveSync = new GoogleDriveSync();
