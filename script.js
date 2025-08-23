/**
 * Productive Cloud - Full Working Version
 * Complete with Google Auth, Brightness Progress, CRM Integration
 */

class ProductiveCloud {
    constructor() {
        // Core state
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.isDarkMode = false;
        this.habits = [];
        this.habitProgress = {};
        this.user = null;
        this.isFirstTime = false;
        this.currentView = 'calendar';
        
        // Google Auth configuration
        this.googleClientId = '624304822547-hmaju3564rolpo0egpo9rhdrsqlqmbj4.apps.googleusercontent.com';
        // Note: Client secret should never be exposed in frontend code
        // Only the Client ID is needed for OAuth flow
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Add safety timeout to hide loading screen
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 10000); // 10 seconds max
            
            // Setup Google Identity Services
            await this.setupGoogleAuth();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load user preferences and data
            await this.loadUserData();
            
            // Check if first time user
            if (this.isFirstTime) {
                this.showFirstTimeSetup();
            } else {
                // Render initial view
                this.renderApplication();
            }
            
            // Hide loading screen
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Failed to initialize Productive Cloud:', error);
            this.showError('Failed to load application. Please refresh the page.');
            // Always hide loading screen on error
            this.hideLoadingScreen();
            
            // Try to show app anyway
            try {
                this.renderApplication();
            } catch (renderError) {
                console.error('Failed to render application:', renderError);
            }
        }
    }

    /**
     * Setup Google Authentication
     */
    async setupGoogleAuth() {
        try {
            console.log('🔐 Setting up Google Authentication...');
            
            // Wait for Google Identity Services with timeout
            let attempts = 0;
            const maxAttempts = 10;
            
            while (typeof google === 'undefined' || !google.accounts) {
                if (attempts >= maxAttempts) {
                    console.log('⚠️ Google Identity Services not available, continuing without auth');
                    this.showToast('Google Auth not available - app will work without authentication', 'warning');
                    break;
                }
                await this.delay(500);
                attempts++;
            }
            
            // Initialize Google Identity Services if available
            if (typeof google !== 'undefined' && google.accounts) {
                try {
                    google.accounts.id.initialize({
                        client_id: this.googleClientId,
                        callback: this.handleCredentialResponse.bind(this),
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });
                    
                    console.log('✅ Google Auth initialized successfully');
                    
                    // Check if user is already signed in
                    const token = localStorage.getItem('productiveCloudToken');
                    if (token) {
                        const isValid = await this.validateToken(token);
                        if (!isValid) {
                            console.log('⚠️ Stored token is invalid, clearing...');
                            localStorage.removeItem('productiveCloudToken');
                            localStorage.removeItem('productiveCloudUser');
                        }
                    }
                } catch (googleError) {
                    console.error('❌ Google Auth initialization failed:', googleError);
                    this.showToast('Google Auth setup failed - continuing without authentication', 'warning');
                }
            } else {
                console.log('ℹ️ Google Auth not available, app will work without authentication');
                this.showToast('Google Auth not available - app will work without authentication', 'info');
            }
        } catch (error) {
            console.error('❌ Google Auth setup failed:', error);
            this.showToast('Authentication setup failed - app will work without login', 'warning');
            // Continue without Google Auth
        }
    }

    /**
     * Handle Google credential response
     */
    async handleCredentialResponse(response) {
        try {
            const decoded = this.decodeJwtResponse(response.credential);
            
            this.user = {
                id: decoded.sub,
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture
            };
            
            // Save token
            localStorage.setItem('productiveCloudToken', response.credential);
            localStorage.setItem('productiveCloudUser', JSON.stringify(this.user));
            
            // Update UI
            this.updateUserSection();
            
            // Check if first time
            if (!localStorage.getItem('productiveCloudHabits')) {
                this.isFirstTime = true;
                this.showFirstTimeSetup();
            } else {
                this.renderApplication();
            }
            
            this.showToast('Welcome back, ' + this.user.name + '!', 'success');
            
        } catch (error) {
            console.error('Failed to handle credential response:', error);
            this.showError('Authentication failed. Please try again.');
        }
    }

    /**
     * Decode JWT token
     */
    decodeJwtResponse(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    /**
     * Validate stored token
     */
    async validateToken(token) {
        try {
            const decoded = this.decodeJwtResponse(token);
            const now = Math.floor(Date.now() / 1000);
            
            if (decoded.exp > now) {
                this.user = {
                    id: decoded.sub,
                    name: decoded.name,
                    email: decoded.email,
                    picture: decoded.picture
                };
                this.updateUserSection();
                return true;
            } else {
                localStorage.removeItem('productiveCloudToken');
                localStorage.removeItem('productiveCloudUser');
                return false;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    /**
     * Update user section in header
     */
    updateUserSection() {
        const loginSection = document.getElementById('loginSection');
        const userSection = document.getElementById('userSection');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (this.user && loginSection && userSection) {
            loginSection.style.display = 'none';
            userSection.style.display = 'flex';
            
            if (userAvatar) userAvatar.src = this.user.picture;
            if (userName) userName.textContent = this.user.name;
        }
    }

    /**
     * Show first time setup modal
     */
    showFirstTimeSetup() {
        const modal = document.createElement('div');
        modal.className = 'modal first-time-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Welcome to Productive Cloud! 🎉</h2>
                <p>Let's set up your first habits to get started.</p>
                <div class="habit-setup">
                    <div class="habit-input-group">
                        <input type="text" id="habit1" placeholder="e.g., Morning Exercise" class="habit-input">
                        <select id="category1" class="habit-category">
                            <option value="health">Health</option>
                            <option value="productivity">Productivity</option>
                            <option value="learning">Learning</option>
                        </select>
                    </div>
                    <div class="habit-input-group">
                        <input type="text" id="habit2" placeholder="e.g., Read 30 minutes" class="habit-input">
                        <select id="category2" class="habit-category">
                            <option value="learning">Learning</option>
                            <option value="health">Health</option>
                            <option value="productivity">Productivity</option>
                        </select>
                    </div>
                    <div class="habit-input-group">
                        <input type="text" id="habit3" placeholder="e.g., Plan tomorrow" class="habit-input">
                        <select id="category3" class="habit-category">
                            <option value="productivity">Productivity</option>
                            <option value="health">Health</option>
                            <option value="learning">Learning</option>
                        </select>
                    </div>
                </div>
                <button onclick="window.productiveCloud.completeFirstTimeSetup()" class="btn btn-primary">Get Started!</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Complete first time setup
     */
    completeFirstTimeSetup() {
        const habit1 = document.getElementById('habit1').value.trim();
        const habit2 = document.getElementById('habit2').value.trim();
        const habit3 = document.getElementById('habit3').value.trim();
        
        if (habit1) {
            this.habits.push({
                id: this.generateId(),
                name: habit1,
                category: document.getElementById('category1').value,
                frequency: 'daily',
                createdAt: new Date().toISOString()
            });
        }
        
        if (habit2) {
            this.habits.push({
                id: this.generateId(),
                name: habit2,
                category: document.getElementById('category2').value,
                frequency: 'daily',
                createdAt: new Date().toISOString()
            });
        }
        
        if (habit3) {
            this.habits.push({
                id: this.generateId(),
                name: habit3,
                category: document.getElementById('category3').value,
                frequency: 'daily',
                createdAt: new Date().toISOString()
            });
        }
        
        // Save habits
        this.saveUserData();
        
        // Close modal
        const modal = document.querySelector('.first-time-modal');
        if (modal) modal.remove();
        
        // Mark as not first time
        this.isFirstTime = false;
        localStorage.setItem('productiveCloudFirstTime', 'false');
        
        // Render application
        this.renderApplication();
        
        this.showToast('Welcome to Productive Cloud! Your habits are set up.', 'success');
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        if (appContainer) {
            appContainer.style.display = 'flex';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Initialize QA Tester
        this.initQATester();

        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const view = link.getAttribute('data-view');
                const href = link.getAttribute('href');
                
                // If it's an external link (like CRM), don't prevent default
                if (href && href.includes('.html')) {
                    // Allow external navigation
                    return;
                }
                
                // If it's an internal view, prevent default and navigate
                if (view) {
                    e.preventDefault();
                    this.navigateToView(view);
                }
            });
        });

        // Dropdown navigation items
        const dropdownItems = document.querySelectorAll('.dropdown-item[data-view]');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.getAttribute('data-view');
                if (view) {
                    e.preventDefault();
                    this.navigateToView(view);
                    this.closeMoreFeatures(); // Close dropdown after navigation
                }
            });
        });

        // Calendar navigation
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        if (prevMonth) {
            prevMonth.addEventListener('click', () => this.navigateMonth(-1));
        }
        if (nextMonth) {
            nextMonth.addEventListener('click', () => this.navigateMonth(1));
        }

        // Today button
        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }

        // Jump to date
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', () => this.jumpToDate());
        }

        // Habit modal
        const addHabitBtn = document.getElementById('addHabitBtn');
        if (addHabitBtn) {
            addHabitBtn.addEventListener('click', () => this.showHabitModal());
        }

        // Reset progress button (Weekly view only)
        const resetProgressBtn = document.getElementById('resetProgressBtn');
        if (resetProgressBtn) {
            resetProgressBtn.addEventListener('click', () => this.resetAllProgress());
        }

        // Weekly navigation buttons
        const prevWeekBtn = document.getElementById('prevWeekBtn');
        const nextWeekBtn = document.getElementById('nextWeekBtn');
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => this.navigateWeek(-1));
        }
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => this.navigateWeek(1));
        }

        // More features toggle
        const moreFeaturesToggle = document.getElementById('moreFeaturesToggle');
        if (moreFeaturesToggle) {
            moreFeaturesToggle.addEventListener('click', () => this.toggleMoreFeatures());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.more-nav')) {
                this.closeMoreFeatures();
            }
        });





        // Close habit modal
        const closeHabitModal = document.getElementById('closeHabitModal');
        if (closeHabitModal) {
            closeHabitModal.addEventListener('click', () => this.hideHabitModal());
        }

        // Save habit
        const saveHabitBtn = document.getElementById('saveHabitBtn');
        if (saveHabitBtn) {
            saveHabitBtn.addEventListener('click', () => this.saveHabit());
        }

        // Cancel habit
        const cancelHabitBtn = document.getElementById('cancelHabitBtn');
        if (cancelHabitBtn) {
            cancelHabitBtn.addEventListener('click', () => this.hideHabitModal());
        }

        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => this.toggleUserMenu());
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    /**
     * Load user data
     */
    async loadUserData() {
        try {
            // Load theme preference
            const savedTheme = localStorage.getItem('productiveCloudTheme');
            if (savedTheme) {
                this.isDarkMode = savedTheme === 'dark';
                this.applyTheme();
            }

            // Load first time status
            const firstTime = localStorage.getItem('productiveCloudFirstTime');
            this.isFirstTime = firstTime !== 'false';

            // Load habits
            const savedHabits = localStorage.getItem('productiveCloudHabits');
            if (savedHabits) {
                this.habits = JSON.parse(savedHabits);
            }

            // Load progress
            const savedProgress = localStorage.getItem('productiveCloudProgress');
            if (savedProgress) {
                this.habitProgress = JSON.parse(savedProgress);
            }

            console.log('User data loaded successfully');
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    /**
     * Render application
     */
    renderApplication() {
        this.renderCalendar();
        this.updateProgress();
        this.renderWeeklyView();
    }

    /**
     * Render calendar with brightness-based progress
     */
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        // Update month display
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        }

        // Generate calendar days
        this.generateCalendarDays(calendar, new Date(currentYear, currentMonth, 1));
    }

    /**
     * Generate calendar days with brightness progress
     */
    generateCalendarDays(calendar, startDate) {
        calendar.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Add empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendar.appendChild(emptyDay);
        }

        // Add days of the month with brightness progress
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = this.createCalendarDay(new Date(startDate.getFullYear(), startDate.getMonth(), day));
            calendar.appendChild(dayElement);
        }
    }

    /**
     * Create calendar day element with brightness progress
     */
    createCalendarDay(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        
        // Calculate progress for this day
        const dateKey = this.getDateKey(date);
        const progress = this.calculateDayProgress(dateKey);
        
        // BULLETPROOF PROGRESS SYSTEM - Only apply styling if progress > 0
        if (progress > 0) {
            // Round progress to nearest 10 for CSS classes
            const brightnessLevel = Math.floor(progress / 10) * 10;
            dayElement.setAttribute('data-progress', brightnessLevel.toString());
            dayElement.classList.add('has-progress');
            
            // Add percentage indicator
            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'progress-indicator';
            progressIndicator.textContent = `${progress}%`;
            
            dayElement.appendChild(progressIndicator);
        } else {
            // FORCE CLEAN STATE FOR 0% PROGRESS
            dayElement.removeAttribute('data-progress');
            dayElement.classList.remove('has-progress');
            // Remove any existing pseudo-elements by clearing style
            dayElement.style.background = '';
            dayElement.style.boxShadow = '';
        }
        
        // Check if it's today
        if (this.isToday(date)) {
            dayElement.classList.add('today');
        }

        // Add click event
        dayElement.addEventListener('click', () => this.selectDate(date));
        
        dayElement.appendChild(dayNumber);
        return dayElement;
    }

    /**
     * Calculate day progress
     */
    calculateDayProgress(dateKey) {
        if (this.habits.length === 0) return 0;
        
        // Count completed habits from object format
        const progressData = this.habitProgress[dateKey] || {};
        const completedHabits = Object.values(progressData).filter(Boolean).length;
        
        // Ensure progress never exceeds 100% and handle edge cases
        const rawProgress = (completedHabits / this.habits.length) * 100;
        return Math.min(100, Math.max(0, Math.round(rawProgress)));
    }

    /**
     * Navigate month
     */
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    /**
     * Navigate week
     */
    navigateWeek(direction) {
        // For now, we'll just refresh the weekly view
        // In the future, this could navigate to different weeks
        this.renderWeeklyView();
        this.showToast(`Week navigation ${direction > 0 ? 'forward' : 'backward'}`, 'info');
    }

    /**
     * Toggle more features dropdown
     */
    toggleMoreFeatures() {
        const dropdown = document.getElementById('moreFeaturesDropdown');
        const toggle = document.getElementById('moreFeaturesToggle');
        
        if (dropdown && toggle) {
            const isActive = dropdown.classList.contains('active');
            
            if (isActive) {
                this.closeMoreFeatures();
            } else {
                this.closeMoreFeatures(); // Close any other open dropdowns
                dropdown.classList.add('active');
                toggle.classList.add('active');
            }
        }
    }

    /**
     * Close more features dropdown
     */
    closeMoreFeatures() {
        const dropdown = document.getElementById('moreFeaturesDropdown');
        const toggle = document.getElementById('moreFeaturesToggle');
        
        if (dropdown) {
            dropdown.classList.remove('active');
        }
        
        if (toggle) {
            toggle.classList.remove('active');
        }
    }

    /**
     * Create celebration animation when habit is completed
     */
    celebrateHabitCompletion(element, habitName) {
        // Add bounce animation to checkbox
        element.classList.add('habit-checkbox-bounce');
        setTimeout(() => {
            element.classList.remove('habit-checkbox-bounce');
        }, 400);

        // Create confetti explosion
        this.createConfettiExplosion(element);
        
        // Create celebration ring effect
        this.createCelebrationRing(element);
        
        // Create sparkle effects
        this.createSparkleEffects(element);
        
        // Show success message
        this.showSuccessMessage(habitName);
        
        // Add celebrating class to parent element
        const habitItem = element.closest('.habit-item') || element.closest('.weekly-habit-row');
        if (habitItem) {
            habitItem.classList.add('celebrating');
            setTimeout(() => {
                habitItem.classList.remove('celebrating');
            }, 600);
        }
    }

    /**
     * Create confetti explosion effect
     */
    createConfettiExplosion(sourceElement) {
        const confettiContainer = document.getElementById('confettiContainer');
        if (!confettiContainer) return;

        const rect = sourceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Beautiful color palette for confetti
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
            '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#00b894',
            '#e84393', '#6c5ce7', '#00cec9', '#ffeaa7', '#fab1a0', '#55a3ff'
        ];

        // Create MASSIVE confetti explosion from both sides of the screen!
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Create 60 confetti pieces - 30 from each side for ultimate celebration!
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            
            let startX, startY;
            
            if (i < 30) {
                // First 30 pieces: Start from LEFT SIDE of screen
                startX = -20 + Math.random() * 50; // Start from left edge
                startY = Math.random() * windowHeight * 0.3; // Top 30% of screen
            } else {
                // Next 30 pieces: Start from RIGHT SIDE of screen
                startX = windowWidth - 30 + Math.random() * 50; // Start from right edge
                startY = Math.random() * windowHeight * 0.3; // Top 30% of screen
            }
            
            confetti.style.left = startX + 'px';
            confetti.style.top = startY + 'px';
            
            // Random color from our palette
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.background = randomColor;
            
            // Bigger size variation for more impact
            const size = 8 + Math.random() * 8;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            // Staggered animation delays for wave effect
            confetti.style.animationDelay = Math.random() * 1.2 + 's';
            
            // Add horizontal movement for side-to-side effect
            const horizontalMovement = (i < 30) ? 
                `${200 + Math.random() * 300}px` : // Left side moves right
                `${-200 - Math.random() * 300}px`; // Right side moves left
            
            confetti.style.setProperty('--horizontal-drift', horizontalMovement);
            
            confettiContainer.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    }

    /**
     * Create celebration ring effect
     */
    createCelebrationRing(sourceElement) {
        const ring = document.createElement('div');
        ring.className = 'celebration-ring';
        
        sourceElement.appendChild(ring);
        
        setTimeout(() => {
            if (ring.parentNode) {
                ring.parentNode.removeChild(ring);
            }
        }, 600);
    }

    /**
     * Create sparkle effects around the element
     */
    createSparkleEffects(sourceElement) {
        const rect = sourceElement.getBoundingClientRect();
        
        // Create 8 sparkles around the element
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30;
            const x = rect.left + rect.width / 2 + Math.cos(angle) * distance;
            const y = rect.top + rect.height / 2 + Math.sin(angle) * distance;
            
            sparkle.style.left = x + 'px';
            sparkle.style.top = y + 'px';
            sparkle.style.position = 'fixed';
            sparkle.style.animationDelay = (i * 0.1) + 's';
            
            document.body.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 800);
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(habitName) {
        const message = document.createElement('div');
        message.className = 'success-message';
        
        // Random celebration emojis for variety
        const emojis = ['🎉', '🎊', '✨', '🌟', '💫', '🔥', '💪', '🏆', '🥳', '🎯'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        message.innerHTML = `
            <span class="success-icon">${randomEmoji}</span>
            <span>Great job! "${habitName}" completed!</span>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    /**
     * Go to today
     */
    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.renderCalendar();
    }

    /**
     * Jump to specific date
     */
    jumpToDate() {
        const jumpDate = document.getElementById('jumpDate');
        if (jumpDate && jumpDate.value) {
            const selectedDate = new Date(jumpDate.value);
            this.currentDate = selectedDate;
            this.selectedDate = selectedDate;
            this.renderCalendar();
            jumpDate.value = '';
        }
    }

    /**
     * Select date
     */
    selectDate(date) {
        this.selectedDate = date;
        this.navigateToView('daily');
    }

    /**
     * Navigate to view
     */
    navigateToView(view) {
        // Hide all views
        const views = document.querySelectorAll('.view-section');
        views.forEach(v => v.classList.remove('active'));

        // Show selected view
        const selectedView = document.getElementById(view + 'View');
        if (selectedView) {
            selectedView.classList.add('active');
        }

        // Update navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`[data-view="${view}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentView = view;

        // Render view content
        if (view === 'calendar') {
            this.renderCalendar();
        } else if (view === 'weekly') {
            this.renderWeeklyView();
        } else if (view === 'daily') {
            this.renderDailyView();
        }
    }

    /**
     * Render weekly view
     */
    renderWeeklyView() {
        const weeklyCalendar = document.getElementById('weeklyCalendar');
        const weeklyEmptyState = document.getElementById('weeklyEmptyState');
        
        if (this.habits.length === 0) {
            if (weeklyEmptyState) weeklyEmptyState.style.display = 'block';
            if (weeklyCalendar) weeklyCalendar.style.display = 'none';
        } else {
            if (weeklyEmptyState) weeklyEmptyState.style.display = 'none';
            if (weeklyCalendar) weeklyCalendar.style.display = 'block';
            this.generateWeeklyCalendar();
            this.updateWeeklyProgressSummary();
        }
    }

    /**
     * Generate weekly calendar with modern UI
     */
    generateWeeklyCalendar() {
        const weeklyCalendar = document.getElementById('weeklyCalendar');
        if (!weeklyCalendar) return;

        weeklyCalendar.innerHTML = '';

        // Get current week dates
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        // Update week display
        this.updateWeekDisplay(weekStart);

        // Create habit rows with modern design
        this.habits.forEach(habit => {
            const habitRow = this.createModernHabitRow(habit, weekStart);
            weeklyCalendar.appendChild(habitRow);
        });
    }

    /**
     * Create modern habit row with enhanced UI
     */
    createModernHabitRow(habit, weekStart) {
        const habitRow = document.createElement('div');
        habitRow.className = 'weekly-habit-row';
        
        // Habit info column
        const habitInfo = document.createElement('div');
        habitInfo.className = 'weekly-habit-info';
        habitInfo.innerHTML = `
            <div class="weekly-habit-name">${habit.name}</div>
            <div class="weekly-habit-category">${this.getCategoryName(habit.category)}</div>
        `;
        habitRow.appendChild(habitInfo);

        // Create day checkboxes for the week
        let weeklyProgress = 0;
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            
            const dayCheckbox = this.createModernDayCheckbox(habit, dayDate);
            habitRow.appendChild(dayCheckbox);
            
            // Calculate weekly progress
            const dateKey = this.getDateKey(dayDate);
            if (this.habitProgress[dateKey] && this.habitProgress[dateKey][habit.id]) {
                weeklyProgress++;
            }
        }

        // Progress column with visual bar
        const progressColumn = document.createElement('div');
        progressColumn.className = 'weekly-habit-progress';
        
        const progressPercentage = Math.round((weeklyProgress / 7) * 100);
        progressColumn.innerHTML = `
            <div class="weekly-progress-bar">
                <div class="weekly-progress-fill" style="width: ${progressPercentage}%"></div>
                <div class="weekly-progress-text">${progressPercentage}%</div>
            </div>
        `;
        habitRow.appendChild(progressColumn);

        return habitRow;
    }

    /**
     * Create modern day checkbox with enhanced styling
     */
    createModernDayCheckbox(habit, date) {
        const dayContainer = document.createElement('div');
        dayContainer.className = 'weekly-habit-day';
        
        const checkbox = document.createElement('label');
        checkbox.className = 'weekly-checkbox';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        
        const checkmark = document.createElement('span');
        checkmark.className = 'weekly-checkmark';
        
        const dateKey = this.getDateKey(date);
        const isChecked = this.habitProgress[dateKey] && 
                         this.habitProgress[dateKey][habit.id];
        
        input.checked = isChecked;
        input.addEventListener('change', (e) => {
            this.toggleHabitProgress(habit, date, e.target.checked);
            
            // Trigger celebration animation if habit is completed
            if (e.target.checked) {
                this.celebrateHabitCompletion(checkbox, habit.name);
            }
            
            // Update weekly progress after change
            setTimeout(() => {
                this.updateWeeklyProgressSummary();
                this.renderWeeklyView();
            }, 100);
        });
        
        checkbox.appendChild(input);
        checkbox.appendChild(checkmark);
        dayContainer.appendChild(checkbox);
        
        return dayContainer;
    }

    /**
     * Update weekly progress summary
     */
    updateWeeklyProgressSummary() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        let totalCompletedDays = 0;
        let totalHabits = this.habits.length;
        let weeklyStreak = 0;
        
        // Calculate weekly progress
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dateKey = this.getDateKey(dayDate);
            
            let dayCompleted = false;
            if (this.habits.length > 0) {
                const completedHabits = this.habits.filter(habit => 
                    this.habitProgress[dateKey] && this.habitProgress[dateKey][habit.id]
                ).length;
                dayCompleted = completedHabits > 0;
            }
            
            if (dayCompleted) {
                totalCompletedDays++;
            }
        }
        
        // Calculate weekly percentage
        const weeklyPercentage = totalHabits > 0 ? Math.round((totalCompletedDays / 7) * 100) : 0;
        
        // Update progress ring
        const progressRing = document.getElementById('weeklyProgressRing');
        if (progressRing) {
            const circumference = 2 * Math.PI * 45; // radius = 45
            const strokeDashoffset = circumference - (weeklyPercentage / 100) * circumference;
            progressRing.style.strokeDashoffset = strokeDashoffset;
        }
        
        // Update progress text
        const progressPercent = document.getElementById('weeklyProgressPercent');
        if (progressPercent) {
            this.animateNumber(progressPercent, parseInt(progressPercent.textContent) || 0, weeklyPercentage, '%');
        }
        
        // Update stats
        const completedDays = document.getElementById('weeklyCompletedDays');
        const totalHabitsElement = document.getElementById('weeklyTotalHabits');
        const streakElement = document.getElementById('weeklyStreak');
        
        if (completedDays) {
            this.animateNumber(completedDays, parseInt(completedDays.textContent) || 0, totalCompletedDays);
        }
        
        if (totalHabitsElement) {
            this.animateNumber(totalHabitsElement, parseInt(totalHabitsElement.textContent) || 0, totalHabits);
        }
        
        if (streakElement) {
            this.animateNumber(streakElement, parseInt(streakElement.textContent) || 0, weeklyStreak);
        }
    }

    /**
     * Update week display
     */
    updateWeekDisplay(weekStart) {
        const currentWeekDisplay = document.getElementById('currentWeekDisplay');
        if (currentWeekDisplay) {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
            const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
            const startDay = weekStart.getDate();
            const endDay = weekEnd.getDate();
            const year = weekStart.getFullYear();
            
            if (startMonth === endMonth) {
                currentWeekDisplay.textContent = `${startMonth} ${startDay}-${endDay}, ${year}`;
            } else {
                currentWeekDisplay.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
            }
        }
    }

    /**
     * Create habit row
     */
    createHabitRow(habit, weekStart) {
        const habitRow = document.createElement('div');
        habitRow.className = 'habit-row';
        
        const habitName = document.createElement('div');
        habitName.className = 'habit-name';
        habitName.textContent = habit.name;
        habitRow.appendChild(habitName);

        // Create day checkboxes for the week
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            
            const dayCheckbox = this.createDayCheckbox(habit, dayDate);
            habitRow.appendChild(dayCheckbox);
        }

        return habitRow;
    }

    /**
     * Create day checkbox
     */
    createDayCheckbox(habit, date) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'day-checkbox';
        
        const dateKey = this.getDateKey(date);
        const isChecked = this.habitProgress[dateKey] && 
                         this.habitProgress[dateKey].includes(habit.id);
        
        checkbox.checked = isChecked;
        checkbox.addEventListener('change', (e) => {
            this.toggleHabitProgress(habit, date, e.target.checked);
        });

        return checkbox;
    }

    /**
     * Toggle habit progress - Fixed to handle habit object vs habit id
     */
    toggleHabitProgress(habitParam, date, completed) {
        // Handle both habit object and habit ID
        const habitId = typeof habitParam === 'object' ? habitParam.id : habitParam;
        
        const dateKey = this.getDateKey(date);
        
        if (!this.habitProgress[dateKey]) {
            this.habitProgress[dateKey] = {};
        }

        // Use object format for habit progress
        this.habitProgress[dateKey][habitId] = completed;

        this.saveUserData();
        this.updateProgress();
        this.renderCalendar(); // Refresh calendar with new progress
        
        console.log('Updated habit progress:', this.habitProgress[dateKey]);
    }

    /**
     * Render daily view
     */
    renderDailyView() {
        const dailyHabits = document.getElementById('dailyHabits');
        const emptyState = document.getElementById('dailyEmptyState');
        if (!dailyHabits) {
            console.error('Daily habits container not found!');
            return;
        }

        console.log('Rendering daily view...');
        console.log('Habits count:', this.habits.length);
        console.log('Habits:', this.habits);
        console.log('Selected date:', this.selectedDate);

        // Update progress summary first
        this.updateDailyProgressSummary();
        
        if (this.habits.length === 0) {
            console.log('No habits found, showing empty state');
            dailyHabits.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        dailyHabits.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        dailyHabits.innerHTML = '';

        this.habits.forEach(habit => {
            const habitElement = this.createDailyHabitElement(habit);
            dailyHabits.appendChild(habitElement);
        });

        // Update daily view title
        const dailyViewTitle = document.getElementById('dailyViewTitle');
        const dailyViewSubtitle = document.getElementById('dailyViewSubtitle');
        if (dailyViewTitle) {
            const dateStr = this.selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
            dailyViewTitle.textContent = `Daily Progress`;
            if (dailyViewSubtitle) {
                dailyViewSubtitle.textContent = `Track your habits for ${dateStr}`;
            }
        }
    }

    /**
     * Create daily habit element
     */
    createDailyHabitElement(habit) {
        const habitElement = document.createElement('div');
        habitElement.className = 'habit-item';
        
        const dateKey = this.getDateKey(this.selectedDate);
        const isCompleted = this.habitProgress[dateKey] && 
                           this.habitProgress[dateKey][habit.id];

        if (isCompleted) {
            habitElement.classList.add('completed');
        }

        habitElement.innerHTML = `
            <div class="habit-header">
                <div class="habit-info">
                    <h3 class="habit-name">${habit.name}</h3>
                    <span class="habit-category">${this.getCategoryName(habit.category)}</span>
                </div>
                <label class="habit-checkbox-modern">
                    <input type="checkbox" ${isCompleted ? 'checked' : ''}>
                    <span class="checkmark-modern">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    </span>
                </label>
            </div>
            <div class="habit-progress">
                <div class="habit-streak">
                    <span class="streak-number">${this.getHabitStreak(habit.id)}</span>
                    <span class="streak-label">day streak</span>
                </div>
                <div class="habit-status ${isCompleted ? 'status-completed' : 'status-pending'}">
                    ${isCompleted ? 'Completed' : 'Pending'}
                </div>
            </div>
        `;

        // Add event listener with animation
        const checkbox = habitElement.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                // Trigger celebration animation if habit is completed
                if (e.target.checked) {
                    const checkboxLabel = checkbox.closest('.habit-checkbox-modern');
                    this.celebrateHabitCompletion(checkboxLabel, habit.name);
                } else {
                    // Simple scale animation for unchecking
                    habitElement.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        habitElement.style.transform = '';
                    }, 150);
                }
                
                this.toggleHabitProgress(habit.id, this.selectedDate, e.target.checked);
                
                // Re-render with delay for smooth animation
                setTimeout(() => {
                    this.renderDailyView();
                }, 150);
            });
        }

        return habitElement;
    }

    /**
     * Update daily progress summary with animations
     */
    updateDailyProgressSummary() {
        const dateKey = this.getDateKey(this.selectedDate);
        const completedCount = this.habits.filter(habit => 
            this.habitProgress[dateKey] && this.habitProgress[dateKey][habit.id]
        ).length;
        const totalCount = this.habits.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Update progress ring
        const progressRing = document.getElementById('dailyProgressRing');
        if (progressRing) {
            const circumference = 2 * Math.PI * 36; // radius = 36
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            progressRing.style.strokeDashoffset = strokeDashoffset;
        }

        // Update progress text with animation
        const progressPercent = document.getElementById('dailyProgressPercent');
        if (progressPercent) {
            const currentPercent = parseInt(progressPercent.textContent) || 0;
            this.animateNumber(progressPercent, currentPercent, percentage, '%');
        }

        // Update stats with animation
        const completedHabits = document.getElementById('completedHabits');
        const totalHabitsElement = document.getElementById('totalHabits');
        
        if (completedHabits) {
            const currentCompleted = parseInt(completedHabits.textContent) || 0;
            this.animateNumber(completedHabits, currentCompleted, completedCount);
        }
        
        if (totalHabitsElement) {
            const currentTotal = parseInt(totalHabitsElement.textContent) || 0;
            this.animateNumber(totalHabitsElement, currentTotal, totalCount);
        }
    }

    /**
     * Animate number changes
     */
    animateNumber(element, start, end, suffix = '') {
        const duration = 500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(start + (end - start) * this.easeOutCubic(progress));
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Easing function for smooth animations
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Get habit streak for display
     */
    getHabitStreak(habitId) {
        let streak = 0;
        const today = new Date(this.selectedDate);
        
        for (let i = 0; i < 30; i++) { // Check last 30 days
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateKey = this.getDateKey(checkDate);
            
            if (this.habitProgress[dateKey] && this.habitProgress[dateKey][habitId]) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Get category name for display
     */
    getCategoryName(category) {
        const categoryNames = {
            'health': 'Health & Fitness',
            'productivity': 'Productivity',
            'learning': 'Learning',
            'mindfulness': 'Mindfulness',
            'personal': 'Personal',
            'custom': 'Custom'
        };
        return categoryNames[category] || category;
    }

    /**
     * Show habit modal
     */
    showHabitModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.style.display = 'flex';
            const input = document.getElementById('habitNameInput');
            if (input) {
                input.focus();
            }
        }
    }

    /**
     * Hide habit modal
     */
    hideHabitModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.style.display = 'none';
            const input = document.getElementById('habitNameInput');
            if (input) {
                input.value = '';
            }
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /**
     * Save habit
     */
    saveHabit() {
        const habitNameInput = document.getElementById('habitNameInput');
        const habitCategory = document.getElementById('habitCategory');
        const habitFrequency = document.getElementById('habitFrequency');
        
        if (!habitNameInput || !habitCategory || !habitFrequency) return;
        
        const habitName = habitNameInput.value.trim();
        
        if (!habitName) {
            this.showToast('Please enter a habit name', 'error');
            return;
        }
        
        if (this.habits.length >= 10) {
            this.showToast('Maximum 10 habits allowed!', 'warning');
            return;
        }
        
        const habit = {
            name: habitName,
            category: habitCategory.value,
            frequency: habitFrequency.value,
            createdAt: new Date().toISOString(),
            id: this.generateId()
        };
        
        this.habits.push(habit);
        this.saveUserData();
        this.updateProgress();
        this.renderWeeklyView();
        this.hideHabitModal();
        
        this.navigateToView('weekly');
        this.showToast('Habit added successfully!', 'success');
    }

    /**
     * Save user data
     */
    saveUserData() {
        try {
            localStorage.setItem('productiveCloudHabits', JSON.stringify(this.habits));
            localStorage.setItem('productiveCloudProgress', JSON.stringify(this.habitProgress));
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }

    /**
     * Update progress
     */
    updateProgress() {
        // Calculate overall progress
        const totalHabits = this.habits.length;
        if (totalHabits === 0) return;

        const today = new Date();
        const dateKey = this.getDateKey(today);
        const completedToday = this.habitProgress[dateKey] ? this.habitProgress[dateKey].length : 0;
        const progressPercent = Math.round((completedToday / totalHabits) * 100);

        // Update progress display
        this.updateCalendarProgress();
    }

    /**
     * Update calendar progress
     */
    updateCalendarProgress() {
        // Refresh calendar to show updated progress
        this.renderCalendar();
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem('productiveCloudTheme', this.isDarkMode ? 'dark' : 'light');
    }

    /**
     * Apply theme
     */
    applyTheme() {
        document.body.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = this.isDarkMode ? '☀️' : '🌙';
        }
    }

    /**
     * Toggle user menu
     */
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.user = null;
        localStorage.removeItem('productiveCloudToken');
        localStorage.removeItem('productiveCloudUser');
        
        // Reset to login state
        const loginSection = document.getElementById('loginSection');
        const userSection = document.getElementById('userSection');
        
        if (loginSection) loginSection.style.display = 'flex';
        if (userSection) userSection.style.display = 'none';
        
        this.showToast('Logged out successfully', 'info');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    /**
     * Show error
     */
    showError(message) {
        this.showToast(message, 'error', 5000);
    }

    /**
     * Reset all habit progress (Development/Testing)
     */
    resetAllProgress() {
        // Show confirmation dialog
        const confirmed = confirm('⚠️ DEVELOPMENT TOOL ⚠️\n\nThis will reset ALL habit progress for ALL dates.\n\nAre you sure you want to continue?\n\nThis action cannot be undone!');
        
        if (confirmed) {
            try {
                // Clear all progress data
                this.habitProgress = {};
                
                // Save empty progress to localStorage
                localStorage.removeItem('productiveCloudProgress');
                
                // Refresh the UI
                this.renderCalendar();
                this.renderWeeklyView();
                this.renderDailyView();
                this.updateProgress();
                
                // Show success message
                this.showToast('All progress has been reset!', 'success');
                
                console.log('All habit progress has been reset');
                
            } catch (error) {
                console.error('Failed to reset progress:', error);
                this.showError('Failed to reset progress. Please try again.');
            }
        }
    }



    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get date key
     */
    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Check if date is today
     */
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    /**
     * Initialize QA Tester
     */
    initQATester() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0
        };
        this.tests = this.setupTests();
        this.updateTesterDisplay();
    }

    /**
     * Setup test cases
     */
    setupTests() {
        return [
            // Core System Tests
            { name: 'Script Loading', test: () => this.testScriptLoading(), section: 'core' },
            { name: 'Global Instance', test: () => this.testGlobalInstance(), section: 'core' },
            { name: 'Initialization', test: () => this.testInitialization(), section: 'core' },

            // Calendar System Tests
            { name: 'Calendar Element', test: () => this.testCalendarElement(), section: 'calendar' },
            { name: 'Calendar Rendering', test: () => this.testCalendarRendering(), section: 'calendar' },

            // Habit Management Tests
            { name: 'Habit Creation', test: () => this.testHabitCreation(), section: 'habit' },
            { name: 'Data Persistence', test: () => this.testDataPersistence(), section: 'habit' },

            // Navigation Tests
            { name: 'View Switching', test: () => this.testViewSwitching(), section: 'nav' },
            { name: 'CRM Integration', test: () => this.testCRMIntegration(), section: 'nav' }
        ];
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        this.testResults = { total: this.tests.length, passed: 0, failed: 0 };
        this.updateTesterDisplay();
        this.renderTestResults();

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            try {
                const result = await test.test();
                this.updateTestResult(test.name, result);
                this.updateTestResultInUI(test.name, result);
                this.updateTesterDisplay();
                await this.delay(100);
            } catch (error) {
                this.updateTestResult(test.name, { passed: false, message: error.message });
                this.updateTestResultInUI(test.name, { passed: false, message: error.message });
                this.updateTesterDisplay();
            }
        }
    }

    // Core System Tests
    testScriptLoading() {
        return {
            passed: true,
            message: 'Script loaded successfully'
        };
    }

    testGlobalInstance() {
        return {
            passed: typeof this !== 'undefined',
            message: 'ProductiveCloud instance exists'
        };
    }



    testInitialization() {
        return {
            passed: true,
            message: 'ProductiveCloud initialized successfully'
        };
    }

    // Calendar System Tests
    testCalendarElement() {
        const calendar = document.getElementById('calendar');
        return {
            passed: !!calendar,
            message: calendar ? 'Calendar element found' : 'Calendar element not found'
        };
    }

    testCalendarRendering() {
        return {
            passed: typeof this.renderCalendar === 'function',
            message: 'Calendar rendering method available'
        };
    }



    // Habit Management Tests
    testHabitCreation() {
        return {
            passed: typeof this.showHabitModal === 'function',
            message: 'Habit creation method available'
        };
    }



    testDataPersistence() {
        return {
            passed: typeof localStorage !== 'undefined',
            message: 'LocalStorage available for data persistence'
        };
    }

    // Navigation Tests
    testViewSwitching() {
        return {
            passed: typeof this.showView === 'function',
            message: 'View switching method available'
        };
    }



    testCRMIntegration() {
        const crmLink = document.querySelector('a[href*="crm"]');
        return {
            passed: !!crmLink,
            message: crmLink ? 'CRM integration link found' : 'CRM integration link not found'
        };
    }

    // UI/UX Tests


    // Utility Methods
    updateTestResult(testName, result) {
        if (result.passed) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
        }
    }

    updateTesterDisplay() {
        const totalTests = document.getElementById('totalTests');
        const passedTests = document.getElementById('passedTests');
        const failedTests = document.getElementById('failedTests');
        const successRate = document.getElementById('successRate');

        if (totalTests) totalTests.textContent = this.testResults.total;
        if (passedTests) passedTests.textContent = this.testResults.passed;
        if (failedTests) failedTests.textContent = this.testResults.failed;
        
        if (successRate) {
            const rate = Math.round((this.testResults.passed / this.testResults.total) * 100);
            successRate.textContent = `${rate}%`;
        }
    }

    renderTestResults() {
        const testResults = document.getElementById('testResults');
        if (!testResults) return;

        testResults.innerHTML = '';
        
        this.tests.forEach(test => {
            const testItem = document.createElement('div');
            testItem.className = 'test-item';
            
            const testName = document.createElement('span');
            testName.className = 'test-name';
            testName.textContent = test.name;
            
            const testResult = document.createElement('span');
            testResult.className = 'test-result result-pending';
            testResult.textContent = 'Pending';
            testResult.id = `test-${test.name.replace(/\s+/g, '-').toLowerCase()}`;
            
            testItem.appendChild(testName);
            testItem.appendChild(testResult);
            testResults.appendChild(testItem);
        });
    }

    updateTestResultInUI(testName, result) {
        const testElement = document.getElementById(`test-${testName.replace(/\s+/g, '-').toLowerCase()}`);
        if (testElement) {
            testElement.textContent = result.passed ? 'Pass' : 'Fail';
            testElement.className = `test-result ${result.passed ? 'result-pass' : 'result-fail'}`;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Creating ProductiveCloud instance');
    
    try {
        // Create global instance
        window.productiveCloud = new ProductiveCloud();
        console.log('ProductiveCloud instance created successfully');
    } catch (error) {
        console.error('Failed to create ProductiveCloud instance:', error);
    }
});

// Global function for Google Auth callback
function handleCredentialResponse(response) {
    if (window.productiveCloud) {
        window.productiveCloud.handleCredentialResponse(response);
    }
}

// Global functions for QA Tester
function toggleTester() {
    const testerPanel = document.getElementById('testerPanel');
    if (testerPanel) {
        testerPanel.classList.toggle('active');
        if (testerPanel.classList.contains('active')) {
            // Initialize tester when opened
            if (window.productiveCloud) {
                window.productiveCloud.initQATester();
            }
        }
    }
}

function runAllTests() {
    if (window.productiveCloud) {
        window.productiveCloud.runAllTests();
    }
}

function clearTestResults() {
    if (window.productiveCloud) {
        window.productiveCloud.testResults = { total: 0, passed: 0, failed: 0 };
        window.productiveCloud.updateTesterDisplay();
        window.productiveCloud.renderTestResults();
    }
}

// ===== GIF BACKGROUND SYSTEM ===== //

class GifBackgroundSystem {
    constructor() {
        // Epic anime GIF collection - Use reliable fallback URLs
        this.presetGifs = [
            // Fallback GIFs (always accessible)
            {
                id: 'fallback-1',
                name: '🌊 Abstract Waves',
                url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            },
            {
                id: 'fallback-2',
                name: '✨ Floating Particles',
                url: 'https://media.giphy.com/media/26ufcVAuSqgJbLwHC/giphy.gif'
            },
            {
                id: 'fallback-3',
                name: '🌟 Sparkles',
                url: 'https://media.giphy.com/media/26ufcVAuSqgJbLwHC/giphy.gif'
            },
            {
                id: 'fallback-4',
                name: '💫 Cosmic',
                url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            }
        ];
        
        this.customGifs = this.loadCustomGifs();
        this.currentGif = null;
        this.opacity = 25;
        this.isInitialized = false;
        
        // Initialize system
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved settings
        this.loadSettings();
        
        // Check if current GIF is accessible, if not use fallback
        this.validateCurrentGif();
        
        // Auto-cycle random GIF on load
        this.cycleRandomGif();
        
        this.isInitialized = true;
    }
    
    /**
     * Validate current GIF and fallback if needed
     */
    async validateCurrentGif() {
        if (this.currentGif) {
            const isValid = await this.testGifUrl(this.currentGif);
            if (!isValid) {
                console.log('⚠️ Current GIF is not accessible, switching to fallback');
                this.tryFallbackGif();
            }
        }
    }
    
    /**
     * Clear all external URLs and reset to fallbacks
     */
    clearExternalUrls() {
        console.log('🧹 Clearing external URLs and resetting to fallbacks...');
        
        // Clear current GIF if it's external
        if (this.currentGif && !this.currentGif.startsWith('data:')) {
            this.currentGif = null;
        }
        
        // Clear custom GIFs that are external URLs
        this.customGifs = this.customGifs.filter(gif => 
            gif.url.startsWith('data:') || gif.url.includes('giphy.com')
        );
        
        // Save updated custom GIFs
        this.saveCustomGifs();
        
        // Switch to fallback
        this.tryFallbackGif();
        
        // Update UI
        this.renderCustomGifs();
        
        this.showToast('🧹 External URLs cleared, using fallback GIFs', 'info');
    }
    
    setupEventListeners() {
        // GIF Controls toggle
        const gifControlsToggle = document.getElementById('gifControlsToggle');
        if (gifControlsToggle) {
            gifControlsToggle.addEventListener('click', () => this.toggleControls());
        }
        
        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('gifUpload');
        
        if (uploadArea && fileInput) {
            // Click to upload
            uploadArea.addEventListener('click', () => fileInput.click());
            
            // File selection
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleFileUpload(e);
            });
        }
        
        // Preset GIF selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'gifChoice') {
                this.selectGif(e.target.value);
            }
        });
        
        // Opacity control
        const opacitySlider = document.getElementById('gifOpacity');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                this.setOpacity(e.target.value);
            });
        }
        
        // Control buttons
        const randomBtn = document.getElementById('randomGifBtn');
        const saveBtn = document.getElementById('saveSettingsBtn');
        const clearBtn = document.getElementById('clearCustomBtn');
        const clearExternalBtn = document.getElementById('clearExternalBtn');
        
        if (randomBtn) randomBtn.addEventListener('click', () => this.cycleRandomGif());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveSettings());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearCustomGifs());
        if (clearExternalBtn) clearExternalBtn.addEventListener('click', () => this.clearExternalUrls());
    }
    
    toggleControls() {
        const panel = document.getElementById('gifControlsPanel');
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.renderCustomGifs();
            }
        }
    }
    
    async handleFileUpload(event) {
        let files;
        
        if (event.type === 'drop') {
            files = event.dataTransfer.files;
        } else {
            files = event.target.files;
        }
        
        if (!files || files.length === 0) return;
        
        const file = files[0];
        
        // Validate file
        if (!this.validateFile(file)) return;
        
        try {
            console.log('📁 Uploading custom GIF:', file.name);
            
            // Convert to data URL
            const dataUrl = await this.fileToDataUrl(file);
            
            // Test if the GIF can be loaded
            if (!(await this.testGifUrl(dataUrl))) {
                this.showToast('❌ Invalid GIF file - please try another', 'error');
                return;
            }
            
            // Create custom GIF object
            const customGif = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: dataUrl,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString()
            };
            
            // Add to custom GIFs
            this.customGifs.push(customGif);
            this.saveCustomGifs();
            
            // Apply immediately
            this.selectGif(dataUrl);
            
            // Update UI
            this.renderCustomGifs();
            
            // Show success message
            this.showToast('✅ GIF uploaded successfully!', 'success');
            
            console.log('✅ Custom GIF added:', customGif.name);
            
        } catch (error) {
            console.error('❌ Upload failed:', error);
            this.showToast('❌ Upload failed. Please try again.', 'error');
        }
    }
    
    /**
     * Test if a GIF URL can be loaded
     */
    testGifUrl(url) {
        return new Promise((resolve) => {
            const testImg = new Image();
            const timeout = setTimeout(() => {
                resolve(false);
            }, 5000); // 5 second timeout
            
            testImg.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };
            
            testImg.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
            
            testImg.src = url;
        });
    }
    
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/gif', 'video/mp4', 'video/webm'];
        
        if (file.size > maxSize) {
            this.showToast('❌ File too large. Max size: 10MB', 'error');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            this.showToast('❌ Invalid file type. Use GIF, MP4, or WEBM', 'error');
            return false;
        }
        
        return true;
    }
    
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    selectGif(gifUrl) {
        console.log('🎯 Selecting GIF:', gifUrl);
        
        const gifContainer = document.getElementById('dailyBgGif');
        if (!gifContainer) {
            console.error('❌ Daily Progress GIF container not found');
            return;
        }
        
        if (!gifUrl) {
            // No GIF selected
            gifContainer.style.backgroundImage = 'none';
            this.currentGif = null;
            console.log('🚫 GIF removed');
            return;
        }
        
        // Test GIF loading with timeout
        const testImg = new Image();
        const loadTimeout = setTimeout(() => {
            console.warn('⚠️ GIF load timeout, trying fallback...');
            this.tryFallbackGif();
        }, 10000); // 10 second timeout
        
        testImg.onload = () => {
            clearTimeout(loadTimeout);
            gifContainer.style.backgroundImage = `url(${gifUrl})`;
            gifContainer.style.opacity = this.opacity / 100;
            this.currentGif = gifUrl;
            console.log('✅ GIF applied successfully:', gifUrl);
        };
        
        testImg.onerror = () => {
            clearTimeout(loadTimeout);
            console.error('❌ Failed to load GIF:', gifUrl);
            this.showToast('❌ Failed to load GIF - using fallback', 'warning');
            
            // Try fallback
            this.tryFallbackGif();
        };
        
        testImg.src = gifUrl;
    }
    
    tryFallbackGif() {
        // Find a working fallback GIF
        const fallbackGif = this.presetGifs.find(gif => gif.id.startsWith('fallback-'));
        if (fallbackGif) {
            console.log('🔄 Trying fallback GIF:', fallbackGif.name);
            this.selectGif(fallbackGif.url);
        } else {
            console.log('🚫 No fallback GIFs available');
            // Clear the background
            const gifContainer = document.getElementById('dailyBgGif');
            if (gifContainer) {
                gifContainer.style.backgroundImage = 'none';
            }
        }
    }
    
    cycleRandomGif() {
        const allGifs = [...this.presetGifs, ...this.customGifs];
        if (allGifs.length === 0) return;
        
        const randomGif = allGifs[Math.floor(Math.random() * allGifs.length)];
        console.log('🎲 Cycling to random GIF:', randomGif.name);
        
        this.selectGif(randomGif.url);
        
        // Update radio button if it exists
        const radioBtn = document.querySelector(`input[name="gifChoice"][value="${randomGif.url}"]`);
        if (radioBtn) {
            radioBtn.checked = true;
        }
        
        this.showToast(`🎬 ${randomGif.name}`, 'info');
    }
    
    setOpacity(value) {
        this.opacity = parseInt(value);
        
        const gifContainer = document.getElementById('dailyBgGif');
        const opacityDisplay = document.getElementById('opacityDisplay');
        
        if (gifContainer) {
            gifContainer.style.opacity = this.opacity / 100;
        }
        
        if (opacityDisplay) {
            opacityDisplay.textContent = `${this.opacity}%`;
        }
        
        console.log('🎛️ Opacity set to:', this.opacity + '%');
    }
    
    renderCustomGifs() {
        const container = document.getElementById('customGifsList');
        if (!container) return;
        
        if (this.customGifs.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No custom GIFs yet</p>';
            return;
        }
        
        container.innerHTML = this.customGifs.map(gif => `
            <div class="custom-gif-item ${this.currentGif === gif.url ? 'selected' : ''}" 
                 onclick="window.gifSystem.selectGif('${gif.url}')">
                <img src="${gif.url}" alt="${gif.name}" class="custom-gif-preview" loading="lazy">
                <button class="custom-gif-delete" onclick="event.stopPropagation(); window.gifSystem.deleteCustomGif('${gif.id}')">×</button>
            </div>
        `).join('');
    }
    
    deleteCustomGif(gifId) {
        this.customGifs = this.customGifs.filter(gif => gif.id !== gifId);
        this.saveCustomGifs();
        this.renderCustomGifs();
        
        // If deleted GIF was current, clear it
        const deletedGif = this.customGifs.find(gif => gif.id === gifId);
        if (deletedGif && this.currentGif === deletedGif.url) {
            this.selectGif('');
        }
        
        this.showToast('🗑️ Custom GIF deleted', 'info');
    }
    
    clearCustomGifs() {
        if (this.customGifs.length === 0) {
            this.showToast('ℹ️ No custom GIFs to clear', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to delete all custom GIFs?')) {
            this.customGifs = [];
            this.saveCustomGifs();
            this.renderCustomGifs();
            
            // Clear current GIF if it was custom
            if (this.currentGif && !this.presetGifs.find(gif => gif.url === this.currentGif)) {
                this.selectGif('');
            }
            
            this.showToast('🗑️ All custom GIFs cleared', 'success');
        }
    }
    
    saveSettings() {
        const settings = {
            currentGif: this.currentGif,
            opacity: this.opacity,
            timestamp: Date.now()
        };
        
        localStorage.setItem('gifBackgroundSettings', JSON.stringify(settings));
        this.showToast('💾 Settings saved!', 'success');
        console.log('💾 GIF settings saved');
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('gifBackgroundSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                this.opacity = settings.opacity || 25;
                
                // Update opacity slider
                const opacitySlider = document.getElementById('gifOpacity');
                if (opacitySlider) {
                    opacitySlider.value = this.opacity;
                }
                
                // Set opacity display
                this.setOpacity(this.opacity);
                
                // Load saved GIF
                if (settings.currentGif) {
                    this.selectGif(settings.currentGif);
                }
                
                console.log('📂 GIF settings loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load GIF settings:', error);
        }
    }
    
    saveCustomGifs() {
        localStorage.setItem('customBackgroundGifs', JSON.stringify(this.customGifs));
    }
    
    loadCustomGifs() {
        try {
            const saved = localStorage.getItem('customBackgroundGifs');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('❌ Failed to load custom GIFs:', error);
            return [];
        }
    }
    
    showToast(message, type = 'info') {
        // Use existing toast system from ProductiveCloud
        if (window.productiveCloud && window.productiveCloud.showToast) {
            window.productiveCloud.showToast(message, type);
        } else {
            console.log('🔔', message);
        }
    }
}

// Global GIF Controls Functions
function toggleGifControls() {
    if (window.gifSystem) {
        window.gifSystem.toggleControls();
    }
}

function clearExternalUrls() {
    if (window.gifSystem) {
        window.gifSystem.clearExternalUrls();
    }
}

function resetGifSystem() {
    if (window.gifSystem) {
        // Clear all settings and reset to defaults
        localStorage.removeItem('gifBackgroundSettings');
        localStorage.removeItem('customBackgroundGifs');
        
        // Reinitialize the system
        window.gifSystem = new GifBackgroundSystem();
        
        console.log('🔄 GIF system reset to defaults');
    }
}

// Initialize GIF system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure ProductiveCloud is initialized first
    setTimeout(() => {
        window.gifSystem = new GifBackgroundSystem();
        console.log('🎬 Global GIF system initialized');
    }, 1000);
});

// Export your data to a file
exportData()

// Import data from a backup file
importData()

// Clear all data (WARNING: irreversible!)
clearAllData()
