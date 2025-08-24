/**
 * Productive Cloud App Configuration
 * Automatically detects environment and configures features accordingly
 */

class AppConfig {
    constructor() {
        this.detectEnvironment();
        this.setupConfiguration();
        this.showEnvironmentInfo();
    }
    
    detectEnvironment() {
        // Detect current environment
        this.isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
        
        this.isGitHub = window.location.hostname.includes('github.io') || 
                       window.location.hostname.includes('github.com');
        
        this.isDeployed = !this.isLocal && !this.isGitHub;
        
        console.log('🌍 Environment detected:', {
            hostname: window.location.hostname,
            isLocal: this.isLocal,
            isGitHub: this.isGitHub,
            isDeployed: this.isDeployed
        });
    }
    
    setupConfiguration() {
        // API Configuration
        if (this.isLocal) {
            this.apiBaseUrl = 'http://localhost:5000/api';
            this.hasBackend = true;
        } else if (this.isDeployed) {
            // This will be updated when you deploy to cloud hosting
            this.apiBaseUrl = 'https://your-render-app.onrender.com/api';
            this.hasBackend = true;
        } else {
            // GitHub Pages - no backend available
            this.apiBaseUrl = null;
            this.hasBackend = false;
        }
        
        // Feature Flags
        this.features = {
            autosave: this.hasBackend,
            authentication: this.hasBackend,
            cloudSync: this.hasBackend,
            localStorage: true, // Always available
            crm: true, // Always available
            calendar: true, // Always available
            habits: true // Always available
        };
        
        console.log('⚙️ Configuration set:', {
            apiBaseUrl: this.apiBaseUrl,
            hasBackend: this.hasBackend,
            features: this.features
        });
    }
    
    showEnvironmentInfo() {
        // Create environment info display
        const envInfo = document.createElement('div');
        envInfo.id = 'environmentInfo';
        envInfo.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${this.isLocal ? '#4CAF50' : this.isGitHub ? '#FF9800' : '#2196F3'};
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        if (this.isLocal) {
            envInfo.textContent = '🖥️ Local Mode';
            envInfo.title = 'Running locally with full backend features';
        } else if (this.isGitHub) {
            envInfo.textContent = '📱 GitHub Mode';
            envInfo.title = 'Running on GitHub Pages - local storage only';
        } else {
            envInfo.textContent = '☁️ Cloud Mode';
            envInfo.title = 'Running on cloud hosting with full features';
        }
        
        document.body.appendChild(envInfo);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (envInfo.parentNode) {
                envInfo.style.opacity = '0.7';
                envInfo.style.transition = 'opacity 0.3s ease';
            }
        }, 5000);
    }
    
    // Getter methods
    getApiBaseUrl() {
        return this.apiBaseUrl;
    }
    
    hasFeature(feature) {
        return this.features[feature] || false;
    }
    
    isBackendAvailable() {
        return this.hasBackend;
    }
    
    // Method to update API URL when you deploy to cloud
    updateApiUrl(newUrl) {
        if (newUrl && !this.isLocal) {
            this.apiBaseUrl = newUrl;
            this.hasBackend = true;
            this.features.autosave = true;
            this.features.authentication = true;
            this.features.cloudSync = true;
            
            console.log('🔄 API URL updated:', newUrl);
            this.showToast('☁️ Cloud features enabled!', 'success');
        }
    }
    
    showToast(message, type = 'info') {
        if (window.productiveCloud && typeof window.productiveCloud.showToast === 'function') {
            window.productiveCloud.showToast(message, type);
        } else {
            console.log(`Toast: [${type}] ${message}`);
        }
    }
}

// Initialize configuration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appConfig = new AppConfig();
    console.log('✅ App configuration initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
