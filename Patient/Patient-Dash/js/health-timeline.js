// Health Timeline Management
console.log('🚀 Health Timeline script loaded!');
// In-memory index of timeline entries by id for detail view
window.__timelineEntriesById = window.__timelineEntriesById || {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Starting health timeline...');
    console.log('🔍 Health timeline script loaded successfully');
    setTimeout(() => {
        console.log('⏰ Timeout completed, calling loadHealthTimeline');
        loadHealthTimeline();
        
        // Start auto-refresh for real-time updates
        console.log('🔄 Starting auto-refresh for real-time updates...');
        window.startHealthTimelineAutoRefresh(30); // Refresh every 30 seconds
    }, 1000); // Delay to ensure other scripts have loaded
});

async function loadHealthTimeline() {
    try {
        console.log('🔍 Loading health timeline...');
        
        // Get patient email from localStorage, sessionStorage, or fallback
        let patientEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        
        // Fallback: try to get from URL params
        if (!patientEmail) {
            const urlParams = new URLSearchParams(window.location.search);
            patientEmail = urlParams.get('email');
        }
        
        // Last resort: hardcode Nathaniel's email for testing
        if (!patientEmail) {
            patientEmail = 'nathanielbautista0302@gmail.com';
            console.log('📧 Using hardcoded email for testing:', patientEmail);
        }
        
        console.log('📧 Patient email:', patientEmail);
        
        if (!patientEmail) {
            console.error('❌ Patient email not found for health timeline');
            return;
        }

        // Get patient ID from patient_details table
        const patientId = await getPatientIdFromEmail(patientEmail);
        console.log('🆔 Patient ID:', patientId);
        
        if (!patientId) {
            console.error('❌ Patient ID not found for email:', patientEmail);
            return;
        }

        // Fetch health timeline data
        const apiUrl = `Back-end/get-health-timeline.php?patient_id=${encodeURIComponent(patientId)}`;
        console.log('🌐 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        
        console.log('📊 API Response:', data);

        if (data.success && data.data.length > 0) {
            console.log('✅ Found', data.data.length, 'health timeline entries');
            console.log('📋 First few entries:', data.data.slice(0, 3));
            // Index entries by id for modal view
            window.__timelineEntriesById = {};
            data.data.forEach((e) => { if (e && e.id != null) { window.__timelineEntriesById[String(e.id)] = e; } });
            
            // Show only the 2 latest entries on home page
            const latestEntries = data.data.slice(0, 2);
            console.log('🏠 Latest entries for home page:', latestEntries);
            updateHealthTimelineDisplay(latestEntries);
            updateMedicalHistoryDisplay(data.data);
        } else {
            console.log('ℹ️ No health timeline data found');
            console.log('📊 Data object:', data);
            showNoHealthTimelineMessage();
        }

    } catch (error) {
        console.error('❌ Error loading health timeline:', error);
    }
}

async function getPatientIdFromEmail(email) {
    try {
        const response = await fetch(`Back-end/patient-details-get.php?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.ok && data.data && data.data.patient_id) {
            return data.data.patient_id;
        }
        return null;
    } catch (error) {
        console.error('Error getting patient ID:', error);
        return null;
    }
}

function updateHealthTimelineDisplay(timelineEntries) {
    console.log('🎨 Updating health timeline display with', timelineEntries.length, 'entries');
    console.log('📋 Timeline entries:', timelineEntries);
    
    const healthTimelineContainer = document.getElementById('healthTimelineContainer');
    const noHealthTimelineMessage = document.getElementById('noHealthTimelineMessage');
    
    console.log('🔍 Health timeline container:', healthTimelineContainer);
    console.log('🔍 No health timeline message:', noHealthTimelineMessage);
    
    if (!healthTimelineContainer) {
        console.error('❌ Health timeline container not found');
        return;
    }

    console.log('✅ Found health timeline container');

    // Clear existing content
    healthTimelineContainer.innerHTML = '';

    if (timelineEntries.length === 0) {
        // Show no entries message
        if (noHealthTimelineMessage) {
            noHealthTimelineMessage.style.display = 'block';
            healthTimelineContainer.appendChild(noHealthTimelineMessage);
        }
    } else {
        // Hide no entries message
        if (noHealthTimelineMessage) {
            noHealthTimelineMessage.style.display = 'none';
        }
        
        // Add dynamic entries
        timelineEntries.forEach((entry, index) => {
            console.log(`📝 Creating entry ${index + 1}:`, entry);
            const entryElement = createHealthTimelineEntry(entry, index);
            console.log('📝 Created entry element:', entryElement);
            healthTimelineContainer.appendChild(entryElement);
            console.log('📝 Appended entry element');
        });
    }
    
    console.log('✅ Health timeline display updated');
    console.log('📄 Final container HTML:', healthTimelineContainer.innerHTML.substring(0, 200) + '...');
}

function createHealthTimelineEntry(entry, index) {
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo'];
    const color = colors[index % colors.length];
    
    const date = entry.entry_date || entry.checkup_date || entry.created_at;
    const formattedDate = formatDate(date);
    
    const entryDiv = document.createElement('div');
    entryDiv.className = `relative pl-8 pb-6 border-l-2 border-${color}-300`;
    
    entryDiv.innerHTML = `
        <div class="absolute -left-2 top-0 h-4 w-4 rounded-full bg-${color}-500"></div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="flex items-center mb-1">
                <span class="font-semibold text-gray-900">${entry.type_of_checkup || 'Check-up'}</span>
                <span class="ml-auto text-sm text-gray-500">${formattedDate}</span>
            </div>
        </div>
    `;
    
    return entryDiv;
}

function updateMedicalHistoryDisplay(timelineEntries) {
    console.log('🏥 Updating medical history display with', timelineEntries.length, 'entries');
    console.log('📋 All timeline entries for medical history:', timelineEntries);
    
    const medicalHistoryList = document.getElementById('medicalHistoryList');
    const noMedicalHistoryMessage = document.getElementById('noMedicalHistoryMessage');
    
    console.log('🔍 Medical history list element:', medicalHistoryList);
    console.log('🔍 No medical history message element:', noMedicalHistoryMessage);
    
    if (!medicalHistoryList) {
        console.error('❌ Medical history list not found');
        return;
    }

    console.log('✅ Found medical history list');

    // Clear existing content
    medicalHistoryList.innerHTML = '';

    if (timelineEntries.length === 0) {
        // Show no entries message
        if (noMedicalHistoryMessage) {
            noMedicalHistoryMessage.style.display = 'block';
            medicalHistoryList.appendChild(noMedicalHistoryMessage);
        }
    } else {
        // Hide no entries message
        if (noMedicalHistoryMessage) {
            noMedicalHistoryMessage.style.display = 'none';
        }
        
        // Add ALL dynamic entries (not just the first 2)
        timelineEntries.forEach((entry, index) => {
            console.log(`📝 Creating medical history entry ${index + 1}:`, entry);
            const entryElement = createMedicalHistoryEntry(entry);
            console.log('📝 Created medical history entry element:', entryElement);
            medicalHistoryList.appendChild(entryElement);
            console.log('📝 Appended medical history entry element');
        });
        
        // Ensure entries are in the correct order by sorting them
        const entries = Array.from(medicalHistoryList.children);
        console.log('🔄 Sorting entries by updated_at timestamp...');
        
        entries.sort((a, b) => {
            const aUpdated = a.getAttribute('data-updated-at');
            const bUpdated = b.getAttribute('data-updated-at');
            console.log(`📊 Comparing: ID ${a.getAttribute('data-id')} (${aUpdated}) vs ID ${b.getAttribute('data-id')} (${bUpdated})`);
            
            if (!aUpdated || !bUpdated) {
                console.log('⚠️ Missing timestamp data, using fallback sorting');
                return 0;
            }
            
            const aDate = new Date(aUpdated);
            const bDate = new Date(bUpdated);
            const result = bDate - aDate; // Sort by updated_at DESC
            console.log(`📊 Sort result: ${result}`);
            return result;
        });
        
        // Clear the container and re-append sorted entries
        medicalHistoryList.innerHTML = '';
        entries.forEach((entry, index) => {
            console.log(`📝 Re-adding entry ${index + 1}: ID ${entry.getAttribute('data-id')}, Updated: ${entry.getAttribute('data-updated-at')}`);
            medicalHistoryList.appendChild(entry);
        });
        
        console.log('🔄 Entries sorted by updated_at timestamp');
    }
    
    console.log('✅ Medical history display updated');
    console.log('📄 Final medical history list HTML length:', medicalHistoryList.innerHTML.length);
    console.log('📄 Final medical history list HTML preview:', medicalHistoryList.innerHTML.substring(0, 300) + '...');
}

function createMedicalHistoryEntry(entry) {
    const date = entry.entry_date || entry.checkup_date || entry.created_at;
    const formattedDate = formatDate(date);
    
    const entryLi = document.createElement('li');
    entryLi.className = 'medical-history-item';
    entryLi.setAttribute('data-date', formattedDate);
    entryLi.setAttribute('data-type', entry.type_of_checkup);
    entryLi.setAttribute('data-details', entry.description);
    entryLi.setAttribute('data-doctor', entry.doctor_name || 'N/A');
    entryLi.setAttribute('data-id', entry.id);
    entryLi.setAttribute('data-updated-at', entry.updated_at);
    entryLi.setAttribute('data-entry-date', entry.entry_date);
    
    entryLi.innerHTML = `
        <i class="fas fa-file-medical medical-history-icon text-blue-500"></i>
        <div class="medical-history-details">
            <p><strong>${entry.type_of_checkup || 'Check-up'}</strong></p>
            <p class="medical-history-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</p>
        </div>
        <div class="medical-history-actions">
            <button class="btn-view-file flex items-center justify-center" onclick="viewHealthTimelineEntry('${entry.id}')"><i class="fas fa-eye mr-2"></i><span>View Details</span></button>
        </div>
    `;
    
    return entryLi;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function showNoHealthTimelineMessage() {
    console.log('📭 Showing no health timeline message');
    
    const healthTimelineContainer = document.getElementById('healthTimelineContainer');
    const noHealthTimelineMessage = document.getElementById('noHealthTimelineMessage');
    
    if (healthTimelineContainer) {
        healthTimelineContainer.innerHTML = '';
        if (noHealthTimelineMessage) {
            noHealthTimelineMessage.style.display = 'block';
            healthTimelineContainer.appendChild(noHealthTimelineMessage);
        }
    }
}

function viewHealthTimelineEntry(entryId) {
    const key = String(entryId);
    const entry = window.__timelineEntriesById && window.__timelineEntriesById[key];
    if (!entry) { console.warn('Entry not found for id', entryId); return; }
    const modal = document.getElementById('medicalHistoryDetailsModal');
    const closeBtn = document.getElementById('closeMedicalHistoryModalBtn');
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || 'N/A'; };
    const date = entry.entry_date || entry.checkup_date || entry.created_at;
    setText('modalRecordDate', formatDate(date));
    setText('modalRecordType', entry.type_of_checkup || 'Check-up');
    setText('modalRecordDetails', entry.description || '');
    setText('modalRecordDoctor', entry.doctor_name || '');
    if (modal) { modal.classList.add('active'); }
    if (modal && closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    }
}

// Function to refresh health timeline (can be called from other scripts)
window.refreshHealthTimeline = loadHealthTimeline;

// Force refresh function for real-time updates
window.forceRefreshHealthTimeline = async function() {
    console.log('🔄 Force refreshing health timeline...');
    try {
        // Clear any cached data
        window.__timelineEntriesById = {};
        
        // Get fresh data
        await loadHealthTimeline();
        
        console.log('✅ Health timeline force refresh completed');
    } catch (error) {
        console.error('❌ Error during force refresh:', error);
    }
};

// Function to manually reorder entries by updated_at
window.reorderHealthTimelineEntries = function() {
    console.log('🔄 Manually reordering health timeline entries...');
    
    const medicalHistoryList = document.getElementById('medicalHistoryList');
    if (!medicalHistoryList) {
        console.error('❌ Medical history list not found');
        return;
    }
    
    const entries = Array.from(medicalHistoryList.children);
    console.log('📊 Found', entries.length, 'entries to reorder');
    
    // Sort by updated_at timestamp (most recent first)
    entries.sort((a, b) => {
        const aUpdated = a.getAttribute('data-updated-at');
        const bUpdated = b.getAttribute('data-updated-at');
        console.log(`📊 Comparing: ID ${a.getAttribute('data-id')} (${aUpdated}) vs ID ${b.getAttribute('data-id')} (${bUpdated})`);
        
        if (!aUpdated || !bUpdated) {
            console.log('⚠️ Missing timestamp data');
            return 0;
        }
        
        const result = new Date(bUpdated) - new Date(aUpdated);
        console.log(`📊 Sort result: ${result}`);
        return result;
    });
    
    // Clear and re-append sorted entries
    medicalHistoryList.innerHTML = '';
    entries.forEach((entry, index) => {
        console.log(`📝 Re-adding entry ${index + 1}: ID ${entry.getAttribute('data-id')}, Updated: ${entry.getAttribute('data-updated-at')}`);
        medicalHistoryList.appendChild(entry);
    });
    
    console.log('✅ Health timeline entries reordered successfully');
};

// Auto-refresh function for real-time updates
window.startHealthTimelineAutoRefresh = function(intervalSeconds = 30) {
    console.log(`🔄 Starting auto-refresh every ${intervalSeconds} seconds...`);
    
    // Clear any existing interval
    if (window.healthTimelineRefreshInterval) {
        clearInterval(window.healthTimelineRefreshInterval);
    }
    
    window.healthTimelineRefreshInterval = setInterval(async () => {
        console.log('🔄 Auto-refresh: Checking for new health timeline entries...');
        try {
            await loadHealthTimeline();
            console.log('✅ Auto-refresh: Health timeline updated');
        } catch (error) {
            console.error('❌ Auto-refresh error:', error);
        }
    }, intervalSeconds * 1000);
    
    console.log('✅ Auto-refresh started');
};

// Stop auto-refresh function
window.stopHealthTimelineAutoRefresh = function() {
    if (window.healthTimelineRefreshInterval) {
        clearInterval(window.healthTimelineRefreshInterval);
        window.healthTimelineRefreshInterval = null;
        console.log('🛑 Auto-refresh stopped');
    }
};

// Test function to verify script is working
window.testHealthTimeline = function() {
    console.log('🧪 Testing health timeline...');
    console.log('📧 localStorage userEmail:', localStorage.getItem('userEmail'));
    console.log('📧 sessionStorage userEmail:', sessionStorage.getItem('userEmail'));
    
    // Check if containers exist
    const healthContainer = document.getElementById('healthTimelineContainer');
    const medicalContainer = document.getElementById('medicalHistoryList');
    
    console.log('🏥 Health timeline container found:', !!healthContainer);
    console.log('📋 Medical history container found:', !!medicalContainer);
    
    if (healthContainer) {
        console.log('🏥 Health container content:', healthContainer.innerHTML.substring(0, 200) + '...');
    }
    
    if (medicalContainer) {
        console.log('📋 Medical container content:', medicalContainer.innerHTML.substring(0, 200) + '...');
    }
    
    // Try to load health timeline
    loadHealthTimeline();
    
    return {
        healthContainer: !!healthContainer,
        medicalContainer: !!medicalContainer,
        userEmail: localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail')
    };
};

// Function to check current health timeline state
window.checkHealthTimelineState = function() {
    console.log('🔍 Checking health timeline state...');
    
    const healthContainer = document.getElementById('healthTimelineContainer');
    const medicalContainer = document.getElementById('medicalHistoryList');
    
    console.log('📊 Health timeline container:', healthContainer);
    console.log('📊 Medical history container:', medicalContainer);
    
    if (healthContainer) {
        console.log('📊 Health timeline entries count:', healthContainer.children.length);
        console.log('📊 Health timeline HTML:', healthContainer.innerHTML);
    }
    
    if (medicalContainer) {
        console.log('📊 Medical history entries count:', medicalContainer.children.length);
        console.log('📊 Medical history HTML:', medicalContainer.innerHTML);
        
        // Check if entries are visible
        const entries = medicalContainer.querySelectorAll('.medical-history-item');
        console.log('📊 Medical history visible entries:', entries.length);
        entries.forEach((entry, index) => {
            console.log(`📊 Entry ${index + 1}:`, entry.textContent.trim());
        });
    }
    
    // Check cached entries
    console.log('📊 Cached timeline entries:', Object.keys(window.__timelineEntriesById || {}));
    
    return {
        healthEntries: healthContainer ? healthContainer.children.length : 0,
        medicalEntries: medicalContainer ? medicalContainer.children.length : 0,
        cachedEntries: Object.keys(window.__timelineEntriesById || {}).length
    };
};

// Function to force display medical history entries
window.forceDisplayMedicalHistory = function() {
    console.log('🔧 Force displaying medical history entries...');
    
    const medicalContainer = document.getElementById('medicalHistoryList');
    if (!medicalContainer) {
        console.error('❌ Medical history container not found');
        return;
    }
    
    // Check if we have cached data
    const cachedEntries = Object.values(window.__timelineEntriesById || {});
    console.log('📊 Cached entries available:', cachedEntries.length);
    
    if (cachedEntries.length > 0) {
        console.log('📊 Using cached entries to populate medical history');
        updateMedicalHistoryDisplay(cachedEntries);
    } else {
        console.log('📊 No cached entries, reloading from API');
        loadHealthTimeline();
    }
};
