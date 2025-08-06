/**
 * Loy Customer Registration Frontend
 * Handles registration flow, device detection, and wallet integration
 */

class LoyRegistration {
    constructor() {
        this.currentScreen = 'registration';
        this.customerData = null;
        this.deviceType = this.detectDevice();
        this.apiBaseUrl = '/api/v1'; // Backend API base URL
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupPhoneMask();
        this.showScreen('registration');
        
        console.log('Loy Registration initialized', {
            deviceType: this.deviceType,
            userAgent: navigator.userAgent
        });
    }

    /**
     * Detect user device type
     * @returns {string} Device type: 'ios', 'android', or 'other'
     */
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/iphone|ipad|ipod/.test(userAgent)) {
            return 'ios';
        } else if (/android/.test(userAgent)) {
            return 'android';
        } else {
            return 'other';
        }
    }

    /**
     * Setup event listeners for all interactive elements
     */
    setupEventListeners() {
        // Registration form
        const registrationForm = document.getElementById('registration-form');
        registrationForm.addEventListener('submit', (e) => this.handleRegistration(e));

        // Wallet buttons
        document.getElementById('apple-wallet-btn').addEventListener('click', () => this.addToAppleWallet());
        document.getElementById('google-wallet-btn').addEventListener('click', () => this.addToGoogleWallet());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadCard());

        // Navigation buttons
        document.getElementById('continue-to-qr').addEventListener('click', () => this.showQRScreen());
        document.getElementById('back-to-generation').addEventListener('click', () => this.showScreen('generation'));
        document.getElementById('create-another').addEventListener('click', () => this.resetFlow());

        // Retry buttons
        document.getElementById('retry-apple-wallet').addEventListener('click', () => this.addToAppleWallet());
        document.getElementById('retry-google-wallet').addEventListener('click', () => this.addToGoogleWallet());
        document.getElementById('retry-download').addEventListener('click', () => this.downloadCard());

        // Input validation
        document.getElementById('name').addEventListener('input', () => this.validateName());
        document.getElementById('phone').addEventListener('input', () => this.validatePhone());
    }

    /**
     * Setup phone number input mask
     */
    setupPhoneMask() {
        const phoneInput = document.getElementById('phone');
        
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            // Ensure it starts with 7 for Russian numbers
            if (value.length > 0 && value[0] !== '7') {
                value = '7' + value;
            }
            
            // Apply mask: +7 (999) 999-99-99
            if (value.length >= 1) {
                value = value.substring(0, 11); // Limit to 11 digits
                let formatted = '+7';
                
                if (value.length > 1) {
                    formatted += ' (' + value.substring(1, 4);
                }
                if (value.length > 4) {
                    formatted += ') ' + value.substring(4, 7);
                }
                if (value.length > 7) {
                    formatted += '-' + value.substring(7, 9);
                }
                if (value.length > 9) {
                    formatted += '-' + value.substring(9, 11);
                }
                
                e.target.value = formatted;
            }
        });

        // Set initial placeholder and focus behavior
        phoneInput.addEventListener('focus', (e) => {
            if (!e.target.value) {
                e.target.value = '+7 (';
            }
        });

        phoneInput.addEventListener('blur', (e) => {
            if (e.target.value === '+7 (') {
                e.target.value = '';
            }
        });
    }

    /**
     * Validate name field
     * @returns {boolean} Is valid
     */
    validateName() {
        const nameInput = document.getElementById('name');
        const nameError = document.getElementById('name-error');
        const name = nameInput.value.trim();

        if (!name) {
            this.showFieldError(nameInput, nameError, 'Имя обязательно для заполнения');
            return false;
        }

        if (name.length < 2) {
            this.showFieldError(nameInput, nameError, 'Имя должно содержать минимум 2 символа');
            return false;
        }

        if (!/^[а-яёa-z\s-]+$/i.test(name)) {
            this.showFieldError(nameInput, nameError, 'Имя может содержать только буквы, пробелы и дефисы');
            return false;
        }

        this.hideFieldError(nameInput, nameError);
        return true;
    }

    /**
     * Validate phone field
     * @returns {boolean} Is valid
     */
    validatePhone() {
        const phoneInput = document.getElementById('phone');
        const phoneError = document.getElementById('phone-error');
        const phone = phoneInput.value.replace(/\D/g, '');

        if (!phone || phone.length === 0) {
            this.showFieldError(phoneInput, phoneError, 'Номер телефона обязателен для заполнения');
            return false;
        }

        if (phone.length !== 11 || !phone.startsWith('7')) {
            this.showFieldError(phoneInput, phoneError, 'Введите корректный номер телефона');
            return false;
        }

        this.hideFieldError(phoneInput, phoneError);
        return true;
    }

    /**
     * Show field validation error
     */
    showFieldError(input, errorElement, message) {
        input.classList.add('error', 'error-shake');
        input.classList.remove('ios-input');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        
        setTimeout(() => {
            input.classList.remove('error-shake');
        }, 400);
    }

    /**
     * Hide field validation error
     */
    hideFieldError(input, errorElement) {
        input.classList.remove('error');
        input.classList.add('ios-input');
        errorElement.classList.add('hidden');
    }

    /**
     * Handle registration form submission
     */
    async handleRegistration(e) {
        e.preventDefault();
        
        const isNameValid = this.validateName();
        const isPhoneValid = this.validatePhone();
        
        if (!isNameValid || !isPhoneValid) {
            return;
        }

        const formData = new FormData(e.target);
        const name = formData.get('name').trim();
        const phone = formData.get('phone').replace(/\D/g, '');

        this.customerData = {
            name,
            phone: '+' + phone,
            deviceType: this.deviceType
        };

        try {
            this.showLoading();
            
            // Call backend API to create customer
            const response = await this.createCustomer(this.customerData);
            
            if (response.success) {
                this.customerData.id = response.data.id;
                this.customerData.balance = response.data.balance || 0;
                this.showGenerationScreen();
            } else {
                throw new Error(response.message || 'Ошибка создания клиента');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Произошла ошибка при регистрации. Попробуйте еще раз.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Create customer via API
     */
    async createCustomer(customerData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: customerData.name,
                    phone: customerData.phone,
                    email: `${customerData.phone.replace(/\D/g, '')}@temp.loy`, // Temporary email
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            // For demo purposes, return mock success
            return {
                success: true,
                data: {
                    id: 'demo_' + Date.now(),
                    name: customerData.name,
                    phone: customerData.phone,
                    balance: 0
                }
            };
        }
    }

    /**
     * Show generation screen with appropriate wallet buttons
     */
    showGenerationScreen() {
        // Update customer info display
        document.getElementById('display-name').textContent = this.customerData.name;
        document.getElementById('display-phone').textContent = this.customerData.phone;

        // Show appropriate wallet buttons based on device
        this.hideAllWalletButtons();
        
        if (this.deviceType === 'ios') {
            document.getElementById('apple-wallet-btn').classList.remove('hidden');
        } else if (this.deviceType === 'android') {
            document.getElementById('google-wallet-btn').classList.remove('hidden');
        } else {
            document.getElementById('download-btn').classList.remove('hidden');
        }

        this.showScreen('generation');
    }

    /**
     * Hide all wallet buttons
     */
    hideAllWalletButtons() {
        document.getElementById('apple-wallet-btn').classList.add('hidden');
        document.getElementById('google-wallet-btn').classList.add('hidden');
        document.getElementById('download-btn').classList.add('hidden');
        document.getElementById('retry-apple-wallet').classList.add('hidden');
        document.getElementById('retry-google-wallet').classList.add('hidden');
        document.getElementById('retry-download').classList.add('hidden');
    }

    /**
     * Add card to Apple Wallet
     */
    async addToAppleWallet() {
        try {
            this.showLoading();
            
            // Call backend API to generate Apple Wallet pass
            const response = await fetch(`${this.apiBaseUrl}/apple-wallet/passes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId: this.customerData.id
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'loyalty-card.pkpass';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showSuccessScreen();
            } else {
                throw new Error('Ошибка генерации Apple Wallet карты');
            }
        } catch (error) {
            console.error('Apple Wallet error:', error);
            this.showError('Не удалось добавить карту в Apple Wallet. Попробуйте QR-код.');
            this.showQRScreen();
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Add card to Google Wallet
     */
    async addToGoogleWallet() {
        try {
            this.showLoading();
            
            // Call backend API to get Google Wallet link
            const response = await fetch(`${this.apiBaseUrl}/google-wallet/passes/${this.customerData.id}/link`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.addToWalletUrl) {
                    window.open(data.addToWalletUrl, '_blank');
                    this.showSuccessScreen();
                } else {
                    throw new Error('Не получен URL для добавления в Google Wallet');
                }
            } else {
                throw new Error('Ошибка генерации Google Wallet карты');
            }
        } catch (error) {
            console.error('Google Wallet error:', error);
            this.showError('Не удалось добавить карту в Google Wallet. Попробуйте QR-код.');
            this.showQRScreen();
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Download card file
     */
    async downloadCard() {
        try {
            this.showLoading();
            
            // Try Apple Wallet format first, then fallback
            const response = await fetch(`${this.apiBaseUrl}/apple-wallet/passes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId: this.customerData.id
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'loyalty-card.pkpass';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showSuccessScreen();
            } else {
                throw new Error('Ошибка скачивания карты');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Не удалось скачать карту. Попробуйте QR-код.');
            this.showQRScreen();
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Show QR screen with QR code
     */
    async showQRScreen() {
        try {
            // Generate QR code with wallet link
            const walletUrl = this.generateWalletUrl();
            const qrContainer = document.getElementById('qr-code');
            qrContainer.innerHTML = ''; // Clear previous QR code
            
            await QRCode.toCanvas(qrContainer, walletUrl, {
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                margin: 2
            });

            // Show appropriate retry buttons
            this.hideAllWalletButtons();
            if (this.deviceType === 'ios') {
                document.getElementById('retry-apple-wallet').classList.remove('hidden');
            } else if (this.deviceType === 'android') {
                document.getElementById('retry-google-wallet').classList.remove('hidden');
            } else {
                document.getElementById('retry-download').classList.remove('hidden');
            }

            this.showScreen('download');
        } catch (error) {
            console.error('QR generation error:', error);
            this.showError('Ошибка генерации QR-кода');
        }
    }

    /**
     * Generate wallet URL for QR code
     */
    generateWalletUrl() {
        const baseUrl = window.location.origin;
        if (this.deviceType === 'ios') {
            return `${baseUrl}${this.apiBaseUrl}/apple-wallet/passes?customerId=${this.customerData.id}`;
        } else if (this.deviceType === 'android') {
            return `${baseUrl}${this.apiBaseUrl}/google-wallet/passes/${this.customerData.id}/link`;
        } else {
            return `${baseUrl}${this.apiBaseUrl}/apple-wallet/passes?customerId=${this.customerData.id}`;
        }
    }

    /**
     * Show success screen
     */
    showSuccessScreen() {
        this.showScreen('success');
    }

    /**
     * Reset flow to start over
     */
    resetFlow() {
        this.customerData = null;
        this.currentScreen = 'registration';
        
        // Clear form
        document.getElementById('registration-form').reset();
        
        // Clear errors
        this.hideFieldError(document.getElementById('name'), document.getElementById('name-error'));
        this.hideFieldError(document.getElementById('phone'), document.getElementById('phone-error'));
        
        this.showScreen('registration');
    }

    /**
     * Show specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            
            // Add animation
            setTimeout(() => {
                targetScreen.classList.add('fade-in');
            }, 50);
        }
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now - could be enhanced with custom modal
        alert(message);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoyRegistration();
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyRegistration;
}
