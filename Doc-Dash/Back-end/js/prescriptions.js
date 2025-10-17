(function(){
	var uploadForm = document.getElementById('uploadPrescriptionForm');
	var patientSelect = document.getElementById('prescriptionPatientSelect');
	var gmailInput = document.getElementById('prescriptionGmail');
	var fileInput = document.getElementById('prescriptionFile');
	var listEl = document.getElementById('uploadedPrescriptionsList');
	var viewerOverlay = document.getElementById('prescriptionViewerModalOverlay');
	var viewerCloseBtn = document.getElementById('closePrescriptionViewerModalBtn');
	var viewerIframe = document.getElementById('prescriptionViewerIframe');

    // Load patients for prescription from patient_details table
    window.populatePrescriptionPatientSelect = function(){
        if (!patientSelect) return;

        // Hide the raw select (we'll sync value to it) and add a professional typeahead UI
        try { patientSelect.style.display = 'none'; } catch(_) {}

        // Container for the typeahead
        var wrapperId = 'prescriptionPatientTypeaheadWrapper';
        var wrapper = document.getElementById(wrapperId);
        if (!wrapper && patientSelect.parentNode) {
            wrapper = document.createElement('div');
            wrapper.id = wrapperId;
            wrapper.style.position = 'relative';
            patientSelect.parentNode.insertBefore(wrapper, patientSelect);
            wrapper.appendChild(patientSelect); // keep select inside for form compatibility
        }

        // Build search input
        var searchId = 'prescriptionPatientSearch';
        var searchInput = document.getElementById(searchId);
        if (!searchInput) {
            searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.id = searchId;
            searchInput.placeholder = 'Search patient name or ID';
            searchInput.className = 'input-field';
            wrapper.insertBefore(searchInput, patientSelect);
        }

        // Suggestions dropdown
        var listId = 'prescriptionPatientSuggestions';
        var list = document.getElementById(listId);
        if (!list) {
            list = document.createElement('div');
            list.id = listId;
            list.setAttribute('role', 'listbox');
            list.style.position = 'absolute';
            list.style.left = '0';
            list.style.right = '0';
            list.style.top = '100%';
            list.style.zIndex = '1200';
            list.style.background = '#ffffff';
            list.style.border = '1px solid #e5e7eb';
            list.style.borderRadius = '10px';
            list.style.boxShadow = '0 10px 24px rgba(0,0,0,0.10)';
            list.style.marginTop = '6px';
            list.style.maxHeight = '260px'; // ~5-6 items tall, scrollable
            list.style.overflowY = 'auto';
            list.style.display = 'none';
            wrapper.appendChild(list);
        }

        var activeIndex = -1; // for keyboard navigation

        function renderSuggestions(items){
            activeIndex = -1;
            list.innerHTML = '';
            if (!items || items.length === 0) { list.style.display = 'none'; return; }
            items.forEach(function(p, idx){
                var row = document.createElement('div');
                row.setAttribute('role','option');
                row.tabIndex = 0;
                row.style.padding = '10px 12px';
                row.style.cursor = 'pointer';
                row.style.display = 'flex';
                row.style.flexDirection = 'column';
                row.style.borderBottom = '1px solid #f1f5f9';
                row.onmouseenter = function(){ highlight(idx); };
                row.onmouseleave = function(){ unhighlight(idx); };
                row.innerHTML = '<div style="font-weight:600;color:#202124">' + (p.full_name || '') + '</div>' +
                                '<div style="font-size:12px;color:#6b7280;margin-top:2px">' + (p.formatted_id || '') + (p.email ? ' • ' + p.email : '') + '</div>';
                row.addEventListener('click', function(){ selectPatient(p); });
                row.addEventListener('keydown', function(e){ if (e.key === 'Enter') selectPatient(p); });
                list.appendChild(row);
            });
            list.style.display = 'block';
        }

        function highlight(i){
            var children = Array.from(list.children);
            children.forEach(function(el, idx){ el.style.background = (idx === i ? 'rgba(26,115,232,0.08)' : '#ffffff'); });
            activeIndex = i;
        }

        function unhighlight(i){
            var children = Array.from(list.children);
            if (children[i]) children[i].style.background = '#ffffff';
            activeIndex = -1;
        }

        function selectPatient(p){
            // Set hidden select value
            var existing = Array.from(patientSelect.options).find(function(o){ return o.value === String(p.patient_id); });
            if (!existing) {
                var opt = document.createElement('option');
                opt.value = String(p.patient_id);
                opt.textContent = p.display_text || (p.formatted_id + ' ' + p.full_name);
                patientSelect.appendChild(opt);
            }
            patientSelect.value = String(p.patient_id);
            searchInput.value = p.full_name + ' (' + p.formatted_id + ')';
            // Also reflect in prescription Full Name / Patient ID fields if present on the page
            try {
                var fullNameInput = document.getElementById('patientName');
                if (fullNameInput) fullNameInput.value = p.full_name || '';
                var numericIdInput = document.getElementById('patientId');
                if (numericIdInput) numericIdInput.value = p.formatted_id || '';
            } catch(_) {}
            list.style.display = 'none';
        }

        fetch('/4care/Doc-Dash/Back-end/api/get-patients-for-prescription.php')
		.then(response => response.json())
		.then(result => {
			if (result.success) {
                // Cache full list for client-side filtering
                window._prescriptionPatientsDataCache = Array.isArray(result.data) ? result.data : [];

                // Build hidden options once for form submission
                while (patientSelect.firstChild) patientSelect.removeChild(patientSelect.firstChild);
                window._prescriptionPatientsDataCache.forEach(function(p){
                    var opt = document.createElement('option');
                    opt.value = String(p.patient_id);
                    opt.textContent = p.display_text || (p.formatted_id + ' ' + p.full_name);
                    opt.setAttribute('data-email', p.email || '');
                    patientSelect.appendChild(opt);
                });

                // Show top suggestions initially
                renderSuggestions(window._prescriptionPatientsDataCache);

                // Wire up live filtering and keyboard control
                searchInput.addEventListener('focus', function(){ renderSuggestions(window._prescriptionPatientsDataCache); });
                searchInput.addEventListener('input', function(){
                    var q = (searchInput.value || '').toLowerCase();
                    var data = window._prescriptionPatientsDataCache || [];
                    var filtered = !q ? data : data.filter(function(p){
                        return (
                            String(p.full_name || '').toLowerCase().includes(q) ||
                            String(p.formatted_id || '').toLowerCase().includes(q)
                        );
                    });
                    renderSuggestions(filtered);
                });
                document.addEventListener('click', function(e){ if (list && !wrapper.contains(e.target)) list.style.display = 'none'; });

                // Keyboard navigation for list with ArrowUp/ArrowDown/Enter
                searchInput.addEventListener('keydown', function(e){
                    var items = Array.from(list.children);
                    if (!items.length || list.style.display === 'none') return;
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        activeIndex = (activeIndex + 1) % items.length;
                        highlight(activeIndex);
                        items[activeIndex].scrollIntoView({ block: 'nearest' });
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        activeIndex = (activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
                        highlight(activeIndex);
                        items[activeIndex].scrollIntoView({ block: 'nearest' });
                    } else if (e.key === 'Enter' && activeIndex >= 0) {
                        e.preventDefault();
                        var data = window._prescriptionPatientsDataCache || [];
                        var q = (searchInput.value || '').toLowerCase();
                        var filtered = !q ? data : data.filter(function(p){
                            return (
                                String(p.full_name || '').toLowerCase().includes(q) ||
                                String(p.formatted_id || '').toLowerCase().includes(q)
                            );
                        });
                        var picked = filtered[activeIndex];
                        if (picked) selectPatient(picked);
                    }
                });
			}
		})
		.catch(error => console.error('Error loading patients:', error));
	};

	// Load Gmail addresses from patient_signup table
	window.populatePrescriptionGmailSelect = function(){
		if (!gmailInput) return;
		
		fetch('/4care/Doc-Dash/Back-end/api/get-patient-emails.php')
		.then(response => response.json())
		.then(result => {
			if (result.success) {
				// Clear existing options except the default
		var keep = gmailInput.querySelectorAll('option:not([value=""])');
		Array.prototype.forEach.call(keep, function(option){ option.remove(); });
				
				// Add Gmail addresses with patient names
				result.data.forEach(function(patient){
				var opt = document.createElement('option'); 
					opt.value = patient.email;
					opt.textContent = patient.full_display;
				gmailInput.appendChild(opt); 
				});
			}
		})
		.catch(error => console.error('Error loading emails:', error));
	};

	// Load uploaded prescriptions list
	function loadUploadedPrescriptions() {
		if (!listEl) return;
		
		listEl.innerHTML = '<div class="loading-message">Loading uploaded prescriptions...</div>';
		
		fetch('/4care/Doc-Dash/Back-end/api/get-uploaded-prescriptions.php')
		.then(response => response.json())
		.then(result => {
			if (result.success) {
				if (result.data.length === 0) {
					listEl.innerHTML = '<div class="no-prescriptions-message" style="text-align: center; color: #666; padding: 20px; font-style: italic;">No prescriptions uploaded yet.</div>';
					return;
				}
				
				// Build prescriptions HTML
				var prescriptionsHtml = '<div class="uploaded-prescriptions-grid">';
				result.data.forEach(function(prescription) {
					var statusClass = prescription.sent_status === 'sent' ? 'status-sent' : 'status-pending';
					var statusText = prescription.sent_status === 'sent' ? 'Sent' : 'Pending';
					var statusIcon = prescription.sent_status === 'sent' ? 'fa-check-circle' : 'fa-clock';
					
					prescriptionsHtml += `
						<div class="uploaded-file-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9f9f9;">
							<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
								<div style="flex: 1;">
									<h5 style="margin: 0 0 5px 0; color: #1a73e8; font-size: 16px;">
										<i class="fas fa-prescription-bottle-alt" style="margin-right: 5px;"></i>
										Prescription #${prescription.id}
									</h5>
									<p style="margin: 0; color: #666; font-size: 14px;">
										<strong>Patient:</strong> ${prescription.patient_name}
									</p>
									<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
										<strong>Email:</strong> ${prescription.patient_email}
									</p>
								</div>
								<div style="text-align: right;">
									<span class="prescription-status ${statusClass}" style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; background: ${prescription.sent_status === 'sent' ? '#4CAF50' : '#FF9800'};">
										<i class="fas ${statusIcon}" style="margin-right: 3px;"></i>
										${statusText}
									</span>
								</div>
							</div>
							<div style="margin-bottom: 10px;">
								<p style="margin: 0; font-size: 14px; color: #333;">
									<strong>Doctor:</strong> ${prescription.doctor_name}
								</p>
								<p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
									<strong>Prescribed:</strong> ${prescription.formatted_prescribed_date}
								</p>
								<p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
									<strong>Uploaded:</strong> ${prescription.formatted_date}
								</p>
							</div>
							${prescription.prescription_url ? `
								<div style="margin-top: 10px;">
									<button onclick="openViewer('${prescription.prescription_url}'); return false;" class="btn btn-primary view-prescription-btn">
										<i class="fas fa-eye" style="margin-right: 5px;"></i>
										View Prescription
									</button>
								</div>
							` : ''}
						</div>
					`;
				});
				prescriptionsHtml += '</div>';
				
				listEl.innerHTML = prescriptionsHtml;
			} else {
				listEl.innerHTML = '<div class="error-message" style="color: #f44336; text-align: center; padding: 20px;">Error loading prescriptions: ' + result.message + '</div>';
			}
		})
		.catch(error => {
			console.error('Error loading uploaded prescriptions:', error);
			listEl.innerHTML = '<div class="error-message" style="color: #f44336; text-align: center; padding: 20px;">Error loading prescriptions. Please try again.</div>';
		});
	}

	// Initialize dropdowns and load prescriptions when script loads
	if (typeof window.populatePrescriptionPatientSelect === 'function') {
		window.populatePrescriptionPatientSelect();
	}
	if (typeof window.populatePrescriptionGmailSelect === 'function') {
		window.populatePrescriptionGmailSelect();
	}
	
	// Load uploaded prescriptions
	if (document.getElementById('uploadedPrescriptionsList')) {
		loadUploadedPrescriptions();
	}

	// Sync patient selection with Gmail selection
	if (patientSelect && gmailInput) {
		patientSelect.addEventListener('change', function(){
			var selectedId = this.value;
			var patientsData = (window.DocDash && window.DocDash.patientsData) ? window.DocDash.patientsData : [];
			var selectedPatient = patientsData.find(function(p){ return p.id === selectedId; });
			if (selectedPatient && selectedPatient.email) {
				gmailInput.value = selectedPatient.email;
			} else {
				gmailInput.value = '';
			}
		});
	}

	// Updated viewer functions to match Patient Dashboard style
	function openViewer(url) {
		var fileViewModal = document.getElementById('fileViewModal');
		var fileViewModalTitle = document.getElementById('fileViewModalTitle');
		var fileContent = document.getElementById('fileContent');
		
		if (!fileViewModal || !fileContent) return;
		
		// Set modal title
		if (fileViewModalTitle) {
			fileViewModalTitle.textContent = 'View Prescription';
		}
		
		// Determine if it's an image or PDF and load content
		var lower = url.toLowerCase();
		console.log('Opening file URL:', url, 'Lowercase:', lower); // Debug log
		
		// Extract file extension more reliably
		var fileName = url.split('/').pop();
		var fileExtension = fileName.split('.').pop().toLowerCase();
		console.log('File name:', fileName, 'Extension:', fileExtension); // Debug log
		
		if (fileExtension === 'pdf') {
			fileContent.innerHTML = `<iframe src="${url}" width="100%" height="500px" style="border:none;"></iframe>`;
		} else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(fileExtension)) {
			fileContent.innerHTML = `<img src="${url}" alt="Prescription Image" class="max-w-full h-auto mx-auto">`;
		} else {
			// For any other file type, try to show as image first, then fallback
			fileContent.innerHTML = `<img src="${url}" alt="Prescription File" class="max-w-full h-auto mx-auto" 
				onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
				<div style="display:none; text-align:center; padding:20px;">
					<p class="text-gray-600">Preview not available for this file type.</p>
					<p class="text-sm text-gray-500">File: ${fileName}</p>
					<p class="text-sm text-gray-500">Extension: ${fileExtension}</p>
				</div>`;
		}
		
		// Show modal with Patient Dashboard style
		fileViewModal.classList.add('active');
		document.body.style.overflow = 'hidden';
	}
	
	// Make openViewer globally available
	window.openViewer = openViewer;
	
	function closeViewer() {
		var fileViewModal = document.getElementById('fileViewModal');
		var fileContent = document.getElementById('fileContent');
		
		if (fileViewModal) {
			fileViewModal.classList.remove('active');
		}
		if (fileContent) {
			fileContent.innerHTML = '<p class="text-gray-600">Loading file...</p>';
		}
		document.body.style.overflow = '';
	}
	
	// Event listeners for the new modal
	var closeBtn = document.getElementById('closeFileViewModalBtn');
	if (closeBtn) closeBtn.addEventListener('click', closeViewer);
	
	var fileViewModal = document.getElementById('fileViewModal');
	if (fileViewModal) {
		fileViewModal.addEventListener('click', function(e) {
			if (e.target === fileViewModal) closeViewer();
		});
	}

	function addViewListener(btn){ btn.addEventListener('click', function(e){ var url = e.currentTarget.dataset.fileUrl; openViewer(url); }); }
	var exampleBtn = document.querySelector('.uploaded-file-item .view-prescription-btn'); if (exampleBtn) addViewListener(exampleBtn);

	if (uploadForm) uploadForm.addEventListener('submit', function(e){
		e.preventDefault();
		var selectedId = patientSelect ? patientSelect.value : '';
		var gmail = gmailInput ? gmailInput.value.trim() : '';
		var file = fileInput ? fileInput.files[0] : null;
		
		// Validation
		if (!selectedId) { alert('Please select a patient.'); return; }
		if (!file) { alert('Please select a prescription file to upload.'); return; }
		
		// Determine upload type
		var uploadType = gmail ? 'both' : 'doctor_only'; // 'both' = doctor + patient, 'doctor_only' = doctor only
		
		// Convert selectedId to match DocDash.patientsData format (pat + number)
		var patId = 'pat' + selectedId;
		var p = (window.DocDash && window.DocDash.patientsData) ? window.DocDash.patientsData.find(function(x){ return x.id === patId; }) : null;
		if (p) {
			// Create FormData for file upload
			var formData = new FormData();
			formData.append('patient_id', selectedId);
			formData.append('patient_email', gmail || ''); // Can be empty for doctor-only uploads
			formData.append('upload_type', uploadType); // 'both' or 'doctor_only'
			formData.append('doctor_name', 'Dr. ' + (window.DocDash && window.DocDash.doctorName ? window.DocDash.doctorName : 'Unknown'));
			formData.append('file_name', file.name);
			formData.append('file_type', file.type);
			formData.append('file_size', file.size);
			formData.append('description', 'Prescription uploaded by doctor');
			formData.append('prescription_file', file); // Add the actual file
			
			// Send to API
			fetch('/4care/Doc-Dash/Back-end/api/save-prescription.php', {
				method: 'POST',
				body: formData
			})
			.then(function(response) { return response.json(); })
			.then(function(result) {
				if (result.success) {
					var message = 'Prescription "' + file.name + '" uploaded successfully for ' + p.firstName + ' ' + p.lastName;
					if (uploadType === 'both') {
						message += '! Sent to patient account: ' + gmail;
					} else {
						message += '! (Doctor dashboard only - no patient email provided)';
					}
					alert(message);
					
					if (window.DocDash && typeof window.DocDash.logActivity === 'function') {
						window.DocDash.logActivity('Doctor','Uploaded Prescription','Patient: ' + p.firstName + ' ' + p.lastName + ', File: ' + file.name + ', Type: ' + uploadType, null, { patientId: p.id, fileName: file.name, uploadType: uploadType });
					}
					// Refresh the uploaded prescriptions list from database
					loadUploadedPrescriptions();
					uploadForm.reset();
				} else {
					alert('Error uploading prescription: ' + result.message);
				}
			})
			.catch(function(error) {
				console.error('Error:', error);
				alert('Error uploading prescription. Please try again.');
			});
		} else {
			alert('Selected patient not found.');
		}
	});

})();


