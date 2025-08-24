/**
 * Productive Cloud Autosave System
 * Automatically syncs data with the backend database
 */

class AutosaveSystem {
    constructor() {
        // Use app config if available, otherwise fallback to localhost
        this.apiBaseUrl = window.appConfig ? window.appConfig.getApiBaseUrl() : 'http://localhost:5000/api';
        this.syncInterval = 30000; // 30 seconds
        this.syncTimeout = 10000; // 10 seconds
        this.isOnline = navigator.onLine;
        this.pendingSyncs = new Map();
        this.syncInProgress = false;
        this.lastSyncTimes = new Map();
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Autosave System...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start autosave
        this.startAutosave();
        
        // Initial sync
        this.syncAllData();
        
        console.log('✅ Autosave System initialized');
    }
    
    setupEventListeners() {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Back online - syncing pending data...');
            this.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Went offline - autosave paused');
        });
        
        // Before page unload
        window.addEventListener('beforeunload', () => {
            this.syncAllData(true); // Force sync before leaving
        });
        
        // Visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Tab became visible - checking for updates...');
                this.checkForUpdates();
            }
        });
    }
    
    startAutosave() {
        // Check if backend is available
        if (!this.apiBaseUrl) {
            console.log('⚠️ No backend available, autosave disabled');
            this.showToast('📱 Running in local storage mode', 'info');
            return;
        }
        
        setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.syncAllData();
            }
        }, this.syncInterval);
        
        console.log(`⏰ Autosave scheduled every ${this.syncInterval / 1000} seconds`);
    }
    
    async syncAllData(force = false) {
        if (!this.isAuthenticated()) {
            console.log('🔒 User not authenticated, skipping sync');
            return;
        }
        
        if (this.syncInProgress && !force) {
            console.log('⏳ Sync already in progress, skipping...');
            return;
        }
        
        this.syncInProgress = true;
        
        try {
            console.log('🔄 Starting full data sync...');
            
            // Sync habits data
            await this.syncDataType('habits', force);
            
            // Sync CRM data
            await this.syncDataType('crm', force);
            
            // Sync calendar data
            await this.syncDataType('calendar', force);
            
            // Sync settings
            await this.syncDataType('settings', force);
            
            console.log('✅ Full data sync completed');
            
        } catch (error) {
            console.error('❌ Full data sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async syncDataType(dataType, force = false) {
        try {
            const localData = this.getLocalData(dataType);
            if (!localData && !force) {
                console.log(`📭 No local data for ${dataType}, skipping sync`);
                return;
            }
            
            const lastSync = this.lastSyncTimes.get(dataType);
            
            const syncData = {
                dataType,
                data: localData || {},
                lastSync: lastSync || null
            };
            
            const result = await this.makeApiCall('/data/sync', syncData);
            
            if (result.action === 'updated') {
                // Database has newer data, update local storage
                console.log(`📥 Updating local ${dataType} data from database`);
                this.setLocalData(dataType, result.data);
                this.lastSyncTimes.set(dataType, result.timestamp);
                
                // Trigger UI refresh if needed
                this.triggerDataUpdate(dataType, result.data);
                
            } else if (result.action === 'synced') {
                // Local data was synced to database
                console.log(`📤 ${dataType} data synced to database`);
                this.lastSyncTimes.set(dataType, result.timestamp);
                
            } else if (result.action === 'created') {
                // New data was created in database
                console.log(`🆕 ${dataType} data created in database`);
                this.lastSyncTimes.set(dataType, result.timestamp);
            }
            
        } catch (error) {
            console.error(`❌ Failed to sync ${dataType}:`, error);
            // Add to pending syncs for later retry
            this.addPendingSync(dataType);
        }
    }
    
    async syncPendingData() {
        if (this.pendingSyncs.size === 0) {
            return;
        }
        
        console.log(`🔄 Syncing ${this.pendingSyncs.size} pending data types...`);
        
        for (const [dataType, data] of this.pendingSyncs) {
            try {
                await this.syncDataType(dataType, true);
                this.pendingSyncs.delete(dataType);
            } catch (error) {
                console.error(`❌ Failed to sync pending ${dataType}:`, error);
            }
        }
    }
    
    addPendingSync(dataType) {
        const localData = this.getLocalData(dataType);
        if (localData) {
            this.pendingSyncs.set(dataType, localData);
            console.log(`📋 Added ${dataType} to pending syncs`);
        }
    }
    
    async checkForUpdates() {
        if (!this.isAuthenticated() || !this.isOnline) {
            return;
        }
        
        try {
            const result = await this.makeApiCall('/data', null, 'GET');
            
            if (result.data) {
                let hasUpdates = false;
                
                for (const [dataType, dataInfo] of Object.entries(result.data)) {
                    const lastSync = this.lastSyncTimes.get(dataType);
                    
                    if (!lastSync || new Date(lastSync) < new Date(dataInfo.lastModified)) {
                        console.log(`🔄 Found updates for ${dataType}`);
                        
                        // Update local data
                        this.setLocalData(dataType, dataInfo.data);
                        this.lastSyncTimes.set(dataType, dataInfo.lastModified);
                        
                        // Trigger UI refresh
                        this.triggerDataUpdate(dataType, dataInfo.data);
                        
                        hasUpdates = true;
                    }
                }
                
                if (hasUpdates) {
                    console.log('✅ Local data updated from database');
                    this.showToast('🔄 Data updated from cloud', 'info');
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to check for updates:', error);
        }
    }
    
    // Data management methods
    getLocalData(dataType) {
        try {
            const key = `productiveCloud_${dataType}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`❌ Error getting local ${dataType} data:`, error);
            return null;
        }
    }
    
    setLocalData(dataType, data) {
        try {
            const key = `productiveCloud_${dataType}`;
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`💾 Local ${dataType} data updated`);
        } catch (error) {
            console.error(`❌ Error setting local ${dataType} data:`, error);
        }
    }
    
    // API communication
    async makeApiCall(endpoint, data = null, method = 'POST') {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token');
        }
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.syncTimeout);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }
    
    // Utility methods
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        return !!token;
    }
    
    triggerDataUpdate(dataType, data) {
        // Dispatch custom event for other parts of the app to listen to
        const event = new CustomEvent('dataUpdated', {
            detail: { dataType, data }
        });
        document.dispatchEvent(event);
        
        // Also trigger specific events for each data type
        const specificEvent = new CustomEvent(`${dataType}Updated`, {
            detail: { data }
        });
        document.dispatchEvent(specificEvent);
    }
    
    showToast(message, type = 'info') {
        // Use existing toast system if available
        if (window.productiveCloud && window.productiveCloud.showToast) {
            window.productiveCloud.showToast(message, type);
        } else {
            console.log(`🔔 ${message}`);
        }
    }
    
    // Public methods for manual sync
    async manualSync(dataType) {
        console.log(`🔄 Manual sync requested for ${dataType}`);
        await this.syncDataType(dataType, true);
    }
    
    async manualSyncAll() {
        console.log('🔄 Manual sync all requested');
        await this.syncAllData(true);
    }
    
    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress,
            pendingSyncs: Array.from(this.pendingSyncs.keys()),
            lastSyncTimes: Object.fromEntries(this.lastSyncTimes),
            nextSyncIn: this.syncInterval - (Date.now() % this.syncInterval)
        };
    }
    
    // Change sync interval
    setSyncInterval(seconds) {
        this.syncInterval = seconds * 1000;
        console.log(`⏰ Sync interval changed to ${seconds} seconds`);
        
        // Restart autosave with new interval
        this.startAutosave();
    }
}

// Initialize autosave system
let autosaveSystem;

document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the main app to load
    setTimeout(() => {
        autosaveSystem = new AutosaveSystem();
        window.autosaveSystem = autosaveSystem;
        console.log('🌐 Autosave system attached to window');
    }, 2000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutosaveSystem;
}
