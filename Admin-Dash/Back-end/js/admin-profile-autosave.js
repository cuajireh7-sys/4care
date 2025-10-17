// Admin Profile Auto-Save Functionality
class AdminProfileAutoSave {
    constructor() {
        this.saveTimeout = null;
        this.saveDelay = 3000; // 3 seconds delay for profile changes
        this.baseUrl = 'back-end/api/';
        this.init();
    }

    init() {
        this.loadProfileData();
        this.setupFormListeners();
    }

    async loadProfileData() {
        try {
            const response = await fetch(`${this.baseUrl}get-admin-profile.php`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const data = result.data;
                
                // Populate form fields
                const nameField = document.getElementById('userName');
                const emailField = document.getElementById('userEmail');
                const phoneField = document.getElementById('userPhone');
                
                if (nameField) nameField.value = data.name || 'Admin User';
                if (emailField) emailField.value = data.email || 'admin@4care.com';
                if (phoneField) phoneField.value = data.phone || '+63 912 345 6789';
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    setupFormListeners() {
        const form = document.getElementById('userProfileForm');
        if (!form) return;

        // Get form fields
        const nameField = document.getElementById('userName');
        const emailField = document.getElementById('userEmail');
        const phoneField = document.getElementById('userPhone');
        const currentPasswordField = document.getElementById('currentPassword');
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmNewPassword');

        // Add input listeners for auto-save (excluding password fields)
        if (nameField) {
            nameField.addEventListener('input', () => this.scheduleProfileSave());
        }
        if (emailField) {
            emailField.addEventListener('input', () => this.scheduleProfileSave());
        }
        if (phoneField) {
            phoneField.addEventListener('input', () => this.scheduleProfileSave());
        }

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Check if user is trying to change password
            const newPasswordField = document.getElementById('newPassword');
            const confirmPasswordField = document.getElementById('confirmNewPassword');
            const currentPasswordField = document.getElementById('currentPassword');
            
            const hasPasswordChange = (newPasswordField && newPasswordField.value.trim()) || 
                                    (confirmPasswordField && confirmPasswordField.value.trim()) || 
                                    (currentPasswordField && currentPasswordField.value.trim());
            
            if (hasPasswordChange) {
                // User is trying to change password, validate all fields
                this.handlePasswordChange();
            } else {
                // No password change, just save profile data
                this.saveProfileData();
            }
        });

        // Add blur listeners for immediate save
        if (nameField) {
            nameField.addEventListener('blur', () => this.saveProfileData());
        }
        if (emailField) {
            emailField.addEventListener('blur', () => this.saveProfileData());
        }
        if (phoneField) {
            phoneField.addEventListener('blur', () => this.saveProfileData());
        }
    }

    scheduleProfileSave() {
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set new timeout
        this.saveTimeout = setTimeout(() => {
            this.saveProfileData();
        }, this.saveDelay);
    }

    async saveProfileData() {
        const nameField = document.getElementById('userName');
        const emailField = document.getElementById('userEmail');
        const phoneField = document.getElementById('userPhone');

        if (!nameField || !emailField || !phoneField) return;

        const profileData = {
            name: nameField.value.trim(),
            email: emailField.value.trim(),
            phone: phoneField.value.trim()
        };

        try {
            const response = await fetch(`${this.baseUrl}update-admin-profile.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSaveIndicator('Profile updated successfully', 'success');
            } else {
                console.error('Save failed:', result.message);
                this.showSaveIndicator('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showSaveIndicator('Error saving profile', 'error');
        }
    }

    async handlePasswordChange() {
        const currentPasswordField = document.getElementById('currentPassword');
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmNewPassword');

        if (!currentPasswordField || !newPasswordField || !confirmPasswordField) return;

        const currentPassword = currentPasswordField.value;
        const newPassword = newPasswordField.value;
        const confirmPassword = confirmPasswordField.value;

        // Only validate passwords if user is actually trying to change password
        if (newPassword || confirmPassword || currentPassword) {
            // Validate passwords
            if (!currentPassword || !newPassword || !confirmPassword) {
                this.showSaveIndicator('All password fields are required to change password', 'error');
                return;
            }
        } else {
            // No password change requested, just save profile data
            this.saveProfileData();
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showSaveIndicator('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showSaveIndicator('New password must be at least 6 characters', 'error');
            return;
        }

        // Get other profile data
        const nameField = document.getElementById('userName');
        const emailField = document.getElementById('userEmail');
        const phoneField = document.getElementById('userPhone');

        const profileData = {
            name: nameField ? nameField.value.trim() : '',
            email: emailField ? emailField.value.trim() : '',
            phone: phoneField ? phoneField.value.trim() : '',
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
        };

        try {
            const response = await fetch(`${this.baseUrl}update-admin-profile.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSaveIndicator('Password changed successfully', 'success');
                // Clear password fields
                currentPasswordField.value = '';
                newPasswordField.value = '';
                confirmPasswordField.value = '';
            } else {
                this.showSaveIndicator('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showSaveIndicator('Error changing password', 'error');
        }
    }

    showSaveIndicator(message, status) {
        // Remove existing indicators
        const existingIndicator = document.querySelector('.profile-save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'profile-save-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 300px;
        `;

        if (status === 'success') {
            indicator.textContent = '✓ ' + message;
            indicator.style.backgroundColor = '#10b981';
            indicator.style.color = 'white';
        } else if (status === 'error') {
            indicator.textContent = '✗ ' + message;
            indicator.style.backgroundColor = '#ef4444';
            indicator.style.color = 'white';
        }

        document.body.appendChild(indicator);

        // Remove indicator after 4 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 4000);
    }
}

// Initialize auto-save when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminProfileAutoSave();
});
