// Follow-ups: patient can only view doctor-set follow-ups; no creation here

(function(){
    const upcomingList = document.getElementById('upcomingAppointmentsList');
    const noUpcomingMsg = document.getElementById('noUpcomingAppointmentsMessage');

    function getEmail() {
        // Get email from localStorage first, then sessionStorage, then URL params, then hardcoded fallback
        let email = (localStorage.getItem('userEmail') || '').trim();
        if (!email) {
            email = (sessionStorage.getItem('userEmail') || '').trim();
        }
        if (!email) {
            const urlParams = new URLSearchParams(window.location.search);
            email = urlParams.get('email') || '';
        }
        if (!email) {
            email = 'nathanielbautista0302@gmail.com';
            console.log('📧 Using hardcoded email for testing:', email);
        }
        return email;
    }

    async function fetchJSON(url, opts) {
        const res = await fetch(url, opts);
        let payload;
        try { payload = await res.json(); } catch(_) { payload = { ok:false, error: 'Invalid JSON' }; }
        if (!res.ok || !payload.ok) throw new Error(payload.error || 'Request failed');
        return payload;
    }

    function renderUpcoming(items) {
        if (!upcomingList) return;
        upcomingList.innerHTML = '';
        if (!items || items.length === 0) {
            if (noUpcomingMsg) noUpcomingMsg.style.display = 'block';
            return;
        }
        if (noUpcomingMsg) noUpcomingMsg.style.display = 'none';
        items.forEach(it => {
            const li = document.createElement('li');
            li.className = 'flex items-start p-3 rounded-lg bg-white shadow-sm';
            const icon = document.createElement('div');
            icon.className = 'flex-shrink-0 mt-1';
            icon.innerHTML = '<i class="fas fa-user-md text-blue-500"></i>';
            const content = document.createElement('div');
            content.className = 'ml-3 flex-1 flex justify-between items-center';
            const doctorName = it.doctor_name || it.doctorName || 'Doctor';
            const dateStr = it.follow_up_date || it.date || '';
            content.innerHTML = `<span class="font-medium text-gray-900">${doctorName}</span>
                <span class="text-sm text-gray-500"><i class=\"far fa-calendar-alt mr-1\"></i> ${dateStr}</span>`;
            li.appendChild(icon);
            li.appendChild(content);
            upcomingList.appendChild(li);
        });
    }

    // New function to render check-ups in the Check-Ups section with Medical History format
    function renderCheckUps(items) {
        const checkUpsList = document.getElementById('checkUpsList');
        const noCheckUpsMessage = document.getElementById('noCheckUpsMessage');
        
        if (!checkUpsList) return;
        checkUpsList.innerHTML = '';
        
        if (!items || items.length === 0) {
            if (noCheckUpsMessage) {
                noCheckUpsMessage.style.display = 'block';
                checkUpsList.appendChild(noCheckUpsMessage);
            }
            return;
        }
        
        if (noCheckUpsMessage) noCheckUpsMessage.style.display = 'none';
        
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'medical-history-item';
            
            const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo'];
            const color = colors[index % colors.length];
            
            const doctorName = item.doctor_name || item.doctorName || 'Doctor';
            const dateStr = item.follow_up_date || item.date || '';
            const timeStr = item.time || '';
            const notes = item.notes || '';
            // Determine check-up type from notes or use default
            let checkupType = 'Check-Up';
            if (notes.toLowerCase().includes('consultation')) {
                checkupType = 'Consultation';
            } else if (notes.toLowerCase().includes('follow-up')) {
                checkupType = 'Follow-Up';
            } else if (notes.toLowerCase().includes('review')) {
                checkupType = 'Review';
            } else if (notes.toLowerCase().includes('emergency')) {
                checkupType = 'Emergency';
            } else if (notes.toLowerCase().includes('routine')) {
                checkupType = 'Routine Check-Up';
            }
            
            li.innerHTML = `
                <div class="medical-history-icon">
                    <i class="fas fa-user-md text-${color}-500"></i>
                </div>
                <div class="medical-history-details">
                    <strong class="text-${color}-600">${checkupType}</strong>
                    <div class="medical-history-date">
                        <i class="far fa-calendar-alt mr-1"></i> ${dateStr}
                    </div>
                </div>
                <div class="medical-history-actions">
                    <button class="btn-view-file" onclick="console.log('Button clicked'); showCheckUpDetails('${checkupType}', '${dateStr}', '${timeStr}', '${doctorName}', '${notes.replace(/'/g, "\\'")}')">
                        <i class="fas fa-eye mr-1"></i>View Details
                    </button>
                </div>
            `;
            
            checkUpsList.appendChild(li);
        });
    }

    async function loadFollowUps() {
        const email = getEmail();
        console.log('🔍 Loading follow-ups for email:', email);
        if (!email) {
            console.error('❌ No email found for follow-ups');
            return;
        }
        try {
            const url = 'Back-end/list-follow-ups.php?email=' + encodeURIComponent(email);
            console.log('🌐 Fetching from URL:', url);
            const payload = await fetchJSON(url);
            const allFollowUps = payload.data || [];
            console.log('📊 Follow-ups data received:', allFollowUps);
            
            // Show only the 2 latest upcoming check-ups on home page
            const latestFollowUps = allFollowUps.slice(0, 2);
            console.log('📅 Latest follow-ups for home page:', latestFollowUps);
            renderUpcoming(latestFollowUps);
            
            // Show all check-ups in the Check-Ups section
            renderCheckUps(allFollowUps);
        } catch(e) {
            console.error('❌ Error loading follow-ups:', e);
            renderUpcoming([]);
            renderCheckUps([]);
        }
    }

    // Function to show check-up details modal
    window.showCheckUpDetails = function(type, date, time, doctor, notes) {
        console.log('showCheckUpDetails called with:', { type, date, time, doctor, notes });
        const modal = document.getElementById('checkUpDetailsModal');
        const closeBtn = document.getElementById('closeCheckUpModalBtn');
        
        if (!modal) {
            console.error('Modal not found: checkUpDetailsModal');
            return;
        }
        if (!closeBtn) {
            console.error('Close button not found: closeCheckUpModalBtn');
            return;
        }
        
        // Populate modal with data
        document.getElementById('modalCheckUpType').textContent = type;
        document.getElementById('modalCheckUpDate').textContent = date;
        document.getElementById('modalCheckUpDoctor').textContent = doctor;
        document.getElementById('modalCheckUpNotes').textContent = notes || 'No additional notes';
        
        // Show modal
        modal.classList.add('active');
        
        // Close modal when clicking close button
        closeBtn.onclick = function() {
            modal.classList.remove('active');
        };
        
        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        };
    };

    document.addEventListener('DOMContentLoaded', () => {
        loadFollowUps();
    });
})();


