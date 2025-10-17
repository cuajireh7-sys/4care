// Doctor Profile Management
// This file handles loading and updating doctor profile information

class DoctorProfileManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadProfileData();
        this.setupEventListeners();
    }

    async loadProfileData() {
        try {
            console.log('Loading doctor profile data...');
            const response = await fetch('/4care/Doc-Dash/Back-end/api/get-doctor-profile.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Profile data loaded:', result);
            
            if (result.success) {
                this.populateForm(result.data);
                console.log('Profile form populated successfully');
            } else {
                console.error('API returned error:', result.message);
                this.showMessage('Failed to load profile data: ' + (result.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showMessage('Error loading profile data: ' + error.message, 'error');
        }
    }

    populateForm(doctorData) {
        // Update the display section with real data
        this.updateDisplaySection(doctorData);
    }
    
    updateDisplaySection(doctorData) {
        // Update the profile display section with real data
        const displayName = document.getElementById('profileDoctorName');
        const displayEmail = document.getElementById('profileDoctorEmail');
        const displayPosition = document.getElementById('profileDoctorPosition');
        
        if (displayName) displayName.textContent = doctorData.name || '';
        if (displayEmail) displayEmail.textContent = doctorData.email || '';
        if (displayPosition) displayPosition.textContent = doctorData.specialization_name || doctorData.specialization || '';
        
        // Update simplified profile fields
        this.updateSimplifiedFields(doctorData);
    }
    
    updateProfessionalInfo(doctorData) {
        console.log('Updating professional info with data:', doctorData);
        
        // Update professional information fields with correct IDs
        const employeeIdField = document.getElementById('profileEmployeeId');
        const licenseField = document.getElementById('profileLicenseNumber');
        const experienceField = document.getElementById('profileExperience');
        const joinedDateField = document.getElementById('profileJoinedDate');
        const phoneField = document.getElementById('profilePhone');
        const addressField = document.getElementById('profileAddress');
        const dobField = document.getElementById('profileDob');
        const educationField = document.getElementById('profileEducation');
        const certificationsField = document.getElementById('profileCertifications');
        const departmentField = document.getElementById('profileDepartment');
        const shiftField = document.getElementById('profileShift');
        const emergencyContactField = document.getElementById('profileEmergencyContact');
        const specializationField = document.getElementById('profileSpecialization');
        
        console.log('Found elements:', {
            employeeIdField: !!employeeIdField,
            licenseField: !!licenseField,
            experienceField: !!experienceField,
            joinedDateField: !!joinedDateField,
            phoneField: !!phoneField,
            addressField: !!addressField,
            dobField: !!dobField,
            educationField: !!educationField,
            certificationsField: !!certificationsField,
            departmentField: !!departmentField,
            shiftField: !!shiftField,
            emergencyContactField: !!emergencyContactField,
            specializationField: !!specializationField
        });
        
        // Professional info
        if (employeeIdField && doctorData.professional_info) {
            employeeIdField.textContent = doctorData.professional_info.employee_id || 'DOC-001';
        }
        if (licenseField && doctorData.professional_info) {
            licenseField.textContent = doctorData.professional_info.license_number || 'MD-123456';
        }
        if (experienceField && doctorData.professional_info) {
            experienceField.textContent = (doctorData.professional_info.experience_years || 15) + ' Years';
        }
        if (joinedDateField && doctorData.professional_info) {
            joinedDateField.textContent = doctorData.professional_info.joined_date || '2008-09-01';
        }
        
        // Basic info
        if (phoneField) {
            phoneField.textContent = doctorData.phone || '+63 912 345 6789';
        }
        if (addressField) {
            addressField.textContent = doctorData.address || '123 Health St, Medical City';
        }
        if (dobField) {
            dobField.textContent = doctorData.dob || '1980-05-15';
        }
        
        // Specialization
        if (specializationField) {
            specializationField.textContent = doctorData.specialization_name || doctorData.specialization || 'General Medicine';
        }
        
        // Education
        if (educationField && doctorData.education && doctorData.education.length > 0) {
            const educationText = doctorData.education.map(edu => `${edu.degree} - ${edu.institution} (${edu.graduation_year})`).join(', ');
            educationField.textContent = educationText;
        } else if (educationField) {
            educationField.textContent = 'MD, University of Health Sciences';
        }
        
        // Certifications
        if (certificationsField && doctorData.certifications && doctorData.certifications.length > 0) {
            const certText = doctorData.certifications.map(cert => cert.certification_name).join(', ');
            certificationsField.textContent = certText;
        } else if (certificationsField) {
            certificationsField.textContent = 'BLS, ACLS';
        }
        
        // Department and shift
        if (departmentField) {
            departmentField.textContent = doctorData.department_name || 'General Medicine';
        }
        if (shiftField) {
            shiftField.textContent = doctorData.current_shift_name || 'Morning Shift';
        }
        
        // Emergency contact
        if (emergencyContactField && doctorData.emergency_contacts && doctorData.emergency_contacts.length > 0) {
            const contact = doctorData.emergency_contacts[0]; // Get primary contact
            emergencyContactField.textContent = `${contact.contact_name} (${contact.relationship}) - ${contact.phone}`;
        } else if (emergencyContactField) {
            emergencyContactField.textContent = 'Alice Smith (Sister) - +1 (555) 987-6543';
        }
    }
    
    updateSimplifiedFields(doctorData) {
        console.log('Updating simplified fields with data:', doctorData);
        
        // Update only the fields that exist in the simplified database
        const employeeIdField = document.getElementById('profileEmployeeId');
        const emailField = document.getElementById('profileEmail');
        const hospitalStatusField = document.getElementById('profileHospitalStatus');
        const createdAtField = document.getElementById('profileCreatedAt');
        const updatedAtField = document.getElementById('profileUpdatedAt');
        
        console.log('Found simplified elements:', {
            employeeIdField: !!employeeIdField,
            emailField: !!emailField,
            hospitalStatusField: !!hospitalStatusField,
            createdAtField: !!createdAtField,
            updatedAtField: !!updatedAtField
        });
        
        // Update fields with available data
        if (employeeIdField) {
            employeeIdField.textContent = doctorData.employee_id || 'DOC-001';
        }
        
        if (emailField) {
            emailField.textContent = doctorData.email || 'doctor@4care.com';
        }
        
        if (hospitalStatusField) {
            hospitalStatusField.textContent = doctorData.hospital_status ? 'Online' : 'Offline';
        }
        
        if (createdAtField) {
            const createdDate = new Date(doctorData.created_at);
            createdAtField.textContent = createdDate.toLocaleDateString() || '2025-10-13';
        }
        
        if (updatedAtField) {
            const updatedDate = new Date(doctorData.updated_at);
            updatedAtField.textContent = updatedDate.toLocaleDateString() || '2025-10-13';
        }
    }

    setupEventListeners() {
        const saveButton = document.getElementById('saveDoctorProfileBtn');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveProfile());
        }

        // Clear password fields when not changing password
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            field.addEventListener('input', () => {
                if (field.id === 'currentPassword' && field.value === '') {
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
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

            const response = await fetch('/4care/Doc-Dash/Back-end/api/update-doctor-profile.php', {
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
                
                // Refresh profile data to update display
                this.loadProfileData();
                
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
        const data = {
            name: document.getElementById('doctorName')?.value || '',
            email: document.getElementById('doctorEmail')?.value || '',
            phone: document.getElementById('doctorPhone')?.value || '',
            specialization: document.getElementById('doctorSpecialization')?.value || '',
            license_number: document.getElementById('doctorLicense')?.value || '',
            current_password: document.getElementById('currentPassword')?.value || '',
            new_password: document.getElementById('newPassword')?.value || '',
            confirm_password: document.getElementById('confirmPassword')?.value || ''
        };
        
        return data;
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
        const saveButton = document.getElementById('saveDoctorProfileBtn');
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
        let messageEl = document.getElementById('doctorProfileMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'doctorProfileMessage';
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
    new DoctorProfileManager();
});