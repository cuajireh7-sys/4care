(function(){
	window.DocDash = window.DocDash || {};

	async function loadDoctorDashboardStats() {
		console.log('Loading doctor dashboard stats...');
		try {
			var response = await fetch('/4care/Doc-Dash/Back-end/api/get-dashboard-stats.php');
			var result = await response.json();
			console.log('API response:', result);
			if (result.success) {
				// Update patients this month count
				var patientsThisMonthElement = document.getElementById('doctorPatientsThisMonth');
				console.log('Element found:', patientsThisMonthElement);
				console.log('Setting value to:', result.data.patients_this_month);
				if (patientsThisMonthElement) {
					patientsThisMonthElement.textContent = result.data.patients_this_month;
					console.log('Value set successfully');
				}
				// Update total registered patients
				var registeredPatientsElement = document.getElementById('doctorRegisteredPatients');
				if (registeredPatientsElement && result.data.total_patients !== undefined) {
					registeredPatientsElement.textContent = result.data.total_patients;
				}
			}
		} catch (e) {
			console.error('Error loading dashboard stats:', e);
		}
	}
	window.DocDash.loadDoctorDashboardStats = loadDoctorDashboardStats;

    // Load new patients (removed feature)
    async function loadNewPatients() { return; }

	// Create patient card HTML
	function createPatientCard(patient) {
		const card = document.createElement('div');
		card.className = 'new-patient-card';
		card.innerHTML = `
			<div class="new-patient-header">
				<div class="patient-id">${patient.patient_id_formatted}</div>
			</div>
			<div class="patient-name">${patient.name}</div>
			<div class="patient-details">
				<div class="patient-detail-row">
					<span class="patient-detail-label">Gender:</span>
					<span class="patient-detail-value">${patient.gender || 'N/A'}</span>
				</div>
				<div class="patient-detail-row">
					<span class="patient-detail-label">Location:</span>
					<span class="patient-detail-value">${patient.location || 'N/A'}</span>
				</div>
				<div class="patient-detail-row">
					<span class="patient-detail-label">Phone:</span>
					<span class="patient-detail-value">${patient.phone || 'N/A'}</span>
				</div>
			</div>
			<div class="registration-info">
				<div class="registration-date">Registered: ${patient.formatted_date}</div>
				<div class="registration-time">${patient.formatted_time}</div>
			</div>
			<button class="view-details-btn" onclick="viewPatientDetails(${patient.patient_id})">
				<i class="fas fa-eye" style="margin-right: 6px;"></i>View Details
			</button>
		`;
		return card;
	}

	// View patient details function
	function viewPatientDetails(patientId) {
		console.log('Viewing details for patient ID:', patientId);
		// You can implement this to show patient details in a modal or navigate to patient details page
		alert(`Viewing details for Patient ID: ${patientId}\n\nThis feature can be expanded to show full patient details in a modal.`);
	}

    window.DocDash.loadNewPatients = loadNewPatients;

	// Load persisted follow-ups from DB
	async function loadFollowUps() {
		try {
			const res = await fetch('/4care/Doc-Dash/Back-end/api/get-follow-ups.php');
			const out = await res.json();
			if (out && out.success) {
				// Get deleted items from localStorage
				const deletedItems = JSON.parse(localStorage.getItem('deletedFollowUps') || '[]');
				
				// Filter out deleted items
				window.followUps = (out.data || [])
					.filter(r => !deletedItems.includes(r.id))
					.map(r => ({
						id: r.id,
						patientId: String(r.patient_id),
						patientNumericId: r.patient_id,
						patientDisplayId: r.patient_display_id,
						patientName: r.patient_name,
						details: r.details,
						date: r.date,
						status: r.status
					}));
				renderFollowUpsTable();
			}
		} catch (e) { console.error('Failed to load follow-ups', e); }
	}

	// Initialize the Barangay Pie Chart (Top 5 barangays from DB) - EXACT COPY FROM ADMIN
	console.log('Initializing barangay pie chart...');
	
	let barangayPieChart;
	let barangayPieRawLabels = [];

	async function loadTopBarangays() {
		console.log('loadTopBarangays called');
		
		const barangayPieChartElement = document.getElementById('barangayPieChart');
		console.log('Pie chart element found:', barangayPieChartElement);
		console.log('Element dimensions:', barangayPieChartElement ? {
			width: barangayPieChartElement.offsetWidth,
			height: barangayPieChartElement.offsetHeight,
			display: window.getComputedStyle(barangayPieChartElement).display,
			visibility: window.getComputedStyle(barangayPieChartElement).visibility
		} : 'Element not found');
		
		if (!barangayPieChartElement) {
			console.error('barangayPieChart element not found!');
			return;
		}
		
		const barangayPieChartCtx = barangayPieChartElement.getContext('2d');
		console.log('Pie chart context:', barangayPieChartCtx);
		
		if (!barangayPieChartCtx) {
			console.error('No chart context available');
			return;
		}
		
		try {
			console.log('Fetching data from API...');
			const res = await fetch('/4care/Doc-Dash/Back-end/api/get-patient-barangay-counts.php');
			console.log('API response received');
			
			const json = await res.json();
			console.log('API JSON response:', json);
			
			if (!json.success) {
				console.error('API returned error:', json.message);
				throw new Error(json.message || 'Failed loading barangay counts');
			}

			const labels = json.data.labels;
			const counts = json.data.counts;
			
			console.log('Raw labels:', labels);
			console.log('Raw counts:', counts);
			
			// Test Chart.js functionality first
			console.log('Testing Chart.js with simple data...');
			try {
				const testChart = new Chart(barangayPieChartCtx, {
					type: 'pie',
					data: {
						labels: ['Test'],
						datasets: [{
							data: [1],
							backgroundColor: ['rgba(54, 162, 235, 0.8)']
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false
					}
				});
				console.log('Test chart created successfully, destroying it...');
				testChart.destroy();
			} catch (testError) {
				console.error('Test chart creation failed:', testError);
				throw testError;
			}
			
			barangayPieRawLabels = labels.slice();
			const displayLabels = labels.map(l => {
				if (!l) return 'Barangay';
				const lower = String(l).toLowerCase();
				return lower.includes('barangay') ? String(l) : `Barangay ${l}`;
			});
			
			console.log('Display labels:', displayLabels);

			if (barangayPieChart) {
				console.log('Destroying existing chart');
				barangayPieChart.destroy();
			}

			console.log('Creating new chart...');
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
							display: false
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
			
			console.log('Chart created successfully:', barangayPieChart);
		} catch (e) {
			console.error('Failed to load top barangays:', e);
			// Show error message in the chart container
			if (barangayPieChartElement) {
				barangayPieChartElement.parentElement.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Error loading chart: ' + e.message + '</p>';
			}
		}
	}


	// Wait for DOM to be ready, then load the pie chart
	document.addEventListener('DOMContentLoaded', function() {
		console.log('DOM loaded, initializing pie chart...');
		console.log('Chart.js available:', typeof Chart !== 'undefined');
		
		if (typeof Chart === 'undefined') {
			console.error('Chart.js is not loaded!');
			return;
		}
		
		// Initialize modal elements
		illnessDetailsModalOverlay = document.getElementById('illnessDetailsModalOverlay');
		illnessDetailsModalTitle = document.getElementById('illnessDetailsModalTitle');
		illnessDetailsList = document.getElementById('illnessDetailsList');
		closeIllnessDetailsModalBtn = document.getElementById('closeIllnessDetailsModalBtn');

		// Event listeners for modal
		if (closeIllnessDetailsModalBtn) closeIllnessDetailsModalBtn.addEventListener('click', closeCheckupBreakdownModal);
		if (illnessDetailsModalOverlay) {
			illnessDetailsModalOverlay.addEventListener('click', (e) => {
				if (e.target === illnessDetailsModalOverlay) {
					closeCheckupBreakdownModal();
				}
			});
		}
		
		// Load real data with a small delay to ensure Chart.js is ready
		setTimeout(() => {
			if (document.getElementById('barangayPieChart')) loadTopBarangays();
		}, 100);
	});
	
	// Also try loading immediately in case DOM is already ready
	if (document.readyState === 'loading') {
		console.log('DOM still loading, will load chart when ready');
	} else {
		console.log('DOM already ready, loading chart now');
		console.log('Chart.js available:', typeof Chart !== 'undefined');
		
		if (typeof Chart === 'undefined') {
			console.error('Chart.js is not loaded!');
			return;
		}
		
		setTimeout(() => {
			if (document.getElementById('barangayPieChart')) loadTopBarangays();
		}, 100);
	}

	// Modal functionality for checkup breakdown
	let illnessDetailsModalOverlay, illnessDetailsModalTitle, illnessDetailsList, closeIllnessDetailsModalBtn;

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

	function closeCheckupBreakdownModal() {
		if (illnessDetailsModalOverlay) illnessDetailsModalOverlay.classList.remove('active');
		document.body.style.overflow = '';
	}
	// Patient table functionality for doctor dashboard
	var patientsData = [];

	// Load all patients from database
	async function loadAllPatients() {
		try {
			const response = await fetch('/4care/Doc-Dash/Back-end/api/get-patients.php');
			const result = await response.json();
			
			if (result.success) {
				patientsData = result.data;
				renderDashboardPatientCards();
				renderDashboardPatientsTable();
				console.log('Patients loaded:', result.data);
			} else {
				console.error('Error loading patients:', result.message);
			}
		} catch (error) {
			console.error('Error loading patients:', error);
		}
	}

	function renderDashboardPatientCards(filteredPatients = patientsData) {
		const patientCardGrid = document.getElementById('patientCardGrid');
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

		// Format patient ID as #00001, #00002, etc. (never show 0)
			const pidNum = Number(patient.patient_id);
			const formattedPatientId = pidNum > 0 ? ('#' + String(pidNum).padStart(5, '0')) : '';

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
				displayPatientDetails(patient);
			});
		});
	}

	// Fallback table renderer to avoid reference errors when table is present
	function renderDashboardPatientsTable(filteredPatients = patientsData) {
		const tbody = document.getElementById('patientsTableBody') || document.getElementById('dashboardPatientsTableBody');
		if (!tbody) return; // No table on this view
		tbody.innerHTML = '';
		(filteredPatients || []).forEach((patient) => {
			const tr = document.createElement('tr');
			const formattedId = '#' + String(patient.patient_id || 0).padStart(5, '0');
			tr.innerHTML = `
				<td>${formattedId}</td>
				<td>${patient.firstName} ${patient.lastName}</td>
				<td>${patient.gender || ''}</td>
				<td>${patient.dob || ''}</td>
				<td>${patient.phone || ''}</td>
				<td>${patient.barangay || ''}</td>
				<td><button class="btn btn-secondary btn-sm" data-view-id="${patient.id}">View</button></td>
			`;
			tbody.appendChild(tr);
		});

		// Wire view buttons to show details pane
		tbody.querySelectorAll('button[data-view-id]').forEach((btn) => {
			btn.addEventListener('click', () => {
				const pid = btn.getAttribute('data-view-id');
				const p = (filteredPatients || []).find((x) => x.id === pid);
				if (p) displayPatientDetails(p);
			});
		});
	}

	// Follow-Up modal wiring
	document.addEventListener('DOMContentLoaded', function(){
		const openBtn = document.getElementById('addFollowUpBtn');
		const overlay = document.getElementById('addFollowUpModalOverlay');
		const closeBtn = document.getElementById('closeAddFollowUpModalBtn');
		const cancelBtn = document.getElementById('cancelAddFollowUpBtn');
		const form = document.getElementById('addFollowUpForm');
		const pidSelect = document.getElementById('followUpPatientId');
		const pnameInput = document.getElementById('followUpPatientName');
		const dateInput = document.getElementById('followUpDate');

        function openModal(){
            if (overlay){
                overlay.classList.add('active');
                document.body.style.overflow='hidden';
                populatePatientIds();
                if (dateInput){ dateInput.value = new Date().toISOString().split('T')[0]; }
                // Remove any voice mic wrappers/buttons from date and patient name
                [ 'followUpDate', 'followUpPatientName' ].forEach(function(id){
                    var el = document.getElementById(id);
                    if (!el) return;
                    var wrapper = el.parentElement && el.parentElement.classList && el.parentElement.classList.contains('voice-input-wrapper') ? el.parentElement : null;
                    if (wrapper){
                        try { el.style.paddingRight = ''; } catch(_) {}
                        if (wrapper.parentNode) wrapper.parentNode.insertBefore(el, wrapper);
                        wrapper.remove();
                    } else {
                        var micBtn = el.parentElement && el.parentElement.querySelector && el.parentElement.querySelector('.voice-btn-inside');
                        if (micBtn) micBtn.remove();
                    }
                    el.dataset.hasMic = 'true';
                });
            }
        }
		function closeModal(){ if (overlay){ overlay.classList.remove('active'); document.body.style.overflow=''; } if (form) form.reset(); }
		function populatePatientIds(){ if (!pidSelect) return; pidSelect.innerHTML = '<option value="">Select Patient</option>'; patientsData.forEach(p => { const opt = document.createElement('option'); opt.value = p.id; opt.textContent = (p.patient_id ? ('#'+String(p.patient_id).padStart(5,'0')) : p.id); pidSelect.appendChild(opt); }); }

		if (openBtn) openBtn.addEventListener('click', openModal);
		if (closeBtn) closeBtn.addEventListener('click', closeModal);
		if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
		if (overlay) overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closeModal(); });
		if (pidSelect) pidSelect.addEventListener('change', function(){ const sel = patientsData.find(p => p.id === pidSelect.value); if (pnameInput) pnameInput.value = sel ? (sel.firstName + ' ' + sel.lastName) : ''; });
		if (form) form.addEventListener('submit', async function(e){
			e.preventDefault();
			const id = pidSelect ? pidSelect.value : '';
			const details = (document.getElementById('followUpDetails')||{}).value || '';
			const date = dateInput ? dateInput.value : '';
			const doctorSel = document.getElementById('followUpDoctorId');
			const doctorName = doctorSel ? doctorSel.value : '';
			const statusSel = 'Pending';
			const idxInput = document.getElementById('followUpIndex');
			if (!id || !details || !date || !doctorName){ alert('Please complete all required fields.'); return; }
			const sel = patientsData.find(p => p.id === id);
			const payload = {
				id: (document.getElementById('followUpId')||{}).value || '',
				patient_id: (sel && Number(sel.patient_id) > 0) ? Number(sel.patient_id) : (function(){ const n = parseInt(String(id).replace('pat',''),10); return isNaN(n)?0:n; })(),
				patient_display_id: (sel && Number(sel.patient_id) > 0) ? ('#'+String(Number(sel.patient_id)).padStart(5,'0')) : '',
				patient_name: sel ? (sel.firstName + ' ' + sel.lastName) : (pnameInput ? pnameInput.value : ''),
				details: details,
				doctor_name: doctorName,
				date: date,
				status: 'Pending'
			};
			if (!payload.patient_id || payload.patient_id <= 0) { alert('Invalid patient selection.'); return; }
			try {
                const res = await fetch('/4care/Doc-Dash/Back-end/api/save-follow-up.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
				const out = await res.json();
				if (!out.success) { alert(out.message || 'Save failed'); return; }
				window.followUps = window.followUps || [];
			const record = { id: out.id || payload.id || null, patientId: 'pat'+String(payload.patient_id), patientNumericId: payload.patient_id, patientDisplayId: ('#'+String(payload.patient_id).padStart(5,'0')), patientName: payload.patient_name, details: payload.details, date: payload.date, status: 'Pending' };
				if (idxInput && idxInput.value !== '') {
					const i = parseInt(idxInput.value); if (!isNaN(i)) window.followUps[i] = record;
				} else {
					window.followUps.unshift(record);
				}
				renderFollowUpsTable();
				closeModal();
			} catch(err){ console.error('Save follow-up error', err); alert('Network error saving follow-up'); }
		});
	});

	function renderFollowUpsTable(){
		const tbody = document.getElementById('followUpsTableBody');
		if (!tbody) return;
		tbody.innerHTML = '';
		window.followUps = window.followUps || [];
		window.followUps.forEach((fu, idx) => {
			const tr = document.createElement('tr');
			const statusClass = fu.status === 'Done' ? 'badge-success' : 'badge-warning';
			tr.innerHTML = `
				<td>${fu.patientDisplayId || ''}</td>
				<td>${fu.patientName || ''}</td>
				<td>${fu.details || ''}</td>
				<td>${fu.date || ''}</td>
				<td><span class="badge ${statusClass}">${fu.status}</span></td>
				<td>
					<button class="btn btn-secondary btn-sm" data-edit-index="${idx}"><i class="fas fa-edit" style="margin-right:5px;"></i>Edit</button>
					<button class="btn btn-success btn-sm" data-done-index="${idx}" style="margin-left:6px;"><i class="fas fa-check" style="margin-right:5px;"></i>Done</button>
					<button class="btn btn-danger btn-sm" data-delete-index="${idx}" style="margin-left:6px;"><i class="fas fa-trash" style="margin-right:5px;"></i>Delete</button>
				</td>`;
			tbody.appendChild(tr);
		});
		// wire actions
		tbody.querySelectorAll('button[data-edit-index]').forEach(btn => {
			btn.addEventListener('click', () => {
				const idx = parseInt(btn.getAttribute('data-edit-index'));
				const fu = (window.followUps||[])[idx];
				const overlay = document.getElementById('addFollowUpModalOverlay');
				if (!fu || !overlay) return;
				overlay.classList.add('active');
				document.body.style.overflow='hidden';
				const pidSelect = document.getElementById('followUpPatientId');
				const pname = document.getElementById('followUpPatientName');
				const details = document.getElementById('followUpDetails');
				const date = document.getElementById('followUpDate');
				const status = document.getElementById('followUpStatus');
				const idxInput = document.getElementById('followUpIndex');
				if (pidSelect) pidSelect.value = fu.patientId;
				if (pname) pname.value = fu.patientName || '';
				if (details) details.value = fu.details || '';
				if (date) date.value = fu.date || '';
				if (status) status.value = fu.status || 'Pending';
				if (idxInput) idxInput.value = String(idx);
			});
		});
			tbody.querySelectorAll('button[data-delete-index]').forEach(btn => {
			btn.addEventListener('click', async () => {
				const idx = parseInt(btn.getAttribute('data-delete-index'));
				if (isNaN(idx)) return;
				
				const fu = window.followUps[idx];
				if (!fu) return;
				
				// Add to deleted items in localStorage
				const deletedItems = JSON.parse(localStorage.getItem('deletedFollowUps') || '[]');
				deletedItems.push(fu.id);
				localStorage.setItem('deletedFollowUps', JSON.stringify(deletedItems));
				
				// Remove from display
				window.followUps.splice(idx, 1);
				renderFollowUpsTable();
				
				// Show confirmation message
				console.log('Follow-up removed from display (data preserved in database)');
			});
		});

		// Mark as done (UI only; persist handled via API if desired)
		tbody.querySelectorAll('button[data-done-index]').forEach(btn => {
			btn.addEventListener('click', () => {
				const idx = parseInt(btn.getAttribute('data-done-index'));
				if (isNaN(idx)) return;
				const fu = (window.followUps||[])[idx];
				if (!fu) return;
				fu.status = 'Done';
				renderFollowUpsTable();
			});
		});
	}

	// Display patient details in the details column
	function displayPatientDetails(patient) {
		if (!patient) return;
		
		// Show the details column
		const detailsColumn = document.getElementById('patientDetailsColumn');
		if (detailsColumn) {
			detailsColumn.classList.add('show');
		}
		
		// Update patient details in the details column
		const nameElement = document.getElementById('patientDetailName');
		const dobElement = document.getElementById('patientDetailDob');
		const genderElement = document.getElementById('patientDetailGender');
		const emailElement = document.getElementById('patientDetailEmail');
		const phoneElement = document.getElementById('patientDetailPhone');
		const addressElement = document.getElementById('patientDetailAddress');
		const barangayElement = document.getElementById('patientDetailBarangay');
		const bloodTypeElement = document.getElementById('patientDetailBloodType');
		const allergiesElement = document.getElementById('patientDetailAllergies');
		const conditionsElement = document.getElementById('patientDetailConditions');
		const medicationsElement = document.getElementById('patientDetailMedications');
		const emergencyNameElement = document.getElementById('patientDetailEmergencyName');
		const emergencyRelationshipElement = document.getElementById('patientDetailEmergencyRelationship');
		const emergencyPhoneElement = document.getElementById('patientDetailEmergencyPhone');
		
		if (nameElement) nameElement.textContent = `${patient.firstName} ${patient.lastName}`;
		if (dobElement) dobElement.textContent = patient.dob || 'Not provided';
		if (genderElement) genderElement.textContent = patient.gender || 'Not specified';
		if (emailElement) emailElement.textContent = patient.email || 'Not provided';
		if (phoneElement) phoneElement.textContent = patient.phone || 'Not provided';
		if (addressElement) addressElement.textContent = patient.address || 'Not provided';
		if (barangayElement) barangayElement.textContent = patient.barangay || 'Not specified';
		if (bloodTypeElement) bloodTypeElement.textContent = patient.bloodType || 'Not specified';
		if (allergiesElement) allergiesElement.textContent = patient.allergies || 'None reported';
		if (conditionsElement) conditionsElement.textContent = patient.conditions || 'None reported';
		if (medicationsElement) medicationsElement.textContent = patient.medications || 'None reported';
		if (emergencyNameElement) emergencyNameElement.textContent = patient.emergencyContactName || 'Not provided';
		if (emergencyRelationshipElement) emergencyRelationshipElement.textContent = patient.emergencyContactRelationship || 'Not provided';
		if (emergencyPhoneElement) emergencyPhoneElement.textContent = patient.emergencyContactPhone || 'Not provided';
		
		// Update the title
		const titleElement = document.getElementById('patientDetailsTitle');
		if (titleElement) titleElement.textContent = `${patient.firstName} ${patient.lastName} - Patient Details`;
	}

	// Health timeline functionality is handled in patients.js

	// Initialize patient table when page loads
	document.addEventListener('DOMContentLoaded', function() {
		loadAllPatients();
		loadFollowUps();
		// Add event listener for save timeline button
		// Event listeners for health timeline are handled in patients.js
	});

})();


