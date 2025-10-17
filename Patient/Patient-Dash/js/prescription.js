// Prescription and file preview modal

document.addEventListener('DOMContentLoaded', () => {
    const prescriptionModal = document.getElementById('prescriptionModal');
    const prescriptionBtnDesktop = document.getElementById('prescriptionBtnDesktop');
    const prescriptionBtnMobile = document.getElementById('prescriptionBtnMobile');
    const prescriptionLinkMobile = document.getElementById('prescriptionLinkMobile');
    const closePrescriptionModalBtn = document.getElementById('closePrescriptionModalBtn');
    const fileViewModal = document.getElementById('fileViewModal');
    const fileViewModalTitle = document.getElementById('fileViewModalTitle');
    const fileContent = document.getElementById('fileContent');
    const closeFileViewModalBtn = document.getElementById('closeFileViewModalBtn');
    const prescriptionList = document.querySelector('#prescriptionModal .medical-history-list');

    function showPrescriptionModal() { 
        console.log('showPrescriptionModal called'); // Debug
        if (prescriptionModal) {
            console.log('prescriptionModal found, loading prescriptions'); // Debug
            loadPrescriptions();
            prescriptionModal.classList.add('active'); 
            console.log('prescriptionModal should now be visible'); // Debug
        } else {
            console.error('prescriptionModal element not found!'); // Debug
        }
    }
    function hidePrescriptionModal() { if (prescriptionModal) prescriptionModal.classList.remove('active'); }
    function showFileViewModal() { if (fileViewModal) fileViewModal.classList.add('active'); }
    function hideFileViewModal() { if (fileViewModal) fileViewModal.classList.remove('active'); }

    // Load prescriptions from database
    function loadPrescriptions() {
        console.log('loadPrescriptions called'); // Debug
        console.log('prescriptionList element:', prescriptionList); // Debug
        
        if (!prescriptionList) {
            console.error('prescriptionList element not found! Looking for .medical-history-list');
            // Try to find the list by different selectors
            const altList = document.querySelector('#prescriptionModal .medical-history-list');
            console.log('Alternative list selector:', altList);
            return;
        }
        
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
        
        console.log('Patient email from storage:', patientEmail); // Debug log
        
        if (!patientEmail) {
            console.error('Patient email not found in localStorage, sessionStorage, or URL params');
            console.log('localStorage userEmail:', localStorage.getItem('userEmail'));
            console.log('sessionStorage userEmail:', sessionStorage.getItem('userEmail'));
            prescriptionList.innerHTML = '<li class="medical-history-item"><div class="medical-history-details"><p>Error: Patient email not found. Please log in again.</p></div></li>';
            return;
        }

        // Clear existing prescriptions
        prescriptionList.innerHTML = '<li class="medical-history-item"><div class="medical-history-details"><p>Loading prescriptions...</p></div></li>';

        const apiUrl = `../../Doc-Dash/Back-end/api/list-prescriptions.php?patient_email=${encodeURIComponent(patientEmail)}`;
        console.log('Fetching prescriptions from:', apiUrl); // Debug log

        // Fetch prescriptions from API
        fetch(apiUrl)
            .then(response => {
                console.log('API Response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('API Response data:', data); // Debug log
                
                if (data.success && data.data && data.data.length > 0) {
                    console.log('Found', data.data.length, 'prescriptions, clearing list and adding items'); // Debug
                    prescriptionList.innerHTML = ''; // Clear loading message
                    data.data.forEach((prescription, index) => {
                        console.log(`Processing prescription ${index + 1}:`, prescription); // Debug log
                        const prescriptionItem = createPrescriptionItem(prescription);
                        console.log('Created prescription item:', prescriptionItem); // Debug
                        prescriptionList.appendChild(prescriptionItem);
                        console.log('Appended prescription item to list'); // Debug
                    });
                    console.log('Final prescriptionList innerHTML:', prescriptionList.innerHTML); // Debug
                } else {
                    // Show message if no prescriptions
                    const message = data.message || 'No prescriptions available yet.';
                    console.log('No prescriptions found, showing message:', message); // Debug
                    prescriptionList.innerHTML = `<li class="medical-history-item"><div class="medical-history-details"><p>${message}</p></div></li>`;
                }
            })
            .catch(error => {
                console.error('Error loading prescriptions:', error);
                prescriptionList.innerHTML = '<li class="medical-history-item"><div class="medical-history-details"><p>Error loading prescriptions. Please try again later.</p></div></li>';
            });
    }

    // Create prescription item element
    function createPrescriptionItem(prescription) {
        const li = document.createElement('li');
        li.className = 'medical-history-item prescription-file-item';
        li.dataset.file = prescription.file_path;
        li.dataset.prescriptionId = prescription.id;
        
        const fileIcon = prescription.file_type.includes('pdf') ? 'fas fa-file-pdf' : 'fas fa-file-image';
        const formattedDate = new Date(prescription.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        li.innerHTML = `
            <i class="${fileIcon} medical-history-icon text-blue-500"></i>
            <div class="medical-history-details">
                <div><strong>Prescription - ${prescription.doctor_name}</strong></div>
                <div class="medical-history-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</div>
                ${prescription.description ? `<div class="text-sm text-gray-600 mt-1">${prescription.description}</div>` : ''}
            </div>
        `;
        
        // Add click event listener - using same logic as doctor dashboard
        li.addEventListener('click', function() {
            const fileName = this.dataset.file;
            if (!fileName || !fileViewModalTitle || !fileContent) return;
            
            fileViewModalTitle.textContent = `${prescription.file_name}`;
            
            // Extract file extension more reliably (same as doctor dashboard)
            var fileNameOnly = fileName.split('/').pop();
            var fileExtension = fileNameOnly.split('.').pop().toLowerCase();
            console.log('Patient viewing file:', fileName, 'Extension:', fileExtension);
            
            if (fileExtension === 'pdf') {
                fileContent.innerHTML = `<iframe src="${fileName}" width="100%" height="500px" style="border:none;"></iframe>`;
            } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(fileExtension)) {
                fileContent.innerHTML = `<img src="${fileName}" alt="Prescription Image" class="max-w-full h-auto mx-auto">`;
            } else {
                // For any other file type, try to show as image first, then fallback
                fileContent.innerHTML = `<img src="${fileName}" alt="Prescription File" class="max-w-full h-auto mx-auto" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display:none; text-align:center; padding:20px;">
                        <p class="text-gray-600">Preview not available for this file type.</p>
                        <p class="text-sm text-gray-500">File: ${fileNameOnly}</p>
                        <p class="text-sm text-gray-500">Extension: ${fileExtension}</p>
                    </div>`;
            }
            
            hidePrescriptionModal();
            showFileViewModal();
        });
        
        return li;
    }

    if (prescriptionBtnDesktop) prescriptionBtnDesktop.addEventListener('click', (e) => { 
        e.preventDefault(); 
        console.log('Desktop prescription button clicked'); // Debug
        showPrescriptionModal(); 
    });
    
    if (prescriptionBtnMobile) prescriptionBtnMobile.addEventListener('click', (e) => { 
        e.preventDefault(); 
        console.log('Mobile prescription button clicked'); // Debug
        showPrescriptionModal(); 
        if (typeof toggleMobileMenu === 'function') {
            toggleMobileMenu();
        }
    });
    
    if (prescriptionLinkMobile) prescriptionLinkMobile.addEventListener('click', (e) => { 
        e.preventDefault(); 
        console.log('Mobile prescription link clicked'); // Debug
        showPrescriptionModal(); 
    });
    if (closePrescriptionModalBtn) closePrescriptionModalBtn.addEventListener('click', hidePrescriptionModal);
    if (closeFileViewModalBtn) closeFileViewModalBtn.addEventListener('click', hideFileViewModal);
    if (prescriptionModal) prescriptionModal.addEventListener('click', (event) => { if (event.target === prescriptionModal) hidePrescriptionModal(); });
    if (fileViewModal) fileViewModal.addEventListener('click', (event) => { if (event.target === fileViewModal) hideFileViewModal(); });
});


