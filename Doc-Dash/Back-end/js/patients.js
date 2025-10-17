// Patients module
(function(){
	window.DocDash = window.DocDash || {};

	var patientCardGrid = document.getElementById('patientCardGrid');
	var patientDetailsTitle = document.getElementById('patientDetailsTitle');
	var patientProfileDetails = document.getElementById('patientProfileDetails');
	var patientSearchInput = document.getElementById('patientSearchInput');
	var patientSearchIcon = document.getElementById('patientSearchIcon');
	var patientDetailHealthTimeline = document.getElementById('patientDetailHealthTimeline');
	console.log('patientDetailHealthTimeline element found:', patientDetailHealthTimeline); // Debug log
	var saveTimelineBtn = document.getElementById('saveTimelineBtn');

	var patientsData = window.DocDash.patientsData || [];
	window.DocDash.patientsData = patientsData;

	async function loadPatientsFromDatabase() {
		try {
			var response = await fetch('/4care/Doc-Dash/Back-end/api/get-patients.php');
			var result = await response.json();
			if (result.success) {
				patientsData.length = 0;
				Array.prototype.push.apply(patientsData, result.data);
				renderPatientCards();
			} else {
				console.error('Error loading patients:', result.message);
			}
		} catch (e) {
			console.error('Error loading patients:', e);
		}
	}
	window.DocDash.loadPatientsFromDatabase = loadPatientsFromDatabase;

	function renderPatientCards(filter) {
		filter = filter || '';
		if (!patientCardGrid) return;
		patientCardGrid.innerHTML = '';
		var filtered = patientsData.filter(function(p){
			return p.firstName.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
				p.lastName.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
				String(p.phone).indexOf(filter) !== -1;
		});
		filtered.forEach(function(patient){
			var card = document.createElement('div');
			card.classList.add('patient-card');
			card.dataset.patientId = patient.id;
			
			// Format patient ID as #00001, #00002, etc.
			var formattedPatientId = '#' + String(patient.patient_id || 0).padStart(5, '0');
			
			card.innerHTML = `
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
			patientCardGrid.appendChild(card);
			card.addEventListener('click', function(){ openPatientDetails(patient.id); });
		});
	}
	window.DocDash.renderPatientCards = renderPatientCards;

	var currentPatientId = null;
	async function loadHealthTimelineForPatient(patientId) {
		try {
			// patientId may be 'pat123' or raw number (123). Normalize to numeric id.
			var actualId = /^(pat)?(\d+)$/.test(String(patientId)) ? String(patientId).replace('pat', '') : String(patientId);
			currentPatientId = patientId;
			console.log('Loading health timeline for patient:', patientId, 'actual ID:', actualId); // Debug log
			
			var response = await fetch('/4care/Doc-Dash/Back-end/api/get-health-timeline.php?patient_id=' + encodeURIComponent(actualId));
			var result = await response.json();
			console.log('Health timeline API response:', result); // Debug log
			
		// Re-find the element in case it wasn't available when script first loaded
		patientDetailHealthTimeline = document.getElementById('patientDetailHealthTimeline');
		
		if (!patientDetailHealthTimeline) {
			console.error('patientDetailHealthTimeline element not found!'); // Debug log
			console.error('Available timeline elements:', document.querySelectorAll('[id*="timeline"]')); // Debug log
			return;
		}
		
		console.log('Found patientDetailHealthTimeline element, clearing content'); // Debug log
		patientDetailHealthTimeline.innerHTML = '';
		if (result.success && result.data.length > 0) {
			console.log('Found', result.data.length, 'timeline entries'); // Debug log
			result.data.forEach(function(entry){
				var li = document.createElement('li');
				var doctorInfo = entry.doctor_name && entry.doctor_name !== 'N/A' ? ' by ' + entry.doctor_name : '';
				var patientObj = (window.DocDash && window.DocDash.patientsData) ? window.DocDash.patientsData.find(function(p){ return p.id === currentPatientId; }) : null;
				var patientName = patientObj ? (patientObj.firstName + ' ' + patientObj.lastName) : '';
				var patientEmail = patientObj && patientObj.email ? patientObj.email : '';
				
				// Check if timeline entry has been sent
				var isSent = entry.sent_status === 'sent';
				var buttonClass = isSent ? 'btn-sent-prescription' : 'btn-send-prescription';
				var buttonText = isSent ? 'Sent' : 'Send';
				var buttonIcon = isSent ? 'fa-check-circle' : 'fa-paper-plane';
				var buttonOnclick = isSent ? '' : 'onclick="showSendTimelineModal(' + entry.id + ', \'' + patientName.replace(/'/g, "\\'") + '\', \'' + patientEmail.replace(/'/g, "\\'") + '\', \'' + String(entry.type_of_checkup || '').replace(/'/g, "\\'") + '\', \'' + String(entry.doctor_name || 'N/A').replace(/'/g, "\\'") + '\', \'' + String(entry.entry_date || '').replace(/'/g, "\\'") + '\', \'' + String(entry.description || '').replace(/'/g, "\\'") + '\'); return false;"';
				
				li.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">'
					+ '<div>'
					+ '<strong>' + entry.entry_date + ':</strong> ' + entry.type_of_checkup + doctorInfo + '<br><small>' + entry.description + '</small>'
					+ '</div>'
					+ '<div>'
					+ '<button class="' + buttonClass + '" ' + buttonOnclick + '>'
					+ '<i class="fas ' + buttonIcon + '" style="margin-right:5px;"></i>' + buttonText
					+ '</button>'
					+ '</div>'
					+ '</div>';
				li.style.marginBottom = '10px';
				li.style.padding = '8px';
				li.style.backgroundColor = '#f8f9fa';
				li.style.borderRadius = '6px';
				li.style.borderLeft = '4px solid #1a73e8';
				patientDetailHealthTimeline.appendChild(li);
			});
		} else {
			console.log('No timeline entries found for patient:', actualId); // Debug log
			var liEmpty = document.createElement('li');
			liEmpty.textContent = 'No health timeline entries.';
			liEmpty.style.color = '#6c757d';
			liEmpty.style.fontStyle = 'italic';
			patientDetailHealthTimeline.appendChild(liEmpty);
		}
		} catch (e) {
			if (patientDetailHealthTimeline) {
				var liErr = document.createElement('li');
				liErr.textContent = 'Error loading timeline entries.';
				patientDetailHealthTimeline.appendChild(liErr);
			}
		}
	}
	window.DocDash.loadHealthTimelineForPatient = loadHealthTimelineForPatient;

	// Load prescriptions for a specific patient
	function loadPrescriptionsForPatient(patientId) {
		console.log('Loading prescriptions for patient:', patientId); // Debug log
		var prescriptionsContainer = document.getElementById('patientDetailPrescriptions');
		if (!prescriptionsContainer) {
			console.error('patientDetailPrescriptions element not found!'); // Debug log
			return;
		}

		console.log('Found prescriptions container, showing loading state'); // Debug log
		// Show loading state
		prescriptionsContainer.innerHTML = '<div class="loading-message">Loading prescriptions...</div>';

		var apiUrl = '/4care/Doc-Dash/Back-end/api/get-patient-prescriptions.php?patient_id=' + encodeURIComponent(patientId);
		console.log('Fetching prescriptions from:', apiUrl); // Debug log
		
		fetch(apiUrl)
		.then(response => {
			console.log('Prescriptions API response status:', response.status); // Debug log
			return response.json();
		})
		.then(result => {
			console.log('Prescriptions API response data:', result); // Debug log
			if (result.success) {
				console.log('Found', result.data.length, 'prescriptions for patient'); // Debug log
				if (result.data.length === 0) {
					console.log('No prescriptions found, showing no-prescriptions message'); // Debug log
					prescriptionsContainer.innerHTML = '<div class="no-prescriptions-message" style="text-align: center; color: #666; padding: 20px; font-style: italic;">No prescriptions found for this patient.</div>';
					return;
				}

				// Build prescriptions HTML using patient dashboard style
				var prescriptionsHtml = '<ul class="medical-history-list">';
				result.data.forEach(function(prescription) {
					// Determine file icon based on file type
					var fileIcon = 'fas fa-file-pdf';
					if (prescription.prescription_url) {
						if (prescription.prescription_url.includes('image') || prescription.prescription_url.includes('jpeg') || prescription.prescription_url.includes('jpg') || prescription.prescription_url.includes('png')) {
							fileIcon = 'fas fa-file-image';
						}
					}
					
					// Format date like patient dashboard
					var formattedDate = new Date(prescription.created_at).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					});

					// Determine status display
					var statusText = '';
					var statusClass = '';
					var showSendButton = false;
					var showSentButton = false;
					if (prescription.sent_status === 'sent') {
						statusText = 'Sent to Patient';
						statusClass = 'status-sent';
						showSentButton = true;
					} else if (prescription.sent_status === 'doctor_only') {
						statusText = 'Doctor Only';
						statusClass = 'status-doctor-only';
						showSendButton = true;
					} else {
						statusText = 'Pending';
						statusClass = 'status-pending';
						showSendButton = true;
					}

					prescriptionsHtml += `
						<li class="medical-history-item prescription-file-item" data-file="${prescription.prescription_url}" data-prescription-id="${prescription.id}">
							<i class="${fileIcon} medical-history-icon text-blue-500"></i>
							<div class="medical-history-details">
								<div><strong>Prescription - ${prescription.doctor_name}</strong></div>
								<div class="medical-history-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</div>
								<div class="text-sm text-gray-600 mt-1">Patient: ${prescription.patient_name} (${prescription.patient_email})</div>
								<div class="text-xs mt-1">
									<span class="prescription-status ${statusClass}">${statusText}</span>
								</div>
							</div>
							<div class="medical-history-actions">
								${prescription.prescription_url ? `
									<button onclick="viewPrescriptionFile('${prescription.prescription_url}'); return false;" class="btn-view-file">
										<i class="fas fa-eye" style="margin-right: 5px;"></i>
										View
									</button>
								` : ''}
								${showSendButton ? `
									<button onclick="showSendPrescriptionModal(${prescription.id}, '${prescription.patient_name}', '${prescription.patient_email}'); return false;" class="btn-send-prescription">
										<i class="fas fa-paper-plane" style="margin-right: 5px;"></i>
										Send
									</button>
								` : ''}
								${showSentButton ? `
									<button onclick="showSentPrescriptionModal(${prescription.id}, '${prescription.patient_name}', '${prescription.patient_email}'); return false;" class="btn-sent-prescription">
										<i class="fas fa-check-circle" style="margin-right: 5px;"></i>
										Sent
									</button>
								` : ''}
							</div>
						</li>
					`;
				});
				prescriptionsHtml += '</ul>';

				console.log('Built prescriptions HTML, updating container'); // Debug log
				prescriptionsContainer.innerHTML = prescriptionsHtml;
			} else {
				console.error('Prescriptions API returned error:', result.message); // Debug log
				prescriptionsContainer.innerHTML = '<div class="error-message" style="color: #f44336; text-align: center; padding: 20px;">Error loading prescriptions: ' + result.message + '</div>';
			}
		})
		.catch(error => {
			console.error('Error loading prescriptions:', error);
			prescriptionsContainer.innerHTML = '<div class="error-message" style="color: #f44336; text-align: center; padding: 20px;">Error loading prescriptions. Please try again.</div>';
		});
	}

	// Function to view prescription file - using Patient Dashboard style modal
	window.viewPrescriptionFile = function(prescriptionUrl) {
		console.log('viewPrescriptionFile called with URL:', prescriptionUrl); // Debug log
		if (prescriptionUrl) {
			// Use the same openViewer function as the upload section
			if (typeof window.openViewer === 'function') {
				console.log('Calling openViewer function'); // Debug log
				window.openViewer(prescriptionUrl);
			} else {
				console.log('openViewer not found, opening in new tab'); // Debug log
				// Fallback: open in new tab
				window.open(prescriptionUrl, '_blank');
			}
		} else {
			console.error('No prescription URL provided'); // Debug log
		}
	};

	window.DocDash.loadPrescriptionsForPatient = loadPrescriptionsForPatient;

	// Add close button event listener for file view modal
	document.addEventListener('DOMContentLoaded', function() {
		var closeFileViewModalBtn = document.getElementById('closeFileViewModalBtn');
		if (closeFileViewModalBtn) {
			closeFileViewModalBtn.addEventListener('click', function() {
				var fileViewModal = document.getElementById('fileViewModal');
				if (fileViewModal) {
					fileViewModal.classList.remove('active');
					document.body.style.overflow = 'auto';
				}
			});
		}
	});

	// Send Prescription Modal Functions
	var currentPrescriptionId = null;
	var currentPatientEmail = null;
	var currentTimelineId = null;
	var sendContext = null; // 'prescription' or 'timeline'

	window.showSendPrescriptionModal = function(prescriptionId, patientName, patientEmail) {
		console.log('showSendPrescriptionModal called:', prescriptionId, patientName, patientEmail); // Debug log
		currentPrescriptionId = prescriptionId;
		currentPatientEmail = patientEmail;
		sendContext = 'prescription';
		
		// Update modal content with exactly two spaces between label and value
		var sendPatientNameEl = document.getElementById('sendPatientName');
		var sendCurrentEmailEl = document.getElementById('sendCurrentEmail');
		if (sendPatientNameEl) { sendPatientNameEl.innerHTML = '&nbsp;&nbsp;' + (patientName || ''); }
		if (sendCurrentEmailEl) { sendCurrentEmailEl.innerHTML = '&nbsp;&nbsp;' + (patientEmail || ''); }
		
		// Populate email dropdown with all patient emails
		var emailSelect = document.getElementById('sendPrescriptionEmail');
		if (!emailSelect) {
			console.error('Email select element not found!');
			return;
		}
		console.log('Found email select element:', emailSelect); // Debug log
		emailSelect.innerHTML = '<option value="">-- Select Patient Email --</option>';
		
		// Fetch all patient emails from patient_signup table
		console.log('Fetching patient emails from API...'); // Debug log
		fetch('/4care/Doc-Dash/Back-end/api/get-all-patient-emails.php')
		.then(response => {
			console.log('API response status:', response.status); // Debug log
			return response.json();
		})
		.then(result => {
			console.log('API response data:', result); // Debug log
			if (result.success && result.data) {
				console.log('Found', result.data.length, 'patient emails'); // Debug log
				result.data.forEach(function(emailData) {
					var option = document.createElement('option');
					option.value = emailData.email;
					
					// Mark current patient email
					if (emailData.email === patientEmail) {
						option.textContent = emailData.email + ' (Current Patient)';
						option.selected = true; // Auto-select current patient
					} else {
						option.textContent = emailData.email + ' (' + emailData.full_name + ')';
					}
					
					emailSelect.appendChild(option);
				});
				console.log('Email dropdown populated with', result.data.length, 'options'); // Debug log
			} else {
				console.error('Failed to load patient emails:', result.message);
				// Fallback: add current email only
				if (patientEmail) {
					var option = document.createElement('option');
					option.value = patientEmail;
					option.textContent = patientEmail + ' (Current Patient)';
					option.selected = true;
					emailSelect.appendChild(option);
					console.log('Added fallback email option'); // Debug log
				}
			}
		})
		.catch(error => {
			console.error('Error loading patient emails:', error);
			// Fallback: add current email only
			if (patientEmail) {
				var option = document.createElement('option');
				option.value = patientEmail;
				option.textContent = patientEmail + ' (Current Patient)';
				option.selected = true;
				emailSelect.appendChild(option);
				console.log('Added fallback email option after error'); // Debug log
			}
		});
		
		// Show modal
		var modal = document.getElementById('sendPrescriptionModal');
		if (modal) {
			modal.style.display = 'flex';
			modal.classList.add('active');
		} else {
			console.error('Send prescription modal not found');
		}
	};

	// Timeline send modal (reuses the same modal UI)
	window.showSendTimelineModal = function(timelineId, patientName, patientEmail, checkupType, doctorName, entryDate, description) {
		console.log('showSendTimelineModal called:', timelineId, patientName, patientEmail);
		currentTimelineId = timelineId;
		currentPatientEmail = patientEmail || currentPatientEmail || '';
		// Reuse same function to populate modal
		window.showSendPrescriptionModal(0, patientName, currentPatientEmail);
		// Ensure context is set to timeline AFTER the modal is prepared
		sendContext = 'timeline';
		
		// After modal is prepared, adjust labels to reference Health Timeline instead of Prescription
		var modal = document.getElementById('sendPrescriptionModal');
		if (modal) {
			var header = modal.querySelector('h2');
			if (header) {
				header.textContent = 'Send Health Timeline to Patient';
			}
			var confirmBtn = document.getElementById('confirmSendPrescriptionBtn');
			if (confirmBtn) {
				confirmBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 5px;"></i>Send Health Timeline';
			}
			var hint = modal.querySelector('.input-hint');
			if (hint && hint.textContent && hint.textContent.toLowerCase().includes('prescription')) {
				hint.textContent = 'Choose the email address to send the health timeline to';
			}
			// Inject details of the timeline entry for confirmation context
			var details = modal.querySelector('#sendItemDetails');
			if (!details) {
				details = document.createElement('div');
				details.id = 'sendItemDetails';
				details.className = 'mb-3';
				var insertBefore = modal.querySelector('.form-group');
				if (insertBefore && insertBefore.parentNode) {
					insertBefore.parentNode.insertBefore(details, insertBefore);
				} else {
					modal.appendChild(details);
				}
			}
			details.innerHTML = '<div class="text-sm" style="line-height:1.4">'
				+ '<p><strong>Type of Checkup:</strong>&nbsp;&nbsp;' + (checkupType || '') + '</p>'
				+ '<p><strong>Doctor:</strong>&nbsp;&nbsp;' + (doctorName || 'N/A') + '</p>'
				+ '<p><strong>Date:</strong>&nbsp;&nbsp;' + (entryDate || '') + '</p>'
				+ '<p><strong>Description:</strong>&nbsp;&nbsp;' + (description || '') + '</p>'
				+ '</div>';
		}
	};

	// Sent Prescription Modal Function
	window.showSentPrescriptionModal = function(prescriptionId, patientName, patientEmail) {
		console.log('showSentPrescriptionModal called:', prescriptionId, patientName, patientEmail); // Debug log
		
		// Update modal content
		document.getElementById('sentPatientName').textContent = patientName;
		document.getElementById('sentToEmail').textContent = patientEmail;
		
		// Show modal
		var modal = document.getElementById('sentPrescriptionModal');
		if (modal) {
			modal.style.display = 'flex';
			modal.classList.add('active');
		} else {
			console.error('Sent prescription modal not found');
		}
	};

	// Close modal functions
	document.addEventListener('DOMContentLoaded', function() {
		// Close Send Prescription Modal
		var closeSendBtn = document.getElementById('closeSendPrescriptionModalBtn');
		if (closeSendBtn) {
			closeSendBtn.addEventListener('click', function() {
				var modal = document.getElementById('sendPrescriptionModal');
				if (modal) {
					modal.style.display = 'none';
					modal.classList.remove('active');
				}
			});
		}

		var cancelSendBtn = document.getElementById('cancelSendPrescriptionBtn');
		if (cancelSendBtn) {
			cancelSendBtn.addEventListener('click', function() {
				var modal = document.getElementById('sendPrescriptionModal');
				if (modal) {
					modal.style.display = 'none';
					modal.classList.remove('active');
				}
			});
		}

		// Close Sent Prescription Modal
		var closeSentBtn = document.getElementById('closeSentPrescriptionModalBtn');
		if (closeSentBtn) {
			closeSentBtn.addEventListener('click', function() {
				var modal = document.getElementById('sentPrescriptionModal');
				if (modal) {
					modal.style.display = 'none';
					modal.classList.remove('active');
				}
			});
		}

		var closeSentOkBtn = document.getElementById('closeSentPrescriptionBtn');
		if (closeSentOkBtn) {
			closeSentOkBtn.addEventListener('click', function() {
				var modal = document.getElementById('sentPrescriptionModal');
				if (modal) {
					modal.style.display = 'none';
					modal.classList.remove('active');
				}
			});
		}

		// Send prescription function
		var confirmSendBtn = document.getElementById('confirmSendPrescriptionBtn');
		if (confirmSendBtn) {
			confirmSendBtn.addEventListener('click', function(){
				var emailSelect = document.getElementById('sendPrescriptionEmail');
				var selectedEmail = emailSelect ? emailSelect.value : '';
				if (!selectedEmail) { alert('Please select an email'); return; }
				if (sendContext === 'timeline') {
					if (!currentTimelineId) { alert('No timeline entry selected.'); return; }
					fetch('/4care/Doc-Dash/Back-end/api/send-timeline-to-patient.php', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ timeline_id: currentTimelineId, patient_email: selectedEmail })
					})
					.then(res => res.json())
					.then(result => {
						if (result.success) {
							alert(result.message || 'Timeline sent successfully');
							var modal = document.getElementById('sendPrescriptionModal');
							if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
							// Reload timeline
							if (currentPatientId) loadHealthTimelineForPatient(currentPatientId);
						} else {
							alert('Error: ' + (result.message || 'Failed to send timeline'));
						}
					})
					.catch(err => { console.error('Send timeline error:', err); alert('Error sending timeline.'); });
				} else {
					if (!currentPrescriptionId) { alert('No prescription selected.'); return; }
					// Send prescription
					fetch('/4care/Doc-Dash/Back-end/api/send-prescription-to-patient.php', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ prescription_id: currentPrescriptionId, patient_email: selectedEmail })
					})
					.then(res => res.json())
					.then(result => {
						if (result.success) {
							alert(result.message || 'Prescription sent successfully');
							var modal = document.getElementById('sendPrescriptionModal');
							if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
							// Reload prescriptions
							if (currentPatientId) loadPrescriptionsForPatient(currentPatientId);
						} else {
							alert('Error: ' + (result.message || 'Failed to send'));
						}
					})
					.catch(err => { console.error('Send error:', err); alert('Error sending.'); });
				}
			});
		}
	});

	function openPatientDetails(patientId) {
		console.log('Opening patient details for ID:', patientId); // Debug log
		var patient = patientsData.find(function(p){ return p.id === patientId; });
		console.log('Found patient:', patient); // Debug log
		var patientDetailsColumn = document.getElementById('patientDetailsColumn');
		var healthTimelineContainer = document.getElementById('healthTimelineContainer');
		
		if (patient) {
			// Show the patient details column
			if (patientDetailsColumn) {
				patientDetailsColumn.style.display = 'flex';
				patientDetailsColumn.classList.add('show');
			}
			
		// Show the health timeline container
		if (healthTimelineContainer) {
			healthTimelineContainer.style.display = 'flex';
			healthTimelineContainer.classList.add('show');
		}
		
		// Load health timeline for this patient (patientId is already like 'pat123')
		console.log('About to load health timeline for patient ID:', patientId);
			
			if (patientDetailsTitle) patientDetailsTitle.textContent = 'Details for ' + patient.firstName + ' ' + patient.lastName;
			function setTextContent(id, text){ var el = document.getElementById(id); if (el) el.textContent = text; }
			setTextContent('patientDetailName', patient.firstName + ' ' + patient.lastName);
			setTextContent('patientDetailDob', patient.dob);
			setTextContent('patientDetailGender', patient.gender);
			setTextContent('patientDetailEmail', patient.email);
			setTextContent('patientDetailPhone', patient.phone);
			setTextContent('patientDetailAddress', patient.address);
			setTextContent('patientDetailBarangay', patient.barangay);
			setTextContent('patientDetailBloodType', patient.bloodType);
			setTextContent('patientDetailAllergies', patient.allergies);
			setTextContent('patientDetailConditions', patient.conditions);
			setTextContent('patientDetailMedications', patient.medications);
			setTextContent('patientDetailEmergencyName', patient.emergencyName);
			setTextContent('patientDetailEmergencyRelationship', patient.emergencyRelationship);
			setTextContent('patientDetailEmergencyPhone', patient.emergencyPhone);
			loadHealthTimelineForPatient(patientId);
			loadPrescriptionsForPatient(patientId);
		} else {
			// Hide the patient details column if no patient selected
			if (patientDetailsColumn) {
				patientDetailsColumn.style.display = 'none';
				patientDetailsColumn.classList.remove('show');
			}
			
			// Hide the health timeline container if no patient selected
			if (healthTimelineContainer) {
				healthTimelineContainer.style.display = 'none';
				healthTimelineContainer.classList.remove('show');
			}
			
			if (patientDetailsTitle) patientDetailsTitle.textContent = 'Select a Patient to View Details';
			var ps = patientProfileDetails ? patientProfileDetails.querySelectorAll('p') : [];
			for (var i = 0; i < ps.length; i++) { ps[i].textContent = ''; }
			if (patientDetailHealthTimeline) patientDetailHealthTimeline.innerHTML = '';
			currentPatientId = null;
		}
	}
	window.DocDash.openPatientDetails = openPatientDetails;

	if (patientSearchIcon) patientSearchIcon.addEventListener('click', function(){ renderPatientCards(patientSearchInput ? patientSearchInput.value : ''); });
	if (patientSearchInput) patientSearchInput.addEventListener('keyup', function(){ renderPatientCards(patientSearchInput.value); });

	// Health Timeline Form Submission Handler
	var healthTimelineForm = document.getElementById('healthTimelineForm');
	if (healthTimelineForm) {
		healthTimelineForm.addEventListener('submit', async function(e){
			e.preventDefault(); // Prevent default form submission
			
			var timelineEvent = (document.getElementById('timeline-event') || {}).value;
			var timelineDoctor = (document.getElementById('timeline-doctor') || {}).value;
			var timelineDate = (document.getElementById('timeline-date') || {}).value;
			var timelineDescription = (document.getElementById('timeline-description') || {}).value;
			var pid = currentPatientId;
			
			// Use current date if no date is provided
			var entryDate = timelineDate || new Date().toISOString().split('T')[0];
			
			if (pid && timelineEvent && timelineDescription) {
				try {
					var saveBtn = document.getElementById('saveTimelineBtn');
					if (saveBtn) {
						saveBtn.textContent = 'Saving...';
						saveBtn.disabled = true;
					}
					
					var payload = { 
						patient_id: String(pid).replace('pat', ''), 
						type_of_checkup: timelineEvent, 
						doctor_name: timelineDoctor || 'N/A',
						description: timelineDescription, 
						entry_date: entryDate 
					};
					
					var res = await fetch('/4care/Doc-Dash/Back-end/api/save-health-timeline.php', { 
						method: 'POST', 
						headers: { 'Content-Type': 'application/json' }, 
						body: JSON.stringify(payload) 
					});
					
					var out = await res.json();
					if (out.success) {
						// Clear form fields
						(document.getElementById('timeline-event') || {}).value = '';
						(document.getElementById('timeline-doctor') || {}).value = '';
						(document.getElementById('timeline-date') || {}).value = '';
						(document.getElementById('timeline-description') || {}).value = '';
						
						// Reload timeline to show new entry
						await loadHealthTimelineForPatient(pid);
						window.DocDash.showNotification('success', 'Timeline Updated', 'Health timeline entry saved to database!');
					} else {
						window.DocDash.showNotification('error', 'Save Failed', out.message);
					}
				} catch (e) {
					window.DocDash.showNotification('error', 'Save Failed', 'An error occurred while saving the timeline entry.');
				} finally {
					var saveBtn = document.getElementById('saveTimelineBtn');
					if (saveBtn) {
						saveBtn.textContent = 'Save Timeline';
						saveBtn.disabled = false;
					}
				}
			} else {
				window.DocDash.showNotification('error', 'Validation Error', 'Please fill in all required fields.');
			}
		});
	}

	// Keep the button click handler as backup
	if (saveTimelineBtn) {
		saveTimelineBtn.addEventListener('click', async function(e){
			e.preventDefault(); // Prevent default button behavior
			
			var timelineEvent = (document.getElementById('timeline-event') || {}).value;
			var timelineDoctor = (document.getElementById('timeline-doctor') || {}).value;
			var timelineDate = (document.getElementById('timeline-date') || {}).value;
			var timelineDescription = (document.getElementById('timeline-description') || {}).value;
			var pid = currentPatientId;
			
			// Use current date if no date is provided
			var entryDate = timelineDate || new Date().toISOString().split('T')[0];
			
			if (pid && timelineEvent && timelineDescription) {
				try {
					saveTimelineBtn.textContent = 'Saving...';
					saveTimelineBtn.disabled = true;
					
					var payload = { 
						patient_id: String(pid).replace('pat', ''), 
						type_of_checkup: timelineEvent, 
						doctor_name: timelineDoctor || 'N/A',
						description: timelineDescription, 
						entry_date: entryDate 
					};
					
					var res = await fetch('/4care/Doc-Dash/Back-end/api/save-health-timeline.php', { 
						method: 'POST', 
						headers: { 'Content-Type': 'application/json' }, 
						body: JSON.stringify(payload) 
					});
					
					var out = await res.json();
					if (out.success) {
						// Clear form fields
						(document.getElementById('timeline-event') || {}).value = '';
						(document.getElementById('timeline-doctor') || {}).value = '';
						(document.getElementById('timeline-date') || {}).value = '';
						(document.getElementById('timeline-description') || {}).value = '';
						
						// Reload timeline to show new entry
						await loadHealthTimelineForPatient(pid);
						window.DocDash.showNotification('success', 'Timeline Updated', 'Health timeline entry saved to database!');
					} else {
						window.DocDash.showNotification('error', 'Save Failed', out.message);
					}
				} catch (e) {
					window.DocDash.showNotification('error', 'Save Failed', 'An error occurred while saving the timeline entry.');
				} finally {
					saveTimelineBtn.textContent = 'Save Timeline';
					saveTimelineBtn.disabled = false;
				}
			} else {
				window.DocDash.showNotification('error', 'Validation Error', 'Please fill in all required fields.');
			}
		});
	}

	// Populate doctor names in timeline-doctor select
	document.addEventListener('DOMContentLoaded', function(){
		var doctorSelect = document.getElementById('timeline-doctor');
		if (!doctorSelect) return;
		fetch('/4care/Doc-Dash/Back-end/api/get-doctor-names.php')
			.then(function(r){ return r.json(); })
			.then(function(result){
				if (result && result.success && Array.isArray(result.data)) {
					result.data.forEach(function(name){
						var opt = document.createElement('option');
						opt.value = name;
						opt.textContent = name;
						doctorSelect.appendChild(opt);
					});
				}
			})
			.catch(function(err){ console.error('Failed to load doctor names', err); });
	});

	// initial render (empty)
	renderPatientCards('');

})();


