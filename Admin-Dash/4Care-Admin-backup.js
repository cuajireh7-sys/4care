// MultipleFiles/4Care-Admin.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Logout System ---
    const logoutButton = document.getElementById('logoutButton');
    const logoutModalOverlay = document.getElementById('logoutModalOverlay');
    const closeLogoutModalBtn = document.getElementById('closeLogoutModalBtn');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    // Show logout confirmation modal when logout button is clicked
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close logout modal function
    function closeLogoutModal() {
        logoutModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close modal event listeners
    if (closeLogoutModalBtn) closeLogoutModalBtn.addEventListener('click', closeLogoutModal);
    if (cancelLogout) cancelLogout.addEventListener('click', closeLogoutModal);

    // Confirm logout action
    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            // Redirect to staff login page after logout
            console.log('Admin logged out, redirecting to staff login');
            window.location.href = '../Staff-Login/Staff-Login.html';
        });
    }

    // Close modal if clicked outside the modal content
    if (logoutModalOverlay) {
        logoutModalOverlay.addEventListener('click', (e) => {
            if (e.target === logoutModalOverlay) {
                closeLogoutModal();
            }
        });
    }



    // Initialize the Barangay Pie Chart (Top 5 barangays from DB)
        const barangayPieChartCtx = document.getElementById('barangayPieChart')?.getContext('2d');
        let barangayPieChart;

        let barangayPieRawLabels = [];

        async function loadTopBarangays() {
            if (!barangayPieChartCtx) return;
            try {
                const res = await fetch('Back-end/api/get-patient-barangay-counts.php');
                const json = await res.json();
                if (!json.success) throw new Error(json.message || 'Failed loading barangay counts');

                const labels = json.data.labels;
                barangayPieRawLabels = labels.slice();
                const displayLabels = labels.map(l => {
                    if (!l) return 'Barangay';
                    const lower = String(l).toLowerCase();
                    return lower.includes('barangay') ? String(l) : `Barangay ${l}`;
                });
                const counts = json.data.counts;

                if (barangayPieChart) barangayPieChart.destroy();

                barangayPieChart = new Chart(barangayPieChartCtx, {
                    type: 'pie',
                    data: {
                        labels: displayLabels,
                        datasets: [{
                            data: counts,
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(201, 203, 207, 0.8)',
                                'rgba(153, 102, 255, 0.8)'
                            ],
                            borderColor: 'rgba(255, 255, 255, 1)',
                            borderWidth: 2,
                            hoverOffset: 20,
                            hoverBorderColor: 'rgba(255, 255, 255, 1)',
                            borderRadius: 10
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: '#444', font: { size: 14, weight: '600' }, padding: 20, boxWidth: 18, boxHeight: 18 }
                            },
                            title: {
                                display: true,
                                text: 'Patients per Barangay (Top 5)',
                                color: '#222',
                                font: { size: 20, weight: '700' },
                                padding: { top: 10, bottom: 30 }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        const label = ctx.label || '';
                                        const labelWithPrefix = label.toLowerCase().includes('barangay') ? label : `Barangay ${label}`;
                                        return `${labelWithPrefix}: ${ctx.parsed} patients`;
                                    }
                                }
                            }
                        },
                        layout: { padding: { top: 20, bottom: 20, left: 20, right: 20 } },
                        onClick: async (event, elements) => {
                            if (elements.length === 0) return;
                            const index = elements[0].index;
                            const selectedBarangay = barangayPieRawLabels[index] ?? barangayPieChart.data.labels[index];
                            await openCheckupBreakdownModal(selectedBarangay);
                        }
                    }
                });
            } catch (err) {
                console.error('Failed to load barangay pie data', err);
            }
        }

        loadTopBarangays();

        // Modal functionality (repurposed for checkup types per barangay)
        const illnessDetailsModalOverlay = document.getElementById('illnessDetailsModalOverlay');
        const illnessDetailsModalTitle = document.getElementById('illnessDetailsModalTitle');
        const illnessDetailsList = document.getElementById('illnessDetailsList');
        const closeIllnessDetailsModalBtn = document.getElementById('closeIllnessDetailsModalBtn');
        const closeIllnessDetailsModalFooterBtn = document.getElementById('closeIllnessDetailsModalFooterBtn');

        async function openCheckupBreakdownModal(barangayName) {
            if (!illnessDetailsModalOverlay || !illnessDetailsModalTitle || !illnessDetailsList) return;
            const displayName = barangayName && barangayName.toLowerCase().includes('barangay') ? barangayName : `Barangay ${barangayName}`;
            illnessDetailsModalTitle.textContent = `Checkup reasons for ${displayName}`;
            illnessDetailsList.innerHTML = '';

            try {
                const res = await fetch(`Back-end/api/get-checkup-counts-by-barangay.php?barangay=${encodeURIComponent(barangayName)}`);
                const json = await res.json();
                if (!json.success) throw new Error(json.message || 'Failed to load checkup counts');

                if (json.data.labels.length === 0) {
                    const li = document.createElement('li');
                    li.textContent = 'No checkup records for this barangay yet.';
                    illnessDetailsList.appendChild(li);
                } else {
                    json.data.labels.forEach((label, i) => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${label}:</strong> <span>${json.data.counts[i]} patients</span>`;
                        illnessDetailsList.appendChild(li);
                    });
                }
            } catch (e) {
                const li = document.createElement('li');
                li.textContent = 'Unable to load data.';
                illnessDetailsList.appendChild(li);
                console.error(e);
            }

            illnessDetailsModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeIllnessDetailsModal() {
            if (illnessDetailsModalOverlay) illnessDetailsModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (closeIllnessDetailsModalBtn) closeIllnessDetailsModalBtn.addEventListener('click', closeIllnessDetailsModal);
        if (closeIllnessDetailsModalFooterBtn) closeIllnessDetailsModalFooterBtn.addEventListener('click', closeIllnessDetailsModal);
        if (illnessDetailsModalOverlay) {
            illnessDetailsModalOverlay.addEventListener('click', (e) => {
                if (e.target === illnessDetailsModalOverlay) {
                    closeIllnessDetailsModal();
                }
            });
        }

        // Initialize the Patient Satisfaction Wave Chart
        const patientSatisfactionWaveChartCtx = document.getElementById('patientSatisfactionWaveChart').getContext('2d');
        new Chart(patientSatisfactionWaveChartCtx, {
            type: 'line',
            data: {
                labels: ['Bad','Not Bad', 'Good', 'Very Good', 'Outstanding'],
                datasets: [{
                    label: 'Satisfaction Score',
                    data: [65, 59, 80, 81, 56, 55, 70], // Example data
                    fill: true,
                    backgroundColor: 'rgba(26, 115, 232, 0.2)', // Light primary color
                    borderColor: 'rgba(26, 115, 232, 1)', // Primary color
                    tension: 0.4, // Makes the line wavy
                    pointBackgroundColor: 'rgba(26, 115, 232, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(26, 115, 232, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false,
                        text: 'Patient Satisfaction Over Time'
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#333'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#333'
                        }
                    }
                }
            }
        });

    // --- Notification System ---
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationList = document.getElementById('notificationList');
    const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
    const viewAllNotificationsBtn = document.getElementById('viewAllNotificationsBtn');

    let notifications = [
        { id: 1, title: 'New Patient Appointment', time: '5 mins ago', read: false },
        { id: 2, title: 'Inventory Low Stock: Bandages', time: '1 hour ago', read: false },
        { id: 3, title: 'System Update Available', time: 'Yesterday', read: true }
    ];

    function updateNotificationBadge() {
        if (notificationBadge) {
            const unreadCount = notifications.filter(n => !n.read).length;
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    function renderNotifications() {
        if (!notificationList) return;
        notificationList.innerHTML = '';
        if (notifications.length === 0) {
            notificationList.innerHTML = '<li style="padding: 10px 15px; color: #777;">No new notifications.</li>';
        } else {
            notifications.forEach(notification => {
                const li = document.createElement('li');
                li.classList.add('notification-item');
                if (!notification.read) {
                    li.classList.add('unread');
                }
                li.dataset.id = notification.id;
                li.innerHTML = `
                    <div class="notification-item-title">${notification.title}</div>
                    <div class="notification-item-time">${notification.time}</div>
                `;
                li.addEventListener('click', () => {
                    markNotificationAsRead(notification.id);
                    // In a real app, you might navigate to a relevant page or show a detailed modal
                    alert(`Notification clicked: ${notification.title}`);
                });
                notificationList.appendChild(li);
            });
        }
        updateNotificationBadge();
    }

    function markNotificationAsRead(id) {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            renderNotifications();
        }
    }

    function addNotification(title, time) {
        const newId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
        notifications.unshift({ id: newId, title: title, time: time, read: false });
        renderNotifications();
    }

    if (notificationIcon) {
        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from closing immediately
            if (notificationDropdown) notificationDropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (notificationDropdown && !notificationDropdown.contains(e.target) && e.target !== notificationIcon) {
            notificationDropdown.classList.remove('active');
        }
    });

    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', () => {
            notifications = [];
            renderNotifications();
        });
    }

    if (viewAllNotificationsBtn) {
        viewAllNotificationsBtn.addEventListener('click', () => {
            alert('Navigating to All Notifications page/modal (functionality to be implemented).');
            if (notificationDropdown) notificationDropdown.classList.remove('active');
        });
    }

    // Initial render of notifications
    renderNotifications();

    // Simulate adding a new notification after a delay
    setTimeout(() => {
        addNotification('New Patient Registered: John Doe', 'Just now');
    }, 5000);
    setTimeout(() => {
        addNotification('Appointment Reminder: Dr. Smith at 10 AM', '2 mins ago');
    }, 10000);

    // Set logged in user name (static for this example)
    const loggedInUserNameSpan = document.getElementById('loggedInUserName');
    if (loggedInUserNameSpan) {
        loggedInUserNameSpan.textContent = 'Admin'; // Replace with dynamic user data if available
    }

    // --- User Identification Click to Admin Settings ---
    const userIdentification = document.querySelector('.user-identification');
    if (userIdentification) {
        userIdentification.addEventListener('click', () => {
            // Find the 'Admin Settings' navigation item and simulate a click
            const adminSettingsNavItem = document.querySelector('.nav-menu .nav-item[data-section="admin-settings"]');
            if (adminSettingsNavItem) {
                adminSettingsNavItem.click();
            }
        });
    }


    // --- Navigation and Content Switching ---
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const body = document.body;
    const sectionsToHideSidebar = ['appointments', 'appointments-patient', 'appointments-doctor', 'doctors', 'patients', 'inventory', 'activity-log', 'admin-settings', 'admin-editing', 'report-generation', 'ocr'];
    const calendarNavItem = document.getElementById('calendarNavItem');
    const calendarSubMenuParent = calendarNavItem ? calendarNavItem.closest('.nav-item-has-submenu') : null;

    // Handle navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.id === 'calendarNavItem') {
                e.preventDefault();
                navItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                if (calendarSubMenuParent) calendarSubMenuParent.classList.toggle('active');

                contentSections.forEach(section => {
                    section.classList.remove('active');
                });
                const dataSection = this.getAttribute('data-section');
                if (sectionsToHideSidebar.includes(dataSection)) {
                    body.classList.add('hide-right-sidebar');
                } else {
                    body.classList.remove('hide-right-sidebar');
                }
                return;
            } else {
                e.preventDefault();
                navItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');

                const sectionId = this.getAttribute('data-section') + '-section';
                const dataSection = this.getAttribute('data-section');

                contentSections.forEach(section => {
                    section.classList.remove('active');
                });

                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('active');
                }

                if (sectionsToHideSidebar.includes(dataSection)) {
                    body.classList.add('hide-right-sidebar');
                } else {
                    body.classList.remove('hide-right-sidebar');
                }

                if (dataSection === 'inventory') {
                    renderInventoryTable();
                }
                if (dataSection === 'doctors') {
                    renderDoctorCards(); // Ensure doctors are rendered when navigating to their section
                }
                if (dataSection === 'patients') {
                    renderPatientCards(); // Ensure patients are rendered when navigating to their section
                }
                if (dataSection === 'activity-log') {
                    renderActivityLog(); // Ensure activity log is rendered
                }
                if (dataSection === 'ocr') {
                    // Initialize OCR specific functionality if needed
                    console.log('OCR section activated');
                    console.log('OCR elements check:');
                    console.log('- ocrUploadBox:', document.getElementById('ocrUploadBox'));
                    console.log('- ocrFileInput:', document.getElementById('ocrFileInput'));
                    console.log('- ocrOpenCamera:', document.getElementById('ocrOpenCamera'));
                    console.log('- ocrCaptureBtn:', document.getElementById('ocrCaptureBtn'));
                    console.log('- ocrPerformOCR:', document.getElementById('ocrPerformOCR'));
                }
            }
        });
    });

    // By default, show dashboard and ensure sidebar is visible
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        dashboardSection.classList.add('active');
    }
    body.classList.remove('hide-right-sidebar');



    // --- Patient Visits Chart ---
    const ctx = document.getElementById('patientVisitsChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Number of Patients',
                    data: [65, 59, 80, 81, 56, 55, 40, 70, 75, 60, 85, 90],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Patients'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    }

    // --- Barangay Analytics Chart ---
    const barangaySelect = document.getElementById('barangaySelect');
    const barangayPatientVisitsChartCtx = document.getElementById('barangayPatientVisitsChart');
    let barangayChart;
    let barangayData = {};

    // Fetch barangay data from API
    async function fetchBarangayData(barangay = 'all', month = null) {
        try {
            const url = new URL('Back-end/api/get-barangay-stats.php', window.location.origin + window.location.pathname);
            if (barangay !== 'all') url.searchParams.append('barangay', barangay);
            if (month) url.searchParams.append('month', month);
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                console.error('Error fetching barangay data:', result.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching barangay data:', error);
            return null;
        }
    }

    function renderBarangayChart(barangayValue) {
        if (!barangayPatientVisitsChartCtx) return;

        if (barangayChart) {
            barangayChart.destroy();
        }

        // Get current month for initial data
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        fetchBarangayData(barangayValue, currentMonth).then(data => {
            if (!data) {
                console.error('No data received from API');
                // Show fallback chart with sample data
                renderFallbackChart(barangayValue);
                return;
            }
            
            console.log('Barangay data received:', data);
            console.log('Monthly data keys:', Object.keys(data.monthly_data || {}));
            console.log('Sample monthly data:', data.monthly_data);

            // Prepare monthly data for the last 12 months
            const months = [];
            const visitData = [];
            
            for (let i = 11; i >= 0; i--) {
                const targetMonth = new Date();
                targetMonth.setMonth(targetMonth.getMonth() - i);
                const monthKey = targetMonth.toISOString().slice(0, 7);
                const monthName = targetMonth.toLocaleDateString('en-US', { month: 'short' });
                
                months.push(monthName);
                
                if (data.monthly_data && data.monthly_data[monthKey]) {
                    if (barangayValue === 'all') {
                        // Sum all barangays for "all" option
                        const totalVisits = Object.values(data.monthly_data[monthKey]).reduce((sum, count) => sum + count, 0);
                        visitData.push(totalVisits);
                    } else {
                        // Get specific barangay data - try multiple formats
                        let visitCount = 0;
                        
                        // Try different barangay key formats
                        const possibleKeys = [
                            barangayValue, // Direct value (number)
                            `Barangay ${barangayValue}`, // "Barangay 1" format
                            `barangay ${barangayValue}`, // lowercase
                            `Barangay ${barangayValue.padStart(2, '0')}`, // "Barangay 01" format
                            `Barangay ${barangayValue}`, // "Barangay 1" format
                        ];
                        
                        for (const key of possibleKeys) {
                            if (data.monthly_data[monthKey][key]) {
                                visitCount = data.monthly_data[monthKey][key];
                                break;
                            }
                        }
                        
                        visitData.push(visitCount);
                    }
                } else {
                    visitData.push(0);
                }
            }

            const chartLabel = barangayValue === 'all' ? 'All Barangays' : `Barangay ${barangayValue}`;

            barangayChart = new Chart(barangayPatientVisitsChartCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: `Patient Visits - ${chartLabel}`,
                        data: visitData,
                        backgroundColor: 'rgba(52, 168, 83, 0.2)',
                        borderColor: 'rgba(52, 168, 83, 1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(52, 168, 83, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Patient Visits - ${chartLabel}`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            color: '#1a73e8'
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Visits',
                                font: {
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Month',
                                font: {
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        });
    }

    // Fallback chart function for when API fails
    function renderFallbackChart(barangayValue) {
        if (!barangayPatientVisitsChartCtx) return;

        if (barangayChart) {
            barangayChart.destroy();
        }

        // Generate sample data for the last 12 months
        const months = [];
        const visitData = [];
        
        for (let i = 11; i >= 0; i--) {
            const targetMonth = new Date();
            targetMonth.setMonth(targetMonth.getMonth() - i);
            const monthName = targetMonth.toLocaleDateString('en-US', { month: 'short' });
            months.push(monthName);
            
            // Generate random sample data
            const baseValue = barangayValue === 'all' ? 50 : 20;
            const randomValue = Math.floor(Math.random() * 30) + baseValue;
            visitData.push(randomValue);
        }

        const chartLabel = barangayValue === 'all' ? 'All Barangays (Sample Data)' : `Barangay ${barangayValue} (Sample Data)`;

        barangayChart = new Chart(barangayPatientVisitsChartCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: `Patient Visits - ${chartLabel}`,
                    data: visitData,
                    backgroundColor: 'rgba(52, 168, 83, 0.2)',
                    borderColor: 'rgba(52, 168, 83, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(52, 168, 83, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Patient Visits - ${chartLabel}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#1a73e8'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Visits',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Function to populate barangay dropdown with all options 1-26
    function populateBarangayDropdown() {
        // Always clear and add all barangays 1-26
        barangaySelect.innerHTML = '<option value="all">All Barangays</option>';
        
        // Add all barangays 1-26
        for (let i = 1; i <= 26; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            option.textContent = i.toString();
            barangaySelect.appendChild(option);
        }
        
        console.log('Barangay dropdown populated with all 26 barangays');
        
        // Try to fetch real data and update if available
        fetchRealBarangayData();
    }
    
    // Function to fetch real barangay data and update dropdown if needed
    async function fetchRealBarangayData() {
        try {
            const url = new URL('Back-end/api/get-barangay-stats.php', window.location.origin + window.location.pathname);
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success && result.data.all_barangays && result.data.all_barangays.length > 0) {
                console.log('Real barangay data found:', result.data.all_barangays);
                // Keep the existing options but log the real data for debugging
            }
        } catch (error) {
            console.error('Error fetching real barangay data:', error);
        }
    }

    if (barangaySelect) {
        // Populate dropdown first
        populateBarangayDropdown();
        
        barangaySelect.addEventListener('change', (e) => {
            renderBarangayChart(e.target.value);
        });
        
        // Initial render for "All Barangays"
        renderBarangayChart('all');
    }


    // --- Doctor's Duty Calendar ---
    // Removed as part of sidebar removal

    // --- Appointments Section Calendar ---
    const appointmentsCalendarDates = document.getElementById('appointmentsCalendarDates');
    const appointmentsCurrentMonthYearSpan = document.getElementById('appointmentsCurrentMonthYear');
    const appointmentsPrevMonthBtn = document.getElementById('appointmentsPrevMonth');
    const appointmentsNextMonthBtn = document.getElementById('appointmentsNextMonth');
    const appointmentOverviewTableBody = document.querySelector('#appointmentOverviewTable tbody');

    let appointmentsCurrentDate = new Date();
    let selectedAppointmentCalendarDay = null;

    const appointments = [
        { id: 1, date: '2023-10-15', time: '09:00 AM', type: 'General Check-up', patient: 'Maria Santos', doctor: 'Dr. Rodriguez', approvedBy: 'Nurse A', reason: 'Routine check-up', status: 'Confirmed' }
    ];

    function generateAppointmentsCalendar() {
        if (!appointmentsCalendarDates || !appointmentsCurrentMonthYearSpan) return;
        appointmentsCalendarDates.innerHTML = '';
        const year = appointmentsCurrentDate.getFullYear();
        const month = appointmentsCurrentDate.getMonth();

        appointmentsCurrentMonthYearSpan.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const firstWeekday = firstDayOfMonth.getDay();

        for (let i = 0; i < firstWeekday; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty-day');
            appointmentsCalendarDates.appendChild(emptyDay);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = i;

            const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayElement.dataset.date = fullDate;

            const appointmentsOnThisDay = appointments.filter(app => app.date === fullDate);
            if (appointmentsOnThisDay.length > 0) {
                dayElement.classList.add('available-day');
                const indicator = document.createElement('div');
                indicator.classList.add('appointment-indicator');
                dayElement.appendChild(indicator);
                dayElement.title = appointmentsOnThisDay.map(app => `${app.time} - ${app.patient} (${app.type})`).join('\n');
            } else {
                dayElement.classList.add('empty-day');
            }

            dayElement.addEventListener('click', () => {
                if (selectedAppointmentCalendarDay) {
                    selectedAppointmentCalendarDay.classList.remove('selected-day');
                }
                dayElement.classList.add('selected-day');
                selectedAppointmentCalendarDay = dayElement;
            });

            appointmentsCalendarDates.appendChild(dayElement);
        }

        const today = new Date();
        const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayElement = appointmentsCalendarDates.querySelector(`[data-date="${todayFormatted}"]`);
        if (todayElement) {
            todayElement.classList.add('selected-day');
            selectedAppointmentCalendarDay = todayElement;
        } else {
            const firstDayElement = appointmentsCalendarDates.querySelector('.calendar-day:not(.empty-day)');
            if (firstDayElement) {
                firstDayElement.classList.add('selected-day');
                selectedAppointmentCalendarDay = firstDayElement;
            }
        }
    }

    function showNextAppointmentsMonth() {
        appointmentsCurrentDate.setMonth(appointmentsCurrentDate.getMonth() + 1);
        generateAppointmentsCalendar();
        renderAppointmentOverview();
    }

    function showPrevAppointmentsMonth() {
        appointmentsCurrentDate.setMonth(appointmentsCurrentDate.getMonth() - 1);
        generateAppointmentsCalendar();
        renderAppointmentOverview();
    }

    if (appointmentsPrevMonthBtn) appointmentsPrevMonthBtn.addEventListener('click', showPrevAppointmentsMonth);
    if (appointmentsNextMonthBtn) appointmentsNextMonthBtn.addEventListener('click', showNextAppointmentsMonth);

    function renderAppointmentOverview(filterDate = null) {
        if (!appointmentOverviewTableBody) return;
        appointmentOverviewTableBody.innerHTML = '';

        let appointmentsToDisplay = appointments;
        if (filterDate) {
            appointmentsToDisplay = appointments.filter(app => app.date === filterDate);
        } else {
            const year = appointmentsCurrentDate.getFullYear();
            const month = appointmentsCurrentDate.getMonth();
            appointmentsToDisplay = appointments.filter(app => {
                const appDate = new Date(app.date);
                return appDate.getFullYear() === year && appDate.getMonth() === month;
            });
        }

        if (appointmentsToDisplay.length === 0) {
            const noDataRow = appointmentOverviewTableBody.insertRow();
            noDataRow.innerHTML = `<td colspan="6" style="text-align: center;">No appointments for this period.</td>`;
            return;
        }

        appointmentsToDisplay.forEach(appointment => {
            const row = appointmentOverviewTableBody.insertRow();
            row.innerHTML = `
                <td>${appointment.date} ${appointment.time}</td>
                <td>${appointment.type}</td>
                <td>${appointment.patient}</td>
                <td>${appointment.doctor}</td>
                <td>${appointment.approvedBy}</td>
                <td>
                    <button class="btn btn-primary view-appointment-details-btn" data-appointment-id="${appointment.id}" style="padding: 5px 10px;">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
        });

        document.querySelectorAll('.view-appointment-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const appointmentId = parseInt(e.currentTarget.dataset.appointmentId);
                const appointmentData = appointments.find(app => app.id === appointmentId);
                if (appointmentData) {
                    openViewAppointmentModal(appointmentData);
                }
            });
        });
    }

    generateAppointmentsCalendar();
    renderAppointmentOverview();

    const viewAllAppointmentsBtn = document.getElementById('viewAllAppointmentsBtn');
    if (viewAllAppointmentsBtn) {
        viewAllAppointmentsBtn.addEventListener('click', () => {
            appointmentsCurrentDate = new Date();
            generateAppointmentsCalendar();
            renderAppointmentOverview(null);
        });
    }

    // --- Add Patient Modal ---
    const openPatientModalBtn = document.getElementById('addPatientBtn');
    const closePatientModalBtn = document.getElementById('closePatientModalBtn');
    const cancelPatientFormBtn = document.getElementById('cancelPatientForm');
    const patientModalOverlay = document.getElementById('patientModalOverlay');
    const patientForm = document.getElementById('patientForm');

    if (openPatientModalBtn) {
        openPatientModalBtn.addEventListener('click', () => {
            if (patientModalOverlay) patientModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    function closePatientModal() {
        if (patientModalOverlay) patientModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (patientForm) patientForm.reset();
    }

    if (closePatientModalBtn) closePatientModalBtn.addEventListener('click', closePatientModal);
    if (cancelPatientFormBtn) cancelPatientFormBtn.addEventListener('click', closePatientModal);
    if (patientModalOverlay) {
        patientModalOverlay.addEventListener('click', (e) => {
            if (e.target === patientModalOverlay) {
                closePatientModal();
            }
        });
    }

    // --- Dashboard Patient Table ---
    const dashboardPatientsData = [
        { id: 1, name: 'Maria Santos', doctor: 'Dr. Rodriguez', date: '2023-10-15', time: '09:00 AM', status: 'Confirmed' }
    ];

    const dashboardPatientTableBody = document.querySelector('#dashboardPatientTable tbody');

    function renderPatientTable() {
        if (!dashboardPatientTableBody) return;
        dashboardPatientTableBody.innerHTML = '';
        dashboardPatientsData.forEach(patient => {
            const row = dashboardPatientTableBody.insertRow();
            row.innerHTML = `
                <td>${patient.name}</td>
                <td>${patient.doctor}</td>
                <td>${patient.time}</td>
                <td>
                    <button class="action-btn delete-patient-btn" data-patient-id="${patient.id}" data-patient-name="${patient.name}"></button>
                    <button class="btn btn-primary view-patient-btn" data-patient-id="${patient.id}" style="padding: 5px 5px; margin:5px">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
        });

        document.querySelectorAll('.edit-patient-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const patientId = parseInt(e.currentTarget.dataset.patientId);
                const patientToEdit = dashboardPatientsData.find(p => p.id === patientId);
                if (patientToEdit) {
                    const fullPatientData = patientsData.find(p => p.id === `pat${patientId}`);
                    if (fullPatientData) {
                        openViewEditModal(fullPatientData, true);
                    } else {
                        alert('Full patient data not found for editing.');
                    }
                }
            });
        });

        document.querySelectorAll('.delete-patient-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const patientId = parseInt(e.currentTarget.dataset.patientId);
                const patientName = e.currentTarget.dataset.patientName;
                openConfirmDeleteModal(patientId, patientName, () => {
                    const index = dashboardPatientsData.findIndex(p => p.id === patientId);
                    if (index > -1) {
                        const deletedPatient = dashboardPatientsData.splice(index, 1)[0];
                        logActivity('Admin', 'Deleted Patient', `Patient: ${deletedPatient.name} (ID: ${deletedPatient.id})`, deletedPatient, null);
                        renderPatientTable();
                        alert('Patient record deleted successfully!');
                    }
                });
            });
        });

        document.querySelectorAll('.view-patient-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const patientId = parseInt(e.currentTarget.dataset.patientId);
                const fullPatientData = patientsData.find(p => p.id === `pat${patientId}`);
                if (fullPatientData) {
                    openViewEditModal(fullPatientData, false);
                } else {
                    alert('Full patient data not found for viewing.');
                }
            });
        });
    }

    renderPatientTable();

    // --- View/Edit Patient Modal ---
    const viewEditPatientModalOverlay = document.getElementById('viewEditPatientModalOverlay');
    const closeViewEditModalBtn = document.getElementById('closeViewEditModalBtn');
    const viewEditPatientForm = document.getElementById('viewEditPatientForm');
    const editPatientDetailsBtn = document.getElementById('editPatientDetailsBtn');
    const savePatientDetailsBtn = document.getElementById('savePatientDetailsBtn');
    const viewEditModalTitle = document.getElementById('viewEditModalTitle');

    let currentPatientId = null; // Global variable to store the ID of the currently viewed patient

    function openViewEditModal(patientData, isEditable = false) {
        if (!viewEditPatientForm) return;
        currentPatientId = patientData.id; // Set the current patient ID
        document.getElementById('viewEditPatientId').value = patientData.id;
        document.getElementById('viewEditFirstName').value = patientData.firstName;
        document.getElementById('viewEditLastName').value = patientData.lastName;
        document.getElementById('viewEditDob').value = patientData.dob;
        document.getElementById('viewEditGender').value = patientData.gender;
        document.getElementById('viewEditEmail').value = patientData.email;
        document.getElementById('viewEditPhone').value = patientData.phone;
        document.getElementById('viewEditAddress').value = patientData.address;
        document.getElementById('viewEditCity').value = patientData.city;
        document.getElementById('viewEditZipCode').value = patientData.zipCode;
        document.getElementById('viewEditBarangay').value = patientData.barangay;
        document.getElementById('viewEditCountry').value = patientData.country;
        document.getElementById('viewEditBloodType').value = patientData.bloodType;
        document.getElementById('viewEditAllergies').value = patientData.allergies;
        document.getElementById('viewEditConditions').value = patientData.conditions;
        document.getElementById('viewEditMedications').value = patientData.medications;
        document.getElementById('viewEditEmergencyName').value = patientData.emergencyName;
        document.getElementById('viewEditEmergencyRelationship').value = patientData.emergencyRelationship;
        document.getElementById('viewEditEmergencyPhone').value = patientData.emergencyPhone;
        // Ensure additionalDetails is handled correctly, it's an array now
        document.getElementById('viewEditAdditionalDetails').value = patientData.additionalDetails.map(d => `${d.type} (${d.timestamp}): ${d.details}`).join('\n\n');

        setFormEditability(isEditable);
        if (viewEditModalTitle) viewEditModalTitle.textContent = isEditable ? 'Edit Patient Details' : 'View Patient Details';
        if (viewEditPatientModalOverlay) viewEditPatientModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function setFormEditability(isEditable) {
        if (!viewEditPatientForm) return;
        const formElements = viewEditPatientForm.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            if (element.tagName === 'SELECT') {
                element.disabled = !isEditable;
            } else {
                element.readOnly = !isEditable;
            }
        });

        if (editPatientDetailsBtn) editPatientDetailsBtn.style.display = isEditable ? 'none' : 'inline-flex';
        if (savePatientDetailsBtn) savePatientDetailsBtn.style.display = isEditable ? 'inline-flex' : 'none';
    }

    function closeViewEditModal() {
        if (viewEditPatientModalOverlay) viewEditPatientModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (viewEditPatientForm) viewEditPatientForm.reset();
        setFormEditability(false);
        currentPatientId = null; // Clear the current patient ID
    }

    if (closeViewEditModalBtn) closeViewEditModalBtn.addEventListener('click', closeViewEditModal);
    if (viewEditPatientModalOverlay) {
        viewEditPatientModalOverlay.addEventListener('click', (e) => {
            if (e.target === viewEditPatientModalOverlay) {
                closeViewEditModal();
            }
        });
    }

    if (editPatientDetailsBtn) {
        editPatientDetailsBtn.addEventListener('click', () => {
            setFormEditability(true);
            if (viewEditModalTitle) viewEditModalTitle.textContent = 'Edit Patient Details';
        });
    }

    if (viewEditPatientForm) {
        viewEditPatientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            setFormEditability(true);
            const patientId = document.getElementById('viewEditPatientId').value;
            const oldPatientData = patientsData.find(p => p.id === patientId);

            const updatedPatientData = {
                id: patientId,
                firstName: document.getElementById('viewEditFirstName').value,
                lastName: document.getElementById('viewEditLastName').value,
                dob: document.getElementById('viewEditDob').value,
                gender: document.getElementById('viewEditGender').value,
                email: document.getElementById('viewEditEmail').value,
                phone: document.getElementById('viewEditPhone').value,
                address: document.getElementById('viewEditAddress').value,
                city: document.getElementById('viewEditCity').value,
                zipCode: document.getElementById('viewEditZipCode').value,
                barangay: document.getElementById('viewEditBarangay').value,
                country: document.getElementById('viewEditCountry').value,
                bloodType: document.getElementById('viewEditBloodType').value,
                allergies: document.getElementById('viewEditAllergies').value,
                conditions: document.getElementById('viewEditConditions').value,
                medications: document.getElementById('viewEditMedications').value,
                emergencyName: document.getElementById('viewEditEmergencyName').value,
                emergencyRelationship: document.getElementById('viewEditEmergencyRelationship').value,
                emergencyPhone: document.getElementById('viewEditEmergencyPhone').value,
                // For additionalDetails, we'll keep the existing array and not overwrite it from this form
                additionalDetails: oldPatientData.additionalDetails || [],
                prescriptions: oldPatientData.prescriptions || [] // Keep existing prescriptions
            };

            const index = patientsData.findIndex(p => p.id === patientId);
            if (index > -1) {
                patientsData[index] = updatedPatientData;
                alert('Patient details saved!');
                console.log('Updated Patient Data:', updatedPatientData);
                logActivity('Admin', 'Updated Patient Details', `Patient: ${updatedPatientData.firstName} ${updatedPatientData.lastName} (ID: ${updatedPatientData.id})`, oldPatientData, updatedPatientData);
                const dashboardIndex = dashboardPatientsData.findIndex(p => `pat${p.id}` === patientId);
                if (dashboardIndex > -1) {
                    dashboardPatientsData[dashboardIndex].name = `${updatedPatientData.firstName} ${updatedPatientData.lastName}`;
                    renderPatientTable();
                }
                // Re-render the patient details in the main section to reflect changes
                openPatientDetails(patientId);
            } else {
                alert('Error: Patient not found for update.');
            }
            closeViewEditModal();
        });
    }

    // --- Inventory Management ---
    let inventoryItems = [];
    function setStatByHeading(headingText, value) {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            const h = card.querySelector('h3');
            const p = card.querySelector('p');
            if (!h || !p) return;
            if (h.textContent.trim().toLowerCase() === headingText.trim().toLowerCase()) {
                p.textContent = value;
            }
        });
    }

    async function loadInventoryStats() {
        try {
            const res = await fetch('/4care/Admin-Dash/Back-end/api/get-inventory-stats.php');
            const json = await res.json();
            if (json.success) {
                const stats = json.data;
                setStatByHeading('Total Items', stats.total_items);
                setStatByHeading('Low Stock Items', stats.low_stock);
                setStatByHeading('Expiring Soon', stats.expiring_soon);
            }
        } catch (e) { console.error('Stats load failed', e); }
    }

    const inventoryTableBody = document.querySelector('#inventoryTable tbody');

    async function loadInventory() {
        try {
            const res = await fetch('/4care/Admin-Dash/Back-end/api/get-inventory.php');
            const data = await res.json();
            if (data.success) {
                inventoryItems = data.data || [];
                renderInventoryTable();
            }
        } catch (e) { console.error(e); }
    }

    function renderInventoryTable() {
        if (!inventoryTableBody) return;
        inventoryTableBody.innerHTML = '';
        inventoryItems.forEach(item => {
            const row = inventoryTableBody.insertRow();
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${item.last_updated || ''}</td>
                <td>
                    <button class="action-btn edit-inventory-btn" data-item-id="${item.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-inventory-btn" data-item-id="${item.id}" data-item-name="${item.name}" title="Delete" style="margin-left:8px; color:#111827;"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });

        document.querySelectorAll('.edit-inventory-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = parseInt(e.currentTarget.dataset.itemId);
                const itemToEdit = inventoryItems.find(item => item.id === itemId);
                if (itemToEdit) {
                    openEditInventoryItemModal(itemToEdit);
                }
            });
        });

        document.querySelectorAll('.delete-inventory-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = parseInt(e.currentTarget.dataset.itemId);
                const itemName = e.currentTarget.dataset.itemName;
                openConfirmDeleteModal(itemId, itemName, async () => {
                    try {
                        await fetch('/4care/Admin-Dash/Back-end/api/delete-inventory.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: itemId })
                        });
                        await loadInventory();
                        await loadInventoryStats();
                        // Log deletion
                        try {
                            logActivity('Admin', 'Deleted Inventory Item', `Item: ${itemName}`, { id: itemId, name: itemName }, null);
                        } catch (_) {}
                        alert('Item deleted successfully!');
                    } catch (err) { alert('Delete failed'); }
                });
            });
        });
    }



    loadInventory();
    loadInventoryStats();

    // --- Add New Inventory Item Modal ---
    const addInventoryItemBtn = document.getElementById('addInventoryItemBtn');
    const addInventoryItemModalOverlay = document.getElementById('addInventoryItemModalOverlay');
    const closeAddInventoryItemModalBtn = document.getElementById('closeAddInventoryItemModalBtn');
    const cancelAddInventoryItemForm = document.getElementById('cancelAddInventoryItemForm');
    const addInventoryItemForm = document.getElementById('addInventoryItemForm');

    if (addInventoryItemBtn) {
        addInventoryItemBtn.addEventListener('click', () => {
            if (addInventoryItemModalOverlay) addInventoryItemModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    function closeAddInventoryItemModal() {
        if (addInventoryItemModalOverlay) addInventoryItemModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (addInventoryItemForm) addInventoryItemForm.reset();
    }

    if (closeAddInventoryItemModalBtn) closeAddInventoryItemModalBtn.addEventListener('click', closeAddInventoryItemModal);
    if (cancelAddInventoryItemForm) cancelAddInventoryItemForm.addEventListener('click', closeAddInventoryItemModal);
    if (addInventoryItemModalOverlay) {
        addInventoryItemModalOverlay.addEventListener('click', (e) => {
            if (e.target === addInventoryItemModalOverlay) {
                closeAddInventoryItemModal();
            }
        });
    }

    if (addInventoryItemForm) {
        addInventoryItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('itemName').value,
                quantity: parseInt(document.getElementById('itemQuantity').value),
                unit: document.getElementById('itemUnit').value,
                supplier: document.getElementById('itemSupplier').value,
                expiry_date: document.getElementById('itemExpiryDate').value,
                location: document.getElementById('itemLocation').value
            };
            fetch('/4care/Admin-Dash/Back-end/api/save-inventory.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(() => {
                loadInventory();
                loadInventoryStats();
                logActivity('Admin', 'Added Inventory Item', `Item: ${payload.name}, Qty: ${payload.quantity} ${payload.unit}`, null, payload);
            alert('New Inventory Item Added!');
            closeAddInventoryItemModal();
            }).catch(() => alert('Failed to add item'));
        });
    }

    // --- Edit Inventory Item Modal ---
    const editInventoryItemModalOverlay = document.getElementById('editInventoryItemModalOverlay');
    const closeEditInventoryItemModalBtn = document.getElementById('closeEditInventoryItemModalBtn');
    const cancelEditInventoryItemForm = document.getElementById('cancelEditInventoryItemForm');
    const editInventoryItemForm = document.getElementById('editInventoryItemForm');

    function openEditInventoryItemModal(itemData) {
        if (!editInventoryItemForm) return;
        document.getElementById('editItemId').value = itemData.id;
        document.getElementById('editItemName').value = itemData.name;
        document.getElementById('editItemQuantity').value = itemData.quantity;
        document.getElementById('editItemUnit').value = itemData.unit;
        document.getElementById('editItemSupplier').value = itemData.supplier;
        document.getElementById('editItemExpiryDate').value = itemData.expiryDate;
        document.getElementById('editItemLocation').value = itemData.location;

        if (editInventoryItemModalOverlay) editInventoryItemModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeEditInventoryItemModal() {
        if (editInventoryItemModalOverlay) editInventoryItemModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (editInventoryItemForm) editInventoryItemForm.reset();
    }

    if (cancelEditInventoryItemForm) cancelEditInventoryItemForm.addEventListener('click', closeEditInventoryItemModal);
    if (closeEditInventoryItemModalBtn) closeEditInventoryItemModalBtn.addEventListener('click', closeEditInventoryItemModal);
    if (editInventoryItemModalOverlay) {
        editInventoryItemModalOverlay.addEventListener('click', (e) => {
            if (e.target === editInventoryItemModalOverlay) {
                closeEditInventoryItemModal();
            }
        });
    }

    if (editInventoryItemForm) {
        editInventoryItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedItem = {
                id: parseInt(document.getElementById('editItemId').value),
                name: document.getElementById('editItemName').value,
                quantity: parseInt(document.getElementById('editItemQuantity').value),
                unit: document.getElementById('editItemUnit').value,
                supplier: document.getElementById('editItemSupplier').value,
                expiry_date: document.getElementById('editItemExpiryDate').value,
                location: document.getElementById('editItemLocation').value
            };

            fetch('/4care/Admin-Dash/Back-end/api/update-inventory.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            }).then(() => {
                loadInventory();
                loadInventoryStats();
                logActivity('Admin', 'Updated Inventory Item', `Item: ${updatedItem.name}, Quantity set to ${updatedItem.quantity}`, null, updatedItem);
                alert('Inventory Item Updated Successfully!');
            closeEditInventoryItemModal();
            }).catch(() => alert('Update failed'));
        });
    }

    // --- Schedule Doctor Modal ---
    const addDoctorScheduleBtn = document.getElementById('addDoctorScheduleBtn');
    const scheduleDoctorModalOverlay = document.getElementById('scheduleDoctorModalOverlay');
    const closeScheduleDoctorModalBtn = document.getElementById('closeScheduleDoctorModalBtn');
    const cancelScheduleDoctorForm = document.getElementById('cancelScheduleDoctorForm');
    const scheduleDoctorForm = document.getElementById('scheduleDoctorForm');

    if (addDoctorScheduleBtn) {
        addDoctorScheduleBtn.addEventListener('click', () => {
            if (scheduleDoctorModalOverlay) scheduleDoctorModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    function closeScheduleDoctorModal() {
        if (scheduleDoctorModalOverlay) scheduleDoctorModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (scheduleDoctorForm) scheduleDoctorForm.reset();
    }

    if (closeScheduleDoctorModalBtn) closeScheduleDoctorModalBtn.addEventListener('click', closeScheduleDoctorModal);
    if (cancelScheduleDoctorForm) cancelScheduleDoctorForm.addEventListener('click', closeScheduleDoctorModal);
    if (scheduleDoctorModalOverlay) {
        scheduleDoctorModalOverlay.addEventListener('click', (e) => {
            if (e.target === scheduleDoctorModalOverlay) {
                closeScheduleDoctorModal();
            }
        });
    }

    if (scheduleDoctorForm) {
        scheduleDoctorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Delegate to backend-powered saver; shows UI messages itself
            if (window.adminSchedule && typeof window.adminSchedule.saveSchedule === 'function') {
                window.adminSchedule.saveSchedule();
            } else {
                console.warn('adminSchedule instance not ready; falling back to simple notice');
                alert('Please wait a moment and try again.');
            }
        });
    }

    // Notify iframe about current visible calendar month so backend can fetch correct range
    try {
        const iframe = document.querySelector('iframe.doc-calendar');
        if (iframe && iframe.contentWindow) {
            // Detect month navigation buttons in the iframe via messages if implemented
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            iframe.contentWindow.postMessage({ type: 'SET_RANGE', range: { start_date: start, end_date: end } }, '*');
        }
    } catch (e) {}

    // Update top-right counter when iframe reports schedule count
    window.addEventListener('message', (evt) => {
        const data = evt.data || {};
        if (data.type === 'SCHEDULE_COUNT') {
            const meta = document.getElementById('scheduleMeta');
            if (meta && typeof data.count === 'number') {
                meta.textContent = `${data.count} scheduled listed`;
            }
        }
    });

    // --- View Appointment Details Modal ---
    const viewAppointmentModalOverlay = document.getElementById('viewAppointmentModalOverlay');
    const closeViewAppointmentModalBtn = document.getElementById('closeViewAppointmentModalBtn');
    const closeViewAppointmentModalFooterBtn = document.getElementById('closeViewAppointmentModalFooterBtn');

    function openViewAppointmentModal(appointmentData) {
        if (!viewAppointmentModalOverlay) return;
        document.getElementById('viewApptDateTime').textContent = `${appointmentData.date} ${appointmentData.time}`;
        document.getElementById('viewApptType').textContent = appointmentData.type;
        document.getElementById('viewApptPatientName').textContent = appointmentData.patient;
        document.getElementById('viewApptDoctor').textContent = appointmentData.doctor;
        document.getElementById('viewApptApprovedBy').textContent = appointmentData.approvedBy;
        document.getElementById('viewApptReason').textContent = appointmentData.reason;
        document.getElementById('viewApptStatus').textContent = appointmentData.status;

        viewAppointmentModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeViewAppointmentModal() {
        if (viewAppointmentModalOverlay) viewAppointmentModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeViewAppointmentModalBtn) closeViewAppointmentModalBtn.addEventListener('click', closeViewAppointmentModal);
    if (closeViewAppointmentModalFooterBtn) closeViewAppointmentModalFooterBtn.addEventListener('click', closeViewAppointmentModal);
    if (viewAppointmentModalOverlay) {
        viewAppointmentModalOverlay.addEventListener('click', (e) => {
            if (e.target === viewAppointmentModalOverlay) {
                closeViewAppointmentModal();
            }
        });
    }

    // --- Doctor Appointment Details Modal ---
    const doctorAppointmentModalOverlay = document.getElementById('doctorAppointmentModalOverlay');
    const closeDoctorAppointmentModalBtn = document.getElementById('closeDoctorAppointmentModalBtn');
    const closeDoctorAppointmentModalFooterBtn = document.getElementById('closeDoctorAppointmentModalFooterBtn');

    function openDoctorAppointmentModal(slotData) {
        if (!doctorAppointmentModalOverlay) return;
        document.getElementById('doctorApptDoctorName').textContent = slotData.doctorName || 'N/A';
        document.getElementById('doctorApptTimeSlot').textContent = slotData.time;
        document.getElementById('doctorApptPatient').textContent = slotData.patient;
        document.getElementById('doctorApptType').textContent = slotData.type;
        document.getElementById('doctorApptDetails').textContent = slotData.details;

        doctorAppointmentModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDoctorAppointmentModal() {
        if (doctorAppointmentModalOverlay) doctorAppointmentModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeDoctorAppointmentModalBtn) closeDoctorAppointmentModalBtn.addEventListener('click', closeDoctorAppointmentModal);
    if (closeDoctorAppointmentModalFooterBtn) closeDoctorAppointmentModalFooterBtn.addEventListener('click', closeDoctorAppointmentModal);
    if (doctorAppointmentModalOverlay) {
        doctorAppointmentModalOverlay.addEventListener('click', (e) => {
            if (e.target === doctorAppointmentModalOverlay) {
                closeDoctorAppointmentModal();
            }
        });
    }

    // --- Doctors on Duty Table ---
    const doctorsOnDuty = [
        {
            name: 'Dr. Alice Smith',
            specialization: 'General Practice',
            availability: [
                { time: '09:00 AM - 10:00 AM', patient: 'No Appointment', type: 'Available', doctorName: 'Dr. Alice Smith', details: 'No current appointment scheduled.' },
                { time: '10:00 AM - 11:00 AM', patient: 'Maria Santos', type: 'Consultation', doctorName: 'Dr. Alice Smith', details: 'Follow-up on recent check-up.' },
            ]
        },
        {
            name: 'Dr. Bob Johnson',
            specialization: 'Pediatrics',
            availability: [
                { time: '08:00 AM - 09:00 AM', patient: 'Emily White', type: 'Check-up', doctorName: 'Dr. Bob Johnson', details: 'Routine pediatric check-up.' },
            ]
        },
        {
            name: 'Dr. Carol White',
            specialization: 'Cardiology',
            availability: [
                { time: '10:00 AM - 11:00 AM', patient: 'No Appointment', type: 'Available', doctorName: 'Dr. Carol White', details: 'No current appointment scheduled.' },
                { time: '11:00 AM - 12:00 PM', patient: 'Robert Green', type: 'Follow-up', doctorName: 'Dr. Carol White', details: 'Post-surgery check.' },
            ]
        }
    ];

    const doctorsOnDutyTableBody = document.querySelector('#doctorsOnDutyTable tbody');

    function renderDoctorsOnDuty() {
        if (!doctorsOnDutyTableBody) return;
        doctorsOnDutyTableBody.innerHTML = '';

        doctorsOnDuty.forEach(doctor => {
            const row = doctorsOnDutyTableBody.insertRow();
            const doctorCell = row.insertCell();
            doctorCell.textContent = `${doctor.name} (${doctor.specialization})`;

            const availabilityCell = row.insertCell();
            doctor.availability.forEach(slot => {
                const slotDiv = document.createElement('div');
                slotDiv.classList.add('doctor-availability-slot');
                slotDiv.textContent = slot.time;
                slotDiv.dataset.doctorName = doctor.name;
                slotDiv.dataset.timeSlot = slot.time;
                slotDiv.dataset.patient = slot.patient;
                slotDiv.dataset.type = slot.type;
                slotDiv.dataset.details = slot.details || 'N/A';

                slotDiv.addEventListener('click', () => {
                    openDoctorAppointmentModal({
                        doctorName: slotDiv.dataset.doctorName,
                        time: slotDiv.dataset.timeSlot,
                        patient: slotDiv.dataset.patient,
                        type: slotDiv.dataset.type,
                        details: slotDiv.dataset.details
                    });
                });
                availabilityCell.appendChild(slotDiv);
            });
        });
    }

    renderDoctorsOnDuty();

    // --- Doctor Cards and Details ---
    const doctorCardGrid = document.getElementById('doctorCardGrid');
    const staffDetailsTitle = document.getElementById('staffDetailsTitle');
    const staffProfileDetails = document.getElementById('staffProfileDetails');

    const doctorsData = [
        {
            id: 'doc1',
            name: 'Dr. Alice Smith',
            position: 'Doctor',
            specialization: 'General Practice',
            email: 'alice.smith@example.com',
            phone: '09123456789',
            license: 'MD-12345',
            availability: 'Mon-Fri, 9 AM - 5 PM',
            bio: 'Dr. Smith is a highly experienced general practitioner with over 15 years in family medicine. She is dedicated to providing comprehensive and compassionate care to patients of all ages.',
            image: 'https://st2.depositphotos.com/1006318/5909/v/450/depositphotos_59095203-stock-illustration-medical-doctor-profile.jpg'
        },
        {
            id: 'doc2',
            name: 'Dr. Bob Johnson',
            position: 'Doctor',
            specialization: 'Pediatrics',
            email: 'bob.johnson@example.com',
            phone: '09234567890',
            license: 'MD-67890',
            availability: 'Mon-Wed, 10 AM - 6 PM',
            bio: 'Dr. Johnson specializes in pediatric care, focusing on the health and well-being of children from infancy through adolescence. He is known for his patient-friendly approach.',
            image: 'https://st2.depositphotos.com/1006318/5909/v/450/depositphotos_59095203-stock-illustration-medical-doctor-profile.jpg'
        }
    ];

    function renderDoctorCards(filteredDoctors = doctorsData) {
        if (!doctorCardGrid) return;
        doctorCardGrid.innerHTML = '';
        if (filteredDoctors.length === 0) {
            doctorCardGrid.innerHTML = '<p style="color: white; text-align: center;">No doctors found matching your search.</p>';
            return;
        }
        filteredDoctors.forEach(doctor => {
            const doctorCard = document.createElement('div');
            doctorCard.classList.add('doctor-card');
            doctorCard.dataset.doctorId = doctor.id;

            doctorCard.innerHTML = `
                <div class="doctor-card-image">
                    ${doctor.image ? `<img src="${doctor.image}" alt="${doctor.name}">` : `<i class="fas fa-user-circle"></i>`}
                </div>
                <div class="doctor-card-info">
                    <h4>${doctor.name}</h4>
                    <p>${doctor.position} - ${doctor.specialization}</p>
                </div>
            `;
            doctorCardGrid.appendChild(doctorCard);

            doctorCard.addEventListener('click', () => {
                displayStaffDetails(doctor.id);
            });
        });
    }

    function displayStaffDetails(staffId) {
        const staff = doctorsData.find(d => d.id === staffId);
        if (!staffDetailsTitle || !staffProfileDetails) return;

        if (staff) {
            staffDetailsTitle.textContent = `Details for ${staff.name}`;
            document.getElementById('staffDetailName').textContent = staff.name;
            document.getElementById('staffDetailPosition').textContent = staff.position;
            document.getElementById('staffDetailSpecialization').textContent = staff.specialization;
            document.getElementById('staffDetailEmail').textContent = staff.email;
            document.getElementById('staffDetailPhone').textContent = staff.phone;
            document.getElementById('staffDetailLicense').textContent = staff.license;
            document.getElementById('staffDetailAvailability').textContent = staff.availability;

            const staffDetailBioP = document.getElementById('staffDetailBio');
            if (staffDetailBioP) staffDetailBioP.textContent = staff.bio;
            const staffDetailBioContainer = document.getElementById('staffDetailBioContainer');
            if (staffDetailBioContainer) staffDetailBioContainer.onclick = () => openDoctorBioModal(staff.bio);

            const availabilityItem = staffProfileDetails.querySelector('#staffDetailAvailability');
            const bioItem = staffProfileDetails.querySelector('#staffDetailBioContainer');

            if (availabilityItem && bioItem) {
                availabilityItem.style.gridColumn = 'span 1';
                bioItem.style.gridColumn = 'span 1';
            }

        } else {
            staffDetailsTitle.textContent = 'Select a Staff to View Details';
            document.getElementById('staffDetailName').textContent = '';
            document.getElementById('staffDetailPosition').textContent = '';
            document.getElementById('staffDetailSpecialization').textContent = '';
            document.getElementById('staffDetailEmail').textContent = '';
            document.getElementById('staffDetailPhone').textContent = '';
            document.getElementById('staffDetailLicense').textContent = '';
            document.getElementById('staffDetailAvailability').textContent = '';
            const staffDetailBioP = document.getElementById('staffDetailBio');
            if (staffDetailBioP) staffDetailBioP.textContent = '';
        }
    }

    const doctorSearchInput = document.getElementById('doctorSearchInput');
    const doctorSearchBtn = document.getElementById('doctorSearchBtn');

    function filterDoctors() {
        const searchTerm = doctorSearchInput ? doctorSearchInput.value.toLowerCase() : '';
        const filteredDoctors = doctorsData.filter(doctor =>
            doctor.name.toLowerCase().includes(searchTerm) ||
            doctor.specialization.toLowerCase().includes(searchTerm) ||
            doctor.position.toLowerCase().includes(searchTerm)
        );
        renderDoctorCards(filteredDoctors);
    }

    if (doctorSearchInput) doctorSearchInput.addEventListener('keyup', filterDoctors);
    if (doctorSearchBtn) doctorSearchBtn.addEventListener('click', filterDoctors);

    renderDoctorCards();

    // --- Doctor Bio Modal ---
    const doctorBioModalOverlay = document.getElementById('doctorBioModalOverlay');
    const closeDoctorBioModalBtn = document.getElementById('closeDoctorBioModalBtn');
    const closeDoctorBioModalFooterBtn = document.getElementById('closeDoctorBioModalFooterBtn');
    const doctorBioContent = document.getElementById('doctorBioContent');

    function openDoctorBioModal(bioText) {
        if (!doctorBioModalOverlay || !doctorBioContent) return;
        doctorBioContent.textContent = bioText;
        doctorBioModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDoctorBioModal() {
        if (doctorBioModalOverlay) doctorBioModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeDoctorBioModalBtn) closeDoctorBioModalBtn.addEventListener('click', closeDoctorBioModal);
    if (closeDoctorBioModalFooterBtn) closeDoctorBioModalFooterBtn.addEventListener('click', closeDoctorBioModal);
    if (doctorBioModalOverlay) {
        doctorBioModalOverlay.addEventListener('click', (e) => {
            if (e.target === doctorBioModalOverlay) {
                closeDoctorBioModal();
            }
        });
    }

    // --- Incoming Patient Details Modal ---
    const incomingPatientModal = document.getElementById('incomingPatientModalOverlay');
    const closeIncomingPatientModalBtn = document.getElementById('closeIncomingPatientModalBtn');
    // Removed incomingPatientList as part of sidebar removal

    const incomingPatientsData = [
        { id: 1, name: 'Jane Doe', age: 32, gender: 'Female', reason: 'Routine Checkup', notes: 'Annual physical examination' },
        { id: 2, name: 'John Smith', age: 45, gender: 'Male', reason: 'Flu Symptoms', notes: 'High fever and cough for 3 days' },
        { id: 3, name: 'Emily White', age: 28, gender: 'Female', reason: 'Vaccination', notes: 'Requested flu vaccine' }
    ];

    function renderIncomingPatients() {
        // This function is no longer needed as incoming patients are removed from the sidebar
        // However, if you want to re-implement incoming patients in the main content,
        // you would need to add a container for them in the HTML and update this function.
    }

    renderIncomingPatients(); // This call will now do nothing if incomingPatientList is null

    if (closeIncomingPatientModalBtn) {
        closeIncomingPatientModalBtn.addEventListener('click', () => {
            if (incomingPatientModal) incomingPatientModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // --- Patient List and Details ---
    const patientCardGrid = document.getElementById('patientCardGrid');
    const patientDetailsTitle = document.getElementById('patientDetailsTitle');
    const patientProfileDetails = document.getElementById('patientProfileDetails');
    const barangayFilter = document.getElementById('barangayFilter'); // Get the new filter element
    const patientDetailPrescriptionsContainer = document.getElementById('patientDetailPrescriptionsContainer'); // NEW
    const patientDetailPrescriptions = document.getElementById('patientDetailPrescriptions'); // NEW

    const patientsData = [
        // Patient data will be loaded from database
    ];

    // Function to load patients from database
    async function loadPatientsFromDatabase() {
        try {
            const response = await fetch('/4care/Admin-Dash/Back-end/api/get-patients.php');
            const result = await response.json();
            
            if (result.success) {
                patientsData.length = 0; // Clear existing data
                patientsData.push(...result.data);
                renderPatientCards();
                console.log('Patients loaded from database:', result.data.length);
            } else {
                console.error('Error loading patients:', result.message);
            }
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    }

    // Function to load patients from database with search and filter
    async function loadPatientsFromDatabaseWithFilters(searchTerm, selectedBarangay) {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedBarangay && selectedBarangay !== 'all') params.append('barangay', selectedBarangay);
            
            console.log('Filtering with search:', searchTerm, 'barangay:', selectedBarangay);
            console.log('API URL:', `/4care/Admin-Dash/Back-end/api/get-patients.php?${params.toString()}`);
            
            const response = await fetch(`/4care/Admin-Dash/Back-end/api/get-patients.php?${params.toString()}`);
            const result = await response.json();
            
            console.log('API Response:', result);
            
            if (result.success) {
                patientsData.length = 0; // Clear existing data
                patientsData.push(...result.data);
                renderPatientCards();
                console.log('Filtered patients loaded from database:', result.data.length);
            } else {
                console.error('Error loading filtered patients:', result.message);
            }
        } catch (error) {
            console.error('Error loading filtered patients:', error);
        }
    }

    function renderPatientCards(filteredPatients = patientsData) {
        if (!patientCardGrid) return;
        patientCardGrid.innerHTML = '';
        if (filteredPatients.length === 0) {
            patientCardGrid.innerHTML = '<p style="color: white; text-align: center;">No patients found matching your search or filter.</p>';
            return;
        }
        filteredPatients.forEach(patient => {
            const patientCard = document.createElement('div');
            patientCard.classList.add('patient-card');
            patientCard.dataset.patientId = patient.id;

            // Format patient ID as #00001, #00002, etc.
            const formattedPatientId = '#' + String(patient.patient_id || 0).padStart(5, '0');

            patientCard.innerHTML = `
                <div class="patient-card-info">
                    <div class="patient-top-row">
                        <div class="patient-id-container">
                            <p class="patient-id-text">${formattedPatientId}</p>
                        </div>
                        <div class="patient-name-container">
                            <h4 class="patient-name-small">${patient.firstName} ${patient.lastName}</h4>
                        </div>
                    </div>
                    <div class="patient-details-container">
                        <p>DOB: ${patient.dob}</p>
                        <p>Barangay: ${patient.barangay}</p>
                    </div>
                </div>
            `;
            patientCardGrid.appendChild(patientCard);

            patientCard.addEventListener('click', () => {
                openPatientDetails(patient.id);
            });
        });
    }

    function openPatientDetails(patientId) {
        const patient = patientsData.find(p => p.id === patientId);
        if (!patientDetailsTitle || !patientProfileDetails || !patientDetailPrescriptionsContainer || !patientDetailPrescriptions) return;

        if (patient) {
            // Show the patient details form
            patientProfileDetails.style.display = 'block';
            
            currentPatientId = patient.id; // Set the current patient ID for "Add Info" button
            patientDetailsTitle.textContent = `Details for ${patient.firstName} ${patient.lastName}`;
            document.getElementById('patientDetailName').textContent = `${patient.firstName} ${patient.lastName}`;
            document.getElementById('patientDetailDob').textContent = patient.dob;
            document.getElementById('patientDetailGender').textContent = patient.gender;
            document.getElementById('patientDetailEmail').textContent = patient.email;
            document.getElementById('patientDetailPhone').textContent = patient.phone;
            document.getElementById('patientDetailAddress').textContent = `${patient.address}, ${patient.city}, ${patient.zipCode}, ${patient.country}`;
            document.getElementById('patientDetailBarangay').textContent = patient.barangay;
            document.getElementById('patientDetailBloodType').textContent = patient.bloodType;
            document.getElementById('patientDetailAllergies').textContent = patient.allergies;
            document.getElementById('patientDetailConditions').textContent = patient.conditions;
            document.getElementById('patientDetailMedications').textContent = patient.medications;


            // NEW: Handle prescriptions
            if (patient.prescriptions && patient.prescriptions.length > 0) {
                patientDetailPrescriptions.innerHTML = ''; // Clear previous content
                patient.prescriptions.forEach(prescription => {
                    const prescriptionLink = document.createElement('a');
                    prescriptionLink.href = '#';
                    prescriptionLink.textContent = `Prescription from ${prescription.doctor} (${prescription.dateUploaded})`;
                    prescriptionLink.classList.add('prescription-link');
                    prescriptionLink.dataset.prescriptionId = prescription.id;
                    prescriptionLink.dataset.doctorName = prescription.doctor;
                    prescriptionLink.dataset.dateUploaded = prescription.dateUploaded;
                    prescriptionLink.dataset.fileUrl = prescription.fileUrl;
                    prescriptionLink.style.display = 'block'; // Each prescription on a new line
                    prescriptionLink.style.marginBottom = '5px';
                    prescriptionLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openPrescriptionDetailsModal(prescription);
                    });
                    patientDetailPrescriptions.appendChild(prescriptionLink);
                });
                patientDetailPrescriptionsContainer.style.display = 'block'; // Show the container
            } else {
                patientDetailPrescriptions.textContent = 'No prescriptions available.';
                patientDetailPrescriptionsContainer.style.display = 'block'; // Still show, but with "No prescriptions" text
            }


            const emergencyContactP = document.getElementById('patientDetailEmergencyContact');
            if (emergencyContactP) emergencyContactP.textContent = `${patient.emergencyName} (${patient.emergencyRelationship})`;
            const emergencyContactContainer = document.getElementById('patientDetailEmergencyContactContainer');
            if (emergencyContactContainer) emergencyContactContainer.onclick = () => openEmergencyContactModal(patient.emergencyName, patient.emergencyRelationship, patient.emergencyPhone);


            // Load health timeline for the patient
            console.log('Patient data for timeline:', patient);
            console.log('Patient ID for timeline:', patient.patient_id);
            loadHealthTimelineForPatient(patient.patient_id);

        } else {
            currentPatientId = null; // Clear the current patient ID
            patientDetailsTitle.textContent = 'Select a Patient to View Details';
            document.getElementById('patientDetailName').textContent = '';
            document.getElementById('patientDetailDob').textContent = '';
            document.getElementById('patientDetailGender').textContent = '';
            document.getElementById('patientDetailEmail').textContent = '';
            document.getElementById('patientDetailPhone').textContent = '';
            document.getElementById('patientDetailAddress').textContent = '';
            document.getElementById('patientDetailBarangay').textContent = '';
            document.getElementById('patientDetailBloodType').textContent = '';
            document.getElementById('patientDetailAllergies').textContent = '';
            document.getElementById('patientDetailConditions').textContent = '';
            document.getElementById('patientDetailMedications').textContent = '';
            patientDetailPrescriptions.innerHTML = ''; // Clear prescriptions
            patientDetailPrescriptionsContainer.style.display = 'none'; // Hide container if no patient
            const emergencyContactP = document.getElementById('patientDetailEmergencyContact');
            if (emergencyContactP) emergencyContactP.textContent = '';

        }
    }

    // Health Timeline Functions
    async function loadHealthTimelineForPatient(patientId) {
        console.log('Loading health timeline for patient ID:', patientId);
        try {
            const response = await fetch(`/4care/Doc-Dash/Back-end/api/get-health-timeline.php?patient_id=${patientId}`);
            const result = await response.json();
            
            console.log('Health timeline response:', result);
            
            if (result.success) {
                displayHealthTimeline(result.data);
            } else {
                console.error('Error loading health timeline:', result.message);
                displayHealthTimeline([]);
            }
        } catch (error) {
            console.error('Error loading health timeline:', error);
            displayHealthTimeline([]);
        }
    }

    function displayHealthTimeline(timelineData) {
        console.log('Displaying health timeline data:', timelineData);
        const timelineList = document.getElementById('adminPatientDetailHealthTimeline');
        if (!timelineList) {
            console.error('Timeline list element not found!');
            return;
        }

        timelineList.innerHTML = '';
        
        if (timelineData.length === 0) {
            timelineList.innerHTML = '<li style="color: #666; font-style: italic;">No health timeline entries yet.</li>';
            return;
        }

        timelineData.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${entry.entry_date}:</strong> ${entry.type_of_checkup} - ${entry.description}
            `;
            timelineList.appendChild(li);
        });
    }

    // Note: Admin Dashboard is read-only for health timeline
    // Save functionality is only available in Doctor Dashboard

    const patientSearchInput = document.getElementById('patientSearchInput');
    const patientSearchBtn = document.getElementById('patientSearchBtn');

    function filterPatients() {
        const searchTerm = patientSearchInput ? patientSearchInput.value.toLowerCase() : '';
        const selectedBarangay = barangayFilter ? barangayFilter.value : 'all';

        console.log('Filter function called - search:', searchTerm, 'barangay:', selectedBarangay);

        // If there's a search term or barangay filter, reload from database with filters
        if (searchTerm || selectedBarangay !== 'all') {
            loadPatientsFromDatabaseWithFilters(searchTerm, selectedBarangay);
        } else {
            // No filters, show all patients
            loadPatientsFromDatabase();
        }
    }

    if (patientSearchInput) patientSearchInput.addEventListener('keyup', filterPatients);
    if (patientSearchBtn) patientSearchBtn.addEventListener('click', filterPatients);
    if (barangayFilter) barangayFilter.addEventListener('change', filterPatients); // Listen for changes on the dropdown

    renderPatientCards(); // Initial render
    
    // Load patients from database
    loadPatientsFromDatabase();
    
    // Load dashboard statistics
    loadDashboardStats();

    // Function to load dashboard statistics
    async function loadDashboardStats() {
        try {
            const response = await fetch('/4care/Admin-Dash/Back-end/api/get-dashboard-stats.php');
            const result = await response.json();
            
            if (result.success) {
                // Update patient count
                const patientStatElement = document.querySelector('[data-key="stat1_value"]');
                if (patientStatElement) {
                    patientStatElement.textContent = result.data.patients_this_month;
                }
                
                // Update doctor count
                const doctorStatElement = document.querySelector('[data-key="stat2_value"]');
                if (doctorStatElement) {
                    doctorStatElement.textContent = result.data.doctors_this_month;
                }

                // Registered patients stat removed from admin dashboard UI
                
                console.log('Dashboard stats loaded:', result.data);
            } else {
                console.error('Error loading dashboard stats:', result.message);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    // Admin Dashboard is read-only for health timeline
    // No save functionality needed

    // --- Emergency Contact Details Modal ---
    const emergencyContactModalOverlay = document.getElementById('emergencyContactModalOverlay');
    const closeEmergencyContactModalBtn = document.getElementById('closeEmergencyContactModalBtn');
    const closeEmergencyContactModalFooterBtn = document.getElementById('closeEmergencyContactModalFooterBtn');
    const emergencyContactNameDetail = document.getElementById('emergencyContactNameDetail');
    const emergencyContactRelationshipDetail = document.getElementById('emergencyContactRelationshipDetail');
    const emergencyContactPhoneDetail = document.getElementById('emergencyContactPhoneDetail');

    function openEmergencyContactModal(name, relationship, phone) {
        if (!emergencyContactModalOverlay || !emergencyContactNameDetail || !emergencyContactRelationshipDetail || !emergencyContactPhoneDetail) return;
        emergencyContactNameDetail.textContent = name;
        emergencyContactRelationshipDetail.textContent = relationship;
        emergencyContactPhoneDetail.textContent = phone;
        emergencyContactModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeEmergencyContactModal() {
        if (emergencyContactModalOverlay) emergencyContactModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeEmergencyContactModalBtn) closeEmergencyContactModalBtn.addEventListener('click', closeEmergencyContactModal);
    if (closeEmergencyContactModalFooterBtn) closeEmergencyContactModalFooterBtn.addEventListener('click', closeEmergencyContactModal);
    if (emergencyContactModalOverlay) {
        emergencyContactModalOverlay.addEventListener('click', (e) => {
            if (e.target === emergencyContactModalOverlay) {
                closeEmergencyContactModal();
            }
        });
    }

    // --- Add Patient Information Modal ---
    const addPatientInfoModalOverlay = document.getElementById('addPatientInfoModalOverlay');
    const closeAddPatientInfoModalBtn = document.getElementById('closeAddPatientInfoModalBtn');
    const cancelAddPatientInfoForm = document.getElementById('cancelAddPatientInfoForm');
    const addPatientInfoForm = document.getElementById('addPatientInfoForm');
    const infoDetailsTextarea = document.getElementById('infoDetails'); // Get the infoDetails textarea


    function closeAddPatientInfoModal() {
        if (addPatientInfoModalOverlay) addPatientInfoModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (addPatientInfoForm) addPatientInfoForm.reset();
    }

    if (closeAddPatientInfoModalBtn) closeAddPatientInfoModalBtn.addEventListener('click', closeAddPatientInfoModal);
    if (cancelAddPatientInfoForm) cancelAddPatientInfoForm.addEventListener('click', closeAddPatientInfoModal);
    if (addPatientInfoModalOverlay) {
        addPatientInfoModalOverlay.addEventListener('click', (e) => {
            if (e.target === addPatientInfoModalOverlay) {
                closeAddPatientInfoModal();
            }
        });
    }

    if (addPatientInfoForm) {
        addPatientInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const infoType = document.getElementById('infoType').value;
            const infoDetails = document.getElementById('infoDetails').value;

            if (!currentPatientId) {
                alert('No patient selected. Please select a patient first.');
                return;
            }

            const patient = patientsData.find(p => p.id === currentPatientId);
            if (patient) {
                const timestamp = new Date().toLocaleString();
                const newInfoEntry = {
                    type: infoType,
                    details: infoDetails,
                    timestamp: timestamp
                };

                // Ensure additionalDetails is an array
                if (!Array.isArray(patient.additionalDetails)) {
                    patient.additionalDetails = [];
                }
                patient.additionalDetails.push(newInfoEntry);

                logActivity('Admin', 'Added Patient Information', `Added ${infoType} for Patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`, null, { type: infoType, details: infoDetails });
                alert('Information added successfully!');
                openPatientDetails(currentPatientId); // Re-render patient details to show new info
            } else {
                alert('Error: Patient not found.');
            }
            closeAddPatientInfoModal();
        });
    }


    // --- Activity Log Functionality ---
    // Revert to original single table wiring
    const activityLogTableBody = document.querySelector('#activityLogTable tbody') || document.querySelector('#activityLogTableAdmin tbody');
    const activityDetailsModalOverlay = document.getElementById('activityDetailsModalOverlay');
    const closeActivityDetailsModalBtn = document.getElementById('closeActivityDetailsModalBtn');
    const closeActivityDetailsModalFooterBtn = document.getElementById('closeActivityDetailsModalFooterBtn');
    // Attach print buttons per section
    document.querySelectorAll('.print-activity-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const tableToPrint = document.getElementById(targetId);
            if (!tableToPrint) return;
            const printWindow = window.open('', '_blank');
            const printStyles = `
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                    h1 { color: #1a73e8; text-align: center; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; color: #333; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
            `;
            printWindow.document.write(`
                <html>
                <head><title>Activity Log Print</title>${printStyles}</head>
                <body>
                    ${tableToPrint.outerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        });
    });

    const activityLogData = [];

    function logActivity(user, action, details, oldValue = null, newValue = null) {
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newId = activityLogData.length > 0 ? Math.max(...activityLogData.map(log => log.id)) + 1 : 1;

        // Push locally for immediate UI feedback
        activityLogData.unshift({
            id: newId,
            timestamp: timestamp,
            user: user,
            action: action,
            details: details,
            oldValue: oldValue,
            newValue: newValue
        });
        renderActivityLog();
        // Persist to backend
        try {
            fetch('Back-end/api/save-activity-log.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: new URLSearchParams({
                    user: user,
                    action: action,
                    details: details,
                    context: JSON.stringify({ oldValue, newValue })
                })
            }).catch(() => {});
        } catch (_) {}
    }

    function renderActivityLog() {
        if (!activityLogTableBody) return;
        activityLogTableBody.innerHTML = '';
        activityLogData.forEach(activity => {
            const row = activityLogTableBody.insertRow();
            row.innerHTML = `
                <td>${activity.timestamp}</td>
                <td>${activity.user}</td>
                <td>${activity.action}</td>
                <td>${activity.details}</td>
                <td class="activity-print-hide">
                    <button class="btn btn-secondary undo-activity-btn activity-print-hide" data-activity-id="${activity.id}" style="padding: 5px 10px;">
                        <i class="fas fa-undo"></i> Undo
                    </button>
                    <button class="action-btn delete-activity-btn activity-print-hide" data-activity-id="${activity.id}" data-activity-name="${activity.action} by ${activity.user}"></button>
                </td>
            `;
        });

        document.querySelectorAll('.undo-activity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const activityId = parseInt(e.currentTarget.dataset.activityId);
                const activity = activityLogData.find(act => act.id === activityId);
                if (activity) {
                    alert(`Attempting to undo activity ID: ${activity.id} - "${activity.action}" by ${activity.user}. (This would require backend logic)`);
                    logActivity('Admin', 'Attempted Undo Activity', `Attempted to undo: "${activity.action}" by ${activity.user} (ID: ${activity.id})`);
                }
            });
        });

        document.querySelectorAll('.delete-activity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const activityId = parseInt(e.currentTarget.dataset.activityId);
                const activityName = e.currentTarget.dataset.activityName;
                openConfirmDeleteModal(activityId, activityName, () => {
                    const index = activityLogData.findIndex(act => act.id === activityId);
                    if (index > -1) {
                        const deletedActivity = activityLogData.splice(index, 1)[0];
                        logActivity('Admin', 'Deleted Activity Log Entry', `Deleted log: "${deletedActivity.action}" by ${deletedActivity.user} (ID: ${deletedActivity.id})`, deletedActivity, null);
                        renderActivityLog();
                        alert('Activity log entry deleted successfully!');
                    }
                });
            });
        });
    }

    function openActivityDetailsModal(activity) {
        if (!activityDetailsModalOverlay) return;
        document.getElementById('activityDetailTimestamp').textContent = activity.timestamp;
        document.getElementById('activityDetailUser').textContent = activity.user;
        document.getElementById('activityDetailAction').textContent = activity.action;
        document.getElementById('activityDetailDetails').textContent = activity.details;

        activityDetailsModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeActivityDetailsModal() {
        if (activityDetailsModalOverlay) activityDetailsModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeActivityDetailsModalBtn) closeActivityDetailsModalBtn.addEventListener('click', closeActivityDetailsModal);
    if (closeActivityDetailsModalFooterBtn) closeActivityDetailsModalFooterBtn.addEventListener('click', closeActivityDetailsModal);
    if (activityDetailsModalOverlay) {
        activityDetailsModalOverlay.addEventListener('click', (e) => {
            if (e.target === activityDetailsModalOverlay) {
                closeActivityDetailsModal();
            }
        });
    }

    if (printActivityLogBtn) {
        printActivityLogBtn.addEventListener('click', () => {
            const tableToPrint = document.getElementById('activityLogTable') || document.getElementById('activityLogTableAdmin');
            if (!tableToPrint) return;
            const printWindow = window.open('', '_blank');

            const printStyles = `
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                    h1 { color: #1a73e8; text-align: center; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; color: #333; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .data-table th:nth-child(5),
                    .data-table td:nth-child(5),
                    .activity-print-hide {
                        display: none !important;
                    }
                </style>
            `;

            printWindow.document.write(`
                <html>
                <head>
                    <title>Activity Log Print</title>
                    ${printStyles}
                </head>
                <body>
                    <h1>Activity Log</h1>
                    ${tableToPrint.outerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        });
    }

    // Load existing logs from backend then render
    async function loadActivityLogs() {
        try {
            const res = await fetch('Back-end/api/get-activity-logs.php?ts=' + Date.now(), { cache: 'no-store' });
            const json = await res.json();
            if (json && json.ok && Array.isArray(json.data)) {
                activityLogData.length = 0;
                json.data.forEach(r => activityLogData.push({
                    id: r.id,
                    timestamp: r.timestamp,
                    user: r.user,
                    action: r.action,
                    details: r.details,
                    oldValue: null,
                    newValue: null
                }));
            }
            // If no logs yet, create a visible initial entry so UI proves connection
            if (activityLogData.length === 0) {
                try {
                    await fetch('Back-end/api/save-activity-log.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                        body: new URLSearchParams({ user: 'Admin', action: 'Opened Activity Logs', details: 'Initial entry' })
                    });
                    // Reload after seed
                    const res2 = await fetch('Back-end/api/get-activity-logs.php?ts=' + Date.now(), { cache: 'no-store' });
                    const json2 = await res2.json();
                    if (json2 && json2.ok && Array.isArray(json2.data)) {
                        json2.data.forEach(r => activityLogData.push({
                            id: r.id,
                            timestamp: r.timestamp,
                            user: r.user,
                            action: r.action,
                            details: r.details,
                            oldValue: null,
                            newValue: null
                        }));
                    }
                } catch (e) { console.warn('Activity log seed failed', e); }
            }
        } catch (e) { console.warn('Failed to load activity logs', e); }
        renderActivityLog();
    }

    // initial load
    loadActivityLogs();

    // expose reload for other flows if needed
    window.reloadAdminActivityLogs = loadActivityLogs;

    // --- Activity Logs filter tabs (Admin/Doctor/Patient) ---
    function setActivityFilter(active) {
        const tabs = Array.from(document.querySelectorAll('#activity-log-section .activity-tab'));
        const panels = {
            admin: document.getElementById('adminActivitiesContainer'),
            doctor: document.getElementById('doctorActivitiesContainer'),
            patient: document.getElementById('patientActivitiesContainer')
        };

        // Update old tab UI if present, but don't block panel switching if not
        if (tabs.length > 0) {
            tabs.forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.querySelector(`#activity-log-section .activity-tab[data-target="${active}ActivitiesContainer"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }

        // Hide all containers as baseline to avoid any stragglers
        document.querySelectorAll('#activity-log-section .activity-panel').forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
        });
        const panelToShow = panels[active];
        if (panelToShow) {
            panelToShow.classList.remove('hidden');
            panelToShow.style.display = 'block';
        }
    }

    // Event delegation scoped to the Activity Logs section, using closest() for robustness
    const activityLogSection = document.getElementById('activity-log-section');
    // Remove dropdown behavior (reverting to original design)

    // Default view on load
    // Remove tab/dropdown switching; original design shows all three sections

    // Also bind direct listeners to be extra robust on some browsers
    // Remove old direct button listeners (not used with dropdown)

    // --- Confirm Accept/Decline Modal ---
    const confirmActionModalOverlay = document.getElementById('confirmActionModalOverlay');
    const closeConfirmActionModalBtn = document.getElementById('closeConfirmActionModalBtn');
    const cancelConfirmActionBtn = document.getElementById('cancelConfirmActionBtn');
    const confirmActionButton = document.getElementById('confirmActionButton');
    const confirmActionModalTitle = document.getElementById('confirmActionModalTitle');
    const confirmActionMessage = document.getElementById('confirmActionMessage');

    let currentConfirmActionFunction = null;

    function openConfirmActionModal(patientId, patientName, actionType, actionFunction) {
        if (!confirmActionButton || !confirmActionModalTitle || !confirmActionMessage || !confirmActionModalOverlay) return;
        confirmActionButton.dataset.patientId = patientId;
        confirmActionButton.dataset.actionType = actionType;
        currentConfirmActionFunction = actionFunction;

        confirmActionButton.classList.remove('btn-primary-modal', 'btn-danger', 'btn-danger-confirm');

        if (actionType === 'accept') {
            confirmActionModalTitle.textContent = 'Confirm Acceptance';
            confirmActionMessage.innerHTML = `Are you sure you want to <strong style="color: #28a745;">accept</strong> the appointment for <strong style="color: #1a73e8;">${patientName}</strong>?`;
            confirmActionButton.classList.add('btn-primary-modal');
            confirmActionButton.textContent = 'Accept';
        } else if (actionType === 'decline') {
            confirmActionModalTitle.textContent = 'Confirm Decline';
            confirmActionMessage.innerHTML = `Are you sure you want to <strong style="color: #dc3545;">decline</strong> the appointment for <strong style="color: #1a73e8;">${patientName}</strong>?`;
            confirmActionButton.classList.add('btn-danger-confirm');
            confirmActionButton.textContent = 'Decline';
        }

        confirmActionModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeConfirmActionModal() {
        if (confirmActionModalOverlay) confirmActionModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        currentConfirmActionFunction = null;
    }

    if (closeConfirmActionModalBtn) closeConfirmActionModalBtn.addEventListener('click', closeConfirmActionModal);
    if (cancelConfirmActionBtn) cancelConfirmActionBtn.addEventListener('click', closeConfirmActionModal);
    if (confirmActionModalOverlay) {
        confirmActionModalOverlay.addEventListener('click', (e) => {
            if (e.target === confirmActionModalOverlay) {
                closeConfirmActionModal();
            }
        });
    }

    if (confirmActionButton) {
        confirmActionButton.addEventListener('click', () => {
            if (currentConfirmActionFunction) {
                currentConfirmActionFunction();
            }
            closeConfirmActionModal();
        });
    }

    // --- Confirm Delete Modal (Generic) ---
    // This modal is called by various delete buttons throughout the application.
    // Revert to dedicated delete modal elements
    // Delete modal (robust: uses dedicated modal if present, otherwise falls back to shared confirm modal)
    function getDeleteModalRefs() {
        let overlay = document.getElementById('confirmDeleteModalOverlay');
        let closeBtn = document.getElementById('closeConfirmDeleteModalBtn');
        let cancelBtn = document.getElementById('cancelDeleteBtn');
        let confirmBtn = document.getElementById('confirmDeleteBtn');
        let nameSpan = document.getElementById('deleteItemName');
        if (!overlay) {
            overlay = document.getElementById('confirmActionModalOverlay');
            closeBtn = document.getElementById('closeConfirmActionModalBtn');
            cancelBtn = document.getElementById('cancelConfirmActionBtn');
            confirmBtn = document.getElementById('confirmActionButton');
            nameSpan = document.getElementById('confirmActionMessage');
        }
        return { overlay, closeBtn, cancelBtn, confirmBtn, nameSpan };
    }

    let currentDeleteFunction = null;

    function openConfirmDeleteModal(itemId, itemName, deleteFunction) {
        const { overlay, confirmBtn, nameSpan } = getDeleteModalRefs();
        if (!overlay || !confirmBtn) return;
        // If we are using the shared confirm modal, write a friendly message text
        if (nameSpan) {
            if (nameSpan.tagName && nameSpan.tagName.toLowerCase() === 'p') {
                nameSpan.textContent = `Are you sure you want to delete "${itemName}"?`;
            } else {
                nameSpan.textContent = itemName;
            }
        }
        confirmBtn.dataset.itemId = itemId;
        currentDeleteFunction = deleteFunction;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        wireDeleteModalOnce();
    }

    function closeConfirmDeleteModal() {
        const { overlay } = getDeleteModalRefs();
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        currentDeleteFunction = null;
    }

    function wireDeleteModalOnce() {
        const { overlay, closeBtn, cancelBtn, confirmBtn } = getDeleteModalRefs();
        if (!overlay || overlay.dataset.bound) return;
        if (closeBtn) closeBtn.addEventListener('click', closeConfirmDeleteModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeConfirmDeleteModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeConfirmDeleteModal(); });
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (currentDeleteFunction) currentDeleteFunction();
                closeConfirmDeleteModal();
            });
        }
        overlay.dataset.bound = '1';
    }

    // --- Admin Editing Section ---
    const adminEditingArea = document.getElementById('adminEditingArea');
    const adminEditButtons = document.querySelectorAll('.admin-edit-btn');

    adminEditButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const externalLink = e.currentTarget.dataset.externalLink;
            const editType = e.currentTarget.dataset.editType;

            if (externalLink) {
                window.open(externalLink, '_blank');
            } else {
                loadAdminEditingContent(editType);
            }
        });
    });

    function loadAdminEditingContent(editType) {
        if (!adminEditingArea) return;
        adminEditingArea.innerHTML = `<h3>Manage ${editType.charAt(0).toUpperCase() + editType.slice(1)}</h3>`;
        let tableHtml = '';

        switch (editType) {
            case 'patients':
                tableHtml = `
                    <div class="admin-editing-table-container">
                        <table class="admin-editing-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${patientsData.map(patient => `
                                    <tr>
                                        <td>${patient.id}</td>
                                        <td>${patient.firstName} ${patient.lastName}</td>
                                        <td>${patient.phone}</td>
                                        <td>
                                            <button class="action-btn edit-item" data-id="${patient.id}" data-type="patient-edit"><i class="fas fa-edit"></i></button>
                                            <button class="action-btn delete-item" data-id="${patient.id}" data-name="${patient.firstName} ${patient.lastName}" data-type="patient-delete"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                break;
            case 'doctors':
                tableHtml = `
                    <div class="admin-editing-table-container">
                        <table class="admin-editing-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Specialization</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${doctorsData.map(doctor => `
                                    <tr>
                                        <td>${doctor.id}</td>
                                        <td>${doctor.name}</td>
                                        <td>${doctor.specialization}</td>
                                        <td>
                                            <button class="action-btn edit-item" data-id="${doctor.id}" data-type="doctor-edit"><i class="fas fa-edit"></i></button>
                                            <button class="action-btn delete-item" data-id="${doctor.id}" data-name="${doctor.name}" data-type="doctor-delete"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                break;
            case 'appointments':
                tableHtml = `
                    <div class="admin-editing-table-container">
                        <table class="admin-editing-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${appointments.map(appt => `
                                    <tr>
                                        <td>${appt.id}</td>
                                        <td>${appt.date} ${appt.time}</td>
                                        <td>${appt.patient}</td>
                                        <td>${appt.doctor}</td>
                                        <td>${appt.status}</td>
                                        <td>
                                            <button class="action-btn edit-item" data-id="${appt.id}" data-type="appointment-edit"><i class="fas fa-edit"></i></button>
                                            <button class="action-btn delete-item" data-id="${appt.id}" data-name="Appointment for ${appt.patient} on ${appt.date}" data-type="appointment-delete"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                break;
            case 'inventory':
                tableHtml = `
                    <div class="admin-editing-table-container">
                        <table class="admin-editing-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${inventoryItems.map(item => `
                                    <tr>
                                        <td>${item.id}</td>
                                        <td>${item.name}</td>
                                        <td>${item.quantity} ${item.unit}</td>
                                        <td>
                                            <button class="action-btn edit-item" data-id="${item.id}" data-type="inventory-edit"><i class="fas fa-edit"></i></button>
                                            <button class="action-btn delete-item" data-id="${item.id}" data-name="${item.name}" data-type="inventory-delete"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                break;
            case 'activity-log':
                tableHtml = `
                    <div class="admin-editing-table-container">
                        <table class="admin-editing-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activityLogData.map(log => `
                                    <tr>
                                        <td>${log.id}</td>
                                        <td>${log.timestamp}</td>
                                        <td>${log.user}</td>
                                        <td>${log.action}</td>
                                        <td>
                                            <button class="action-btn delete-item" data-id="${log.id}" data-name="Activity Log Entry ID ${log.id}" data-type="activity-log-delete"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                break;
            default:
                tableHtml = `<p>No editing options available for this type.</p>`;
        }
        adminEditingArea.insertAdjacentHTML('beforeend', tableHtml);

        // Attach event listeners using delegation or direct selection after HTML is added
        adminEditingArea.querySelectorAll('.edit-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type;
                if (type === 'patient-edit') {
                    const patient = patientsData.find(p => p.id === id);
                    if (patient) openViewEditModal(patient, true);
                } else if (type === 'doctor-edit') {
                    alert(`Edit Doctor functionality to be implemented for ID ${id}`);
                } else if (type === 'appointment-edit') {
                    alert(`Edit Appointment functionality to be implemented for ID ${id}`);
                } else if (type === 'inventory-edit') {
                    const item = inventoryItems.find(i => i.id == id); // Use == for type coercion
                    if (item) openEditInventoryItemModal(item);
                }
            });
        });

        adminEditingArea.querySelectorAll('.delete-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                const type = e.currentTarget.dataset.type;

                let deleteFunc;
                if (type === 'patient-delete') deleteFunc = () => deletePatient(id);
                else if (type === 'doctor-delete') deleteFunc = () => deleteDoctor(id);
                else if (type === 'appointment-delete') deleteFunc = () => deleteAppointment(id);
                else if (type === 'inventory-delete') deleteFunc = () => deleteInventoryItem(id);
                else if (type === 'activity-log-delete') deleteFunc = () => deleteActivityLogEntry(id);

                if (deleteFunc) openConfirmDeleteModal(id, name, deleteFunc);
            });
        });
    }

    // Helper functions for deletion (to be called by openConfirmDeleteModal)
    function deletePatient(patientId) {
        const index = patientsData.findIndex(p => p.id === patientId);
        if (index > -1) {
            const deletedPatient = patientsData.splice(index, 1)[0];
            logActivity('Admin', 'Deleted Patient (Admin)', `Patient: ${deletedPatient.firstName} ${deletedPatient.lastName} (ID: ${deletedPatient.id})`, deletedPatient, null);
            renderPatientCards();
            renderPatientTable();
            loadAdminEditingContent('patients');
            alert('Patient deleted successfully!');
        }
    }

    function deleteDoctor(doctorId) {
        const index = doctorsData.findIndex(d => d.id === doctorId);
        if (index > -1) {
            const deletedDoctor = doctorsData.splice(index, 1)[0];
            logActivity('Admin', 'Deleted Doctor (Admin)', `Doctor: ${deletedDoctor.name} (ID: ${deletedDoctor.id})`, deletedDoctor, null);
            renderDoctorCards();
            loadAdminEditingContent('doctors');
            alert('Doctor deleted successfully!');
        }
    }

    function deleteAppointment(appointmentId) {
        const index = appointments.findIndex(a => a.id == appointmentId);
        if (index > -1) {
            const deletedAppointment = appointments.splice(index, 1)[0];
            logActivity('Admin', 'Deleted Appointment (Admin)', `Appointment for ${deletedAppointment.patient} on ${deletedAppointment.date} (ID: ${deletedAppointment.id})`, deletedAppointment, null);
            renderAppointmentOverview();
            loadAdminEditingContent('appointments');
            alert('Appointment deleted successfully!');
        }
    }

    function deleteInventoryItem(itemId) {
        const index = inventoryItems.findIndex(item => item.id == itemId);
        if (index > -1) {
            const deletedItem = inventoryItems.splice(index, 1)[0];
            logActivity('Admin', 'Deleted Inventory Item (Admin)', `Item: ${deletedItem.name} (ID: ${deletedItem.id})`, deletedItem, null);
            renderInventoryTable();
            loadAdminEditingContent('inventory');
            alert('Inventory item deleted successfully!');
        }
    }

    function deleteActivityLogEntry(logId) {
        const index = activityLogData.findIndex(log => log.id == logId);
        if (index > -1) {
            const deletedLog = activityLogData.splice(index, 1)[0];
            renderActivityLog();
            loadAdminEditingContent('activity-log');
            alert('Activity log entry deleted successfully!');
        }
    }

    // --- Admin Settings Form Submission ---
    const adminSettingsForm = document.getElementById('adminSettingsForm');
    if (adminSettingsForm) {
        adminSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const adminSettings = {};
            formData.forEach((value, key) => {
                adminSettings[key] = value;
            });

            console.log('Admin Settings Saved:', adminSettings);
            logActivity('Admin', 'Updated Admin Settings', 'Clinic information, system customization, and user management settings updated.', null, adminSettings);
            alert('Admin settings saved successfully!');
        });
    }

    // --- Print Inventory Functionality ---
    const printInventoryBtn = document.getElementById('printInventoryBtn');
    if (printInventoryBtn) {
        printInventoryBtn.addEventListener('click', () => {
            const tableToPrint = document.getElementById('inventoryTable');
            if (!tableToPrint) return;
            const printWindow = window.open('', '_blank');

            const printStyles = `
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                    h1 { color: #1a73e8; text-align: center; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; color: #333; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .data-table th:last-child,
                    .data-table td:last-child {
                        display: none;
                    }
                </style>
            `;

            printWindow.document.write(`
                <html>
                <head>
                    <title>Inventory Report</title>
                    ${printStyles}
                </head>
                <body>
                    <h1>Inventory Report</h1>
                    ${tableToPrint.outerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        });
    }

    // --- Admin Note functionality ---
    const adminNoteTextarea = document.getElementById('adminNote');
    const saveAdminNoteBtn = document.getElementById('saveAdminNoteBtn');

    const savedAdminNote = localStorage.getItem('adminPatientAppointmentsNote');
    if (adminNoteTextarea && savedAdminNote) {
        adminNoteTextarea.value = savedAdminNote;
    }

    if (saveAdminNoteBtn) {
        saveAdminNoteBtn.addEventListener('click', () => {
            if (!adminNoteTextarea) return;
            const noteContent = adminNoteTextarea.value;
            localStorage.setItem('adminPatientAppointmentsNote', noteContent);
            logActivity('Admin', 'Updated Admin Note', 'Patient Appointments Admin Note updated.', null, { note: noteContent });
            alert('Admin note saved successfully!');
        });
    }

    // --- Report Generation Section ---
    const reportForm = document.getElementById('reportForm');
    const reportFile = document.getElementById('reportFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    if (reportFile) {
        reportFile.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileNameDisplay.textContent = `Selected file: ${this.files[0].name}`;
            } else {
                fileNameDisplay.textContent = 'No file uploaded';
            }
        });
    }

    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const reportTitle = document.getElementById('reportTitle').value;
            const reportComments = document.getElementById('reportComments').value;
            const uploadedFile = reportFile.files.length > 0 ? reportFile.files[0].name : 'No file uploaded';

            // Simulate report submission
            console.log('Report Submitted:');
            console.log('Title:', reportTitle);
            console.log('Comments:', reportComments);
            console.log('File:', uploadedFile);

            logActivity('Admin', 'Generated Report', `Report Title: "${reportTitle}", File: "${uploadedFile}"`, null, { title: reportTitle, comments: reportComments, file: uploadedFile });

            alert('Report submitted successfully!');
            reportForm.reset();
            fileNameDisplay.textContent = 'No file selected';
        });
    }
});