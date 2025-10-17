// Admin Dashboard Auto-Save Functionality
class AdminAutoSave {
    constructor() {
        this.saveTimeout = null;
        this.saveDelay = 2000; // 2 seconds delay after user stops typing
        this.baseUrl = 'back-end/api/';
        this.init();
    }

    init() {
        this.setupEditableElements();
        this.loadExistingContent();
    }

    setupEditableElements() {
        // Find all elements with data-editable attribute
        const editableElements = document.querySelectorAll('[data-editable]');
        
        editableElements.forEach(element => {
            // Make element contenteditable
            element.setAttribute('contenteditable', 'true');
            
            // Add visual indicator
            element.style.border = '1px dashed transparent';
            element.style.padding = '4px';
            element.style.borderRadius = '4px';
            element.style.transition = 'all 0.3s ease';
            
            // Add hover effect
            element.addEventListener('mouseenter', () => {
                if (!element.classList.contains('editing')) {
                    element.style.border = '1px dashed #2563eb';
                    element.style.backgroundColor = '#f8fafc';
                }
            });
            
            element.addEventListener('mouseleave', () => {
                if (!element.classList.contains('editing')) {
                    element.style.border = '1px dashed transparent';
                    element.style.backgroundColor = 'transparent';
                }
            });
            
            // Add focus/blur events
            element.addEventListener('focus', () => {
                element.classList.add('editing');
                element.style.border = '2px solid #2563eb';
                element.style.backgroundColor = '#eff6ff';
                element.style.outline = 'none';
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('editing');
                element.style.border = '1px dashed transparent';
                element.style.backgroundColor = 'transparent';
                this.saveContent(element);
            });
            
            // Add input event for auto-save
            element.addEventListener('input', () => {
                this.scheduleSave(element);
            });
        });
    }

    scheduleSave(element) {
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set new timeout
        this.saveTimeout = setTimeout(() => {
            this.saveContent(element);
        }, this.saveDelay);
    }

    async saveContent(element) {
        const sectionName = element.dataset.section || 'dashboard';
        const contentKey = element.dataset.key || element.id || 'content';
        const contentValue = element.innerHTML;
        const contentType = element.dataset.type || 'html';

        try {
            const response = await fetch(`${this.baseUrl}save-content.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    section_name: sectionName,
                    content_key: contentKey,
                    content_value: contentValue,
                    content_type: contentType
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSaveIndicator(element, 'saved');
            } else {
                console.error('Save failed:', result.message);
                this.showSaveIndicator(element, 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showSaveIndicator(element, 'error');
        }
    }

    async loadExistingContent() {
        try {
            const response = await fetch(`${this.baseUrl}load-content.php?section_name=dashboard`);
            const result = await response.json();
            
            if (result.success && result.data) {
                result.data.forEach(item => {
                    const element = document.querySelector(`[data-key="${item.content_key}"]`) || 
                                   document.getElementById(item.content_key);
                    
                    if (element && item.content_value) {
                        element.innerHTML = item.content_value;
                    }
                });
            }
        } catch (error) {
            console.error('Load content error:', error);
        }
    }

    showSaveIndicator(element, status) {
        // Remove existing indicators
        const existingIndicator = element.parentNode.querySelector('.save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: -25px;
            right: 5px;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
        `;

        if (status === 'saved') {
            indicator.textContent = '✓ Saved';
            indicator.style.backgroundColor = '#10b981';
            indicator.style.color = 'white';
        } else if (status === 'error') {
            indicator.textContent = '✗ Error';
            indicator.style.backgroundColor = '#ef4444';
            indicator.style.color = 'white';
        }

        // Position element relatively if not already
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        element.parentNode.appendChild(indicator);

        // Remove indicator after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    }
}

// Initialize auto-save when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminAutoSave();
});
