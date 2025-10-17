// Admin Schedule Auto-Save Functionality
class AdminScheduleAutoSave {
    constructor() {
        // Use absolute path to ensure it works from any location (match actual folder case)
        this.baseUrl = '/4care/Admin-Dash/Back-end/api/';
        console.log('AdminScheduleAutoSave initialized with baseUrl:', this.baseUrl);
        this.init();
    }

    init() {
        // Wait a bit for the page to fully load, then setup the form
        setTimeout(() => {
            this.setupScheduleForm();
        }, 1000);
        this.loadExistingSchedules();
        this.setupRealtimeRefresh();
    }

    setupScheduleForm() {
        const scheduleForm = document.getElementById('scheduleDoctorForm');
        if (!scheduleForm) {
            console.error('Schedule form not found! Looking for #scheduleDoctorForm');
            // Try again in 2 seconds
            setTimeout(() => {
                this.setupScheduleForm();
            }, 2000);
            return;
        }
        
        console.log('Schedule form found, setting up auto-save...');
        
        // Test if form elements exist
        const doctorNameField = document.getElementById('scheduleDoctorName');
        const dateField = document.getElementById('scheduleDate');
        console.log('Form elements check:', {
            doctorName: !!doctorNameField,
            date: !!dateField,
            startTime: !!document.getElementById('scheduleStartTime'),
            endTime: !!document.getElementById('scheduleEndTime'),
            location: !!document.getElementById('scheduleLocation'),
            notes: !!document.getElementById('scheduleNotes')
        });

        // Handle form submission
        scheduleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('=== FORM SUBMIT EVENT TRIGGERED ===');
            console.log('Form element:', scheduleForm);
            console.log('Form data before save:', {
                doctorName: document.getElementById('scheduleDoctorName')?.value,
                date: document.getElementById('scheduleDate')?.value,
                startTime: document.getElementById('scheduleStartTime')?.value,
                endTime: document.getElementById('scheduleEndTime')?.value,
                location: document.getElementById('scheduleLocation')?.value,
                notes: document.getElementById('scheduleNotes')?.value
            });
            this.saveSchedule();
        });

        // Also add click event to submit button as fallback
        const submitButton = scheduleForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('=== SUBMIT BUTTON CLICKED ===');
                this.saveSchedule();
            });
        }
        
        // Also listen for when the modal opens
        const modal = document.getElementById('scheduleDoctorModalOverlay');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (modal.classList.contains('active')) {
                    console.log('Schedule modal opened, ensuring form is ready');
                    this.setupScheduleForm();
                }
            });
        }

        // Add auto-save on input change for key fields
        const keyFields = ['scheduleDoctorName', 'scheduleDate', 'scheduleStartTime'];
        keyFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    this.scheduleAutoSave();
                });
            }
        });
    }

    async saveSchedule() {
        console.log('=== saveSchedule() METHOD CALLED ===');
        const form = document.getElementById('scheduleDoctorForm');
        if (!form) {
            console.error('Form not found in saveSchedule()');
            return;
        }
        console.log('Form found:', form);

        // Get form data
        const formData = {
            title: document.getElementById('scheduleDoctorName')?.value || '',
            description: `Doctor schedule for ${document.getElementById('scheduleDoctorName')?.value || 'Unknown Doctor'}`,
            start_date: document.getElementById('scheduleDate')?.value || '',
            start_time: document.getElementById('scheduleStartTime')?.value || '',
            end_time: document.getElementById('scheduleEndTime')?.value || '',
            event_type: 'appointment',
            status: 'scheduled',
            doctor_name: document.getElementById('scheduleDoctorName')?.value || '',
            patient_name: '',
            location: document.getElementById('scheduleLocation')?.value || '',
            notes: document.getElementById('scheduleNotes')?.value || '',
            created_by: 'admin'
        };

        // Debug: Log form data
        console.log('Form data collected:', formData);
        
        // Validate required fields
        if (!formData.title || !formData.start_date) {
            console.error('Validation failed:', {title: formData.title, start_date: formData.start_date});
            this.showMessage('❌ Please fill in Doctor Name and Date', 'error');
            return;
        }

        try {
            console.log('=== SENDING API REQUEST ===');
            console.log('URL:', `${this.baseUrl}save-schedule.php`);
            console.log('Request body:', JSON.stringify(formData, null, 2));
            
            const response = await fetch(`${this.baseUrl}save-schedule.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log('Response received:', response.status);
            const result = await response.json();
            console.log('Response data:', result);
            
			if (result.success) {
				this.showMessage('✅ Schedule successfully added!', 'success');
				this.showToast('Saved');
                // Clear form
                form.reset();
                // Close modal after a short delay
                setTimeout(() => {
                    this.closeScheduleModal();
                }, 1500);
                // Reload schedules
                this.loadExistingSchedules();
            } else {
                this.showMessage('❌ Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showMessage('❌ Network error: ' + error.message, 'error');
        }
    }

    scheduleAutoSave() {
        // Auto-save when key fields are filled
        const doctorName = document.getElementById('scheduleDoctorName')?.value;
        const date = document.getElementById('scheduleDate')?.value;
        const startTime = document.getElementById('scheduleStartTime')?.value;

        if (doctorName && date && startTime) {
            // Auto-save after a short delay
            setTimeout(() => {
                this.saveSchedule();
            }, 1000);
        }
    }

    async loadExistingSchedules() {
        try {
            const currentDate = new Date();
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

            const response = await fetch(`${this.baseUrl}get-schedules.php?start_date=${startDate}&end_date=${endDate}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                this.updateCalendarDisplay(result.data);
            }
        } catch (error) {
            console.error('Error loading schedules:', error);
        }
    }

    setupRealtimeRefresh() {
        // Poll periodically (10s) similar to inventory real-time refresh
        try {
            if (this._refreshTimer) clearInterval(this._refreshTimer);
            this._refreshTimer = setInterval(() => this.loadExistingSchedules(), 10000);
        } catch (_) {}

        // Refresh when window gains focus or tab becomes visible
        window.addEventListener('focus', () => this.loadExistingSchedules());
        document.addEventListener('visibilitychange', () => { if (!document.hidden) this.loadExistingSchedules(); });
        window.addEventListener('online', () => this.loadExistingSchedules());
    }

    updateCalendarDisplay(schedules) {
        // Update the calendar display with the loaded schedules
        console.log('Loaded schedules:', schedules);
        
        // Update the calendar iframe or display
        const calendarIframe = document.getElementById('doctorDashboardIframe');
        if (calendarIframe) {
            // Send schedules to the iframe
            calendarIframe.contentWindow.postMessage({
                type: 'UPDATE_SCHEDULES',
                schedules: schedules
            }, '*');
        }
        
        // Also update any visible schedule lists
        this.updateScheduleList(schedules);
    }

    updateScheduleList(schedules) {
        // Update any schedule list displays on the page
        const scheduleContainer = document.querySelector('.schedule-list, .calendar-events');
        if (scheduleContainer && schedules.length > 0) {
            scheduleContainer.innerHTML = schedules.map(schedule => `
                <div class="schedule-item" data-schedule-id="${schedule.id}">
                    <strong>${schedule.title}</strong><br>
                    <small>${schedule.start_date} at ${schedule.start_time}</small><br>
                    <small>Location: ${schedule.location || 'TBD'}</small>
                </div>
            `).join('');
        }
    }

    closeScheduleModal() {
        const modal = document.getElementById('scheduleDoctorModalOverlay');
        const closeBtn = document.getElementById('closeScheduleDoctorModalBtn');
        
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        if (closeBtn) {
            closeBtn.click();
        }
    }

    showSaveIndicator(message, status) {
        // Remove existing indicators
        const existingIndicator = document.querySelector('.schedule-save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'schedule-save-indicator';
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

    showMessage(message, type) {
        const messageDiv = document.getElementById('scheduleMessage');
        if (!messageDiv) {
            console.error('Message div not found');
            return;
        }

        // Clear previous message
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';

        // Set message content and styling
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';

        if (type === 'success') {
            messageDiv.style.backgroundColor = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

	// Lightweight toast similar to inventory "Saved" notification
	showToast(message) {
		try {
			const toast = document.createElement('div');
			toast.style.position = 'fixed';
			toast.style.top = '16px';
			toast.style.right = '16px';
			toast.style.background = 'rgba(33, 150, 83, 0.95)';
			toast.style.color = '#fff';
			toast.style.padding = '10px 14px';
			toast.style.borderRadius = '8px';
			toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
			toast.style.fontFamily = "Segoe UI, Tahoma, Geneva, Verdana, sans-serif";
			toast.style.fontSize = '14px';
			toast.style.zIndex = '9999';
			toast.textContent = message || 'Saved';
			document.body.appendChild(toast);
			setTimeout(() => { try { toast.remove(); } catch (_) {} }, 2000);
		} catch (_) {
			console.log(message || 'Saved');
		}
	}
}

// Initialize auto-save when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AdminScheduleAutoSave...');
    window.adminSchedule = new AdminScheduleAutoSave();
});
