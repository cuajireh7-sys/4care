// Admin Profile Management
// This file handles loading and updating admin profile information

class AdminProfileManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadProfileData();
        this.setupEventListeners();
    }

    async loadProfileData() {
        try {
            const response = await fetch('/4care/Admin-Dash/Back-end/api/get-admin-profile.php');
            const result = await response.json();
            
            if (result.success) {
                this.populateForm(result.data);
            } else {
                this.showMessage('Failed to load profile data', 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showMessage('Error loading profile data', 'error');
        }
    }

    populateForm(adminData) {
        // Populate form fields with admin data
        const nameField = document.getElementById('userName');
        const emailField = document.getElementById('userEmail');
        const phoneField = document.getElementById('userPhone');
        
        if (nameField) nameField.value = adminData.name || '';
        if (emailField) emailField.value = adminData.email || '';
        if (phoneField) phoneField.value = adminData.phone || '';
    }

    setupEventListeners() {
        const saveButton = document.getElementById('saveProfileBtn');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveProfile());
        }

        // Clear password fields when not changing password
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            field.addEventListener('input', () => {
                if (field.id === 'currentPassword' && field.value === '') {
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmNewPassword').value = '';
                }
            });
        });
    }

    async saveProfile() {
        try {
            const formData = this.collectFormData();
            
            // Validate form data
            if (!this.validateForm(formData)) {
                return;
            }

            // Show loading state
            this.setSaveButtonLoading(true);

            const response = await fetch('/4care/Admin-Dash/Back-end/api/update-admin-profile.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message || 'Profile updated successfully!', 'success');
                this.clearPasswordFields();
                
                // Check if logout is required (password change)
                if (result.logout_required) {
                    // Show logout message and redirect to login
                    setTimeout(() => {
                        this.showMessage('Redirecting to login page...', 'info');
                        setTimeout(() => {
                            window.location.href = '/4care/Staff-Login/Staff-Login.html';
                        }, 2000);
                    }, 1000);
                }
            } else {
                this.showMessage(result.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showMessage('Error updating profile', 'error');
        } finally {
            this.setSaveButtonLoading(false);
        }
    }

    collectFormData() {
        return {
            name: document.getElementById('userName')?.value || '',
            email: document.getElementById('userEmail')?.value || '',
            phone: document.getElementById('userPhone')?.value || '',
            current_password: document.getElementById('currentPassword')?.value || '',
            new_password: document.getElementById('newPassword')?.value || '',
            confirm_password: document.getElementById('confirmNewPassword')?.value || ''
        };
    }

    validateForm(data) {
        // Check if password change is requested
        const passwordChange = data.current_password || data.new_password || data.confirm_password;
        
        if (passwordChange) {
            if (!data.current_password) {
                this.showMessage('Current password is required', 'error');
                return false;
            }
            if (!data.new_password) {
                this.showMessage('New password is required', 'error');
                return false;
            }
            if (!data.confirm_password) {
                this.showMessage('Please confirm your new password', 'error');
                return false;
            }
            if (data.new_password !== data.confirm_password) {
                this.showMessage('New password and confirm password do not match', 'error');
                return false;
            }
            if (data.new_password.length < 6) {
                this.showMessage('New password must be at least 6 characters long', 'error');
                return false;
            }
        }

        if (!data.name.trim()) {
            this.showMessage('Name is required', 'error');
            return false;
        }

        if (!data.email.trim()) {
            this.showMessage('Email is required', 'error');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    clearPasswordFields() {
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            field.value = '';
        });
    }

    setSaveButtonLoading(loading) {
        const saveButton = document.getElementById('saveProfileBtn');
        if (saveButton) {
            if (loading) {
                saveButton.disabled = true;
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            } else {
                saveButton.disabled = false;
                saveButton.innerHTML = '<i class="fas fa-save"></i> Save Profile Changes';
            }
        }
    }

    showMessage(message, type) {
        // Create or update message element
        let messageEl = document.getElementById('profileMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'profileMessage';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                transition: opacity 0.3s ease;
                max-width: 300px;
            `;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        
        // Set background color based on message type
        if (type === 'success') {
            messageEl.style.backgroundColor = '#4CAF50';
        } else if (type === 'info') {
            messageEl.style.backgroundColor = '#2196F3';
        } else {
            messageEl.style.backgroundColor = '#f44336';
        }
        
        messageEl.style.opacity = '1';

        // Hide after 3 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AdminProfileManager();
});