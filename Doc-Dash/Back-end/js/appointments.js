(function(){
	window.DocDash = window.DocDash || {};

	var datesEl = document.getElementById('appointmentsCalendarDates');
	var headerSpan = document.getElementById('appointmentsCurrentMonthYear');
	var prevBtn = document.getElementById('appointmentsPrevMonth');
	var nextBtn = document.getElementById('appointmentsNextMonth');
	var overviewTbody = document.querySelector('#appointmentOverviewTable tbody');

	var currentDate = new Date();
	var selectedDay = null;

	var appointments = window.DocDash.appointments || [
		{ id: 1, date: '2025-10-15', time: '09:00 AM', type: 'General Check-up', patient: 'Maria Santos', doctor: 'Dr. Rodriguez', approvedBy: 'Nurse A', reason: 'Routine check-up', status: 'Confirmed' },
		{ id: 2, date: '2025-10-15', time: '10:30 AM', type: 'Follow-up', patient: 'Juan Dela Cruz', doctor: 'Dr. Garcia', approvedBy: 'Nurse B', reason: 'Post-surgery follow-up', status: 'Confirmed' },
		{ id: 3, date: '2025-10-16', time: '11:00 AM', type: 'Vaccination', patient: 'Lorna Tolentino', doctor: 'Dr. Reyes', approvedBy: 'Nurse C', reason: 'Flu shot', status: 'Pending' },
		{ id: 4, date: '2025-10-17', time: '09:00 AM', type: 'Dental Check-up', patient: 'Peter Jones', doctor: 'Dr. Smith', approvedBy: 'Nurse D', reason: 'Toothache', status: 'Confirmed' },
		{ id: 5, date: '2025-10-17', time: '01:00 PM', type: 'Physical Therapy', patient: 'Anna Lee', doctor: 'Dr. Davis', approvedBy: 'Nurse E', reason: 'Rehabilitation', status: 'Pending' },
		{ id: 6, date: '2025-11-01', time: '02:00 PM', type: 'Consultation', patient: 'Alice Wonderland', doctor: 'Dr. Alice Smith', approvedBy: 'Nurse F', reason: 'Initial consultation for chronic fatigue', status: 'Confirmed' }
	];
	window.DocDash.appointments = appointments;

	function generateCalendar(){
		if (!datesEl || !headerSpan) return;
		datesEl.innerHTML = '';
		var year = currentDate.getFullYear();
		var month = currentDate.getMonth();
		headerSpan.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
		var firstDay = new Date(year, month, 1);
		var lastDay = new Date(year, month + 1, 0);
		var daysInMonth = lastDay.getDate();
		var firstWeekday = firstDay.getDay();
		for (var i = 0; i < firstWeekday; i++) {
			var empty = document.createElement('div'); empty.classList.add('calendar-day','empty-day'); datesEl.appendChild(empty);
		}
		for (var d = 1; d <= daysInMonth; d++) {
			var dayEl = document.createElement('div');
			dayEl.classList.add('calendar-day');
			dayEl.textContent = String(d);
			var full = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
			dayEl.dataset.date = full;
			var onThisDay = appointments.filter(function(a){ return a.date === full; });
			if (onThisDay.length > 0) {
				dayEl.classList.add('available-day');
				var indicator = document.createElement('div'); indicator.classList.add('appointment-indicator'); dayEl.appendChild(indicator);
				dayEl.title = onThisDay.map(function(a){ return a.time + ' - ' + a.patient + ' (' + a.type + ')'; }).join('\n');
			} else {
				dayEl.classList.add('empty-day');
			}
			dayEl.addEventListener('click', function(){ if (selectedDay) selectedDay.classList.remove('selected-day'); this.classList.add('selected-day'); selectedDay = this; });
			datesEl.appendChild(dayEl);
		}
		var today = new Date();
		var tf = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
		var todayEl = datesEl.querySelector('[data-date="' + tf + '"]');
		if (todayEl) { todayEl.classList.add('selected-day'); selectedDay = todayEl; }
		else {
			var first = datesEl.querySelector('.calendar-day:not(.empty-day)');
			if (first) { first.classList.add('selected-day'); selectedDay = first; }
		}
	}
	window.DocDash.generateAppointmentsCalendar = generateCalendar;

	function renderOverview(filterDate){
		if (!overviewTbody) return;
		overviewTbody.innerHTML = '';
		var toDisplay;
		if (filterDate) {
			toDisplay = appointments.filter(function(a){ return a.date === filterDate; });
		} else {
			var y = currentDate.getFullYear(); var m = currentDate.getMonth();
			toDisplay = appointments.filter(function(a){ var d = new Date(a.date); return d.getFullYear() === y && d.getMonth() === m; });
		}
		if (toDisplay.length === 0) {
			toDisplay.push({ id: 999, date: '2025-11-15', time: '09:00 AM', type: 'General Check-up', patient: 'Kharyll Liscano', doctor: 'Dr. Example', approvedBy: 'Nurse Example', reason: 'Example reason for visit', status: 'Confirmed' });
		}
		toDisplay.forEach(function(a){
			var row = overviewTbody.insertRow();
			row.innerHTML = '<td>' + a.date + ' ' + a.time + '</td><td>' + a.type + '</td><td>' + a.patient + '</td><td>' + a.doctor + '</td><td>' + a.approvedBy + '</td><td><button class="btn btn-primary view-appointment-details-btn" data-appointment-id="' + a.id + '" style="padding:5px 10px;"><i class="fas fa-eye"></i> View</button></td>';
		});
		Array.prototype.forEach.call(document.querySelectorAll('.view-appointment-details-btn'), function(btn){
			btn.addEventListener('click', function(e){
				var id = parseInt(e.currentTarget.dataset.appointmentId);
				var data = appointments.find(function(x){ return x.id === id; });
				if (data) openViewAppointmentModal(data);
			});
		});
	}
	window.DocDash.renderAppointmentOverview = renderOverview;

	function openViewAppointmentModal(data){
		var overlay = document.getElementById('viewAppointmentModalOverlay'); if (!overlay) return;
		function set(id, text){ var el = document.getElementById(id); if (el) el.textContent = text; }
		set('viewApptDateTime', data.date + ' ' + data.time);
		set('viewApptType', data.type);
		set('viewApptPatientName', data.patient);
		set('viewApptDoctor', data.doctor);
		set('viewApptApprovedBy', data.approvedBy);
		set('viewApptReason', data.reason);
		set('viewApptStatus', data.status);
		overlay.classList.add('active');
		document.body.style.overflow = 'hidden';
	}
	function closeViewAppointmentModal(){ var overlay = document.getElementById('viewAppointmentModalOverlay'); if (overlay){ overlay.classList.remove('active'); document.body.style.overflow = ''; } }
	var closeBtn = document.getElementById('closeViewAppointmentModalBtn'); if (closeBtn) closeBtn.addEventListener('click', closeViewAppointmentModal);
	var closeFooterBtn = document.getElementById('closeViewAppointmentModalFooterBtn'); if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeViewAppointmentModal);
	var overlayEl = document.getElementById('viewAppointmentModalOverlay'); if (overlayEl) overlayEl.addEventListener('click', function(e){ if (e.target === overlayEl) closeViewAppointmentModal(); });

	if (prevBtn) prevBtn.addEventListener('click', function(){ currentDate.setMonth(currentDate.getMonth() - 1); generateCalendar(); renderOverview(); });
	if (nextBtn) nextBtn.addEventListener('click', function(){ currentDate.setMonth(currentDate.getMonth() + 1); generateCalendar(); renderOverview(); });

	var addBtn = document.getElementById('addAppointmentBtn');
	var addOverlay = document.getElementById('addAppointmentModalOverlay');
	var closeAddBtn = document.getElementById('closeAddAppointmentModalBtn');
	var cancelAddForm = document.getElementById('cancelAddAppointmentForm');
	var addForm = document.getElementById('addAppointmentForm');
	function closeAdd(){ if (addOverlay){ addOverlay.classList.remove('active'); document.body.style.overflow=''; if (addForm) addForm.reset(); } }
	if (addBtn) addBtn.addEventListener('click', function(){ if (addOverlay){ addOverlay.classList.add('active'); document.body.style.overflow='hidden'; } });
	if (closeAddBtn) closeAddBtn.addEventListener('click', closeAdd);
	if (cancelAddForm) cancelAddForm.addEventListener('click', closeAdd);
	if (addOverlay) addOverlay.addEventListener('click', function(e){ if (e.target === addOverlay) closeAdd(); });
	if (addForm) addForm.addEventListener('submit', function(e){
		e.preventDefault();
		var patientName = (document.getElementById('appointmentPatientName') || {}).value;
		var doctorName = (document.getElementById('appointmentDoctor') || {}).value;
		var appointmentDate = (document.getElementById('appointmentDate') || {}).value;
		var appointmentTime = (document.getElementById('appointmentTime') || {}).value;
		var appointmentReason = (document.getElementById('appointmentReason') || {}).value;
		var appointmentStatus = (document.getElementById('appointmentStatus') || {}).value;
		var appointmentApprovedBy = (document.getElementById('appointmentApprovedBy') || {}).value || 'N/A';
		var newAppt = { id: appointments.length + 1, date: appointmentDate, time: appointmentTime, type: appointmentReason, patient: patientName, doctor: doctorName, approvedBy: appointmentApprovedBy, reason: appointmentReason, status: appointmentStatus };
		appointments.push(newAppt);
		generateCalendar();
		renderOverview();
		window.DocDash.logActivity('Nurse', 'Scheduled New Appointment', 'Patient: ' + newAppt.patient + ', Doctor: ' + newAppt.doctor + ', Date: ' + newAppt.date + ' ' + newAppt.time, null, newAppt);
		closeAdd();
	});

	// Doctors on duty table and modal
	var doctorsOnDuty = [
		{ name: 'Dr. Alice Smith', specialization: 'General Practice', availability: [ { date: '2025-11-01', time: '10:00 AM - 11:00 AM', patient: 'Maria Santos', issue: 'Follow-up on recent check-up' } ] },
		{ name: 'Dr. Bob Johnson', specialization: 'Pediatrics', availability: [ { date: '2025-11-01', time: '08:00 AM - 09:00 AM', patient: 'Emily White', issue: 'Routine pediatric check-up' } ] },
		{ name: 'Dr. Carol White', specialization: 'Cardiology', availability: [ { date: '2025-11-01', time: '10:00 AM - 11:00 AM', patient: 'No Appointment', issue: 'Tooth ache' } ] }
	];
	var dutyTbody = document.querySelector('#doctorsOnDutyTable tbody');
	function openDoctorAppointmentModal(slot){ var o = document.getElementById('doctorAppointmentModalOverlay'); if (!o) return; function set(id, t){ var el = document.getElementById(id); if (el) el.textContent = t; } set('doctorApptDate', slot.date || 'N/A'); set('doctorApptTimeSlot', slot.time); set('doctorApptPatient', slot.patient); set('doctorApptIssue', slot.issue); o.classList.add('active'); document.body.style.overflow='hidden'; }
	function closeDoctorAppointmentModal(){ var o = document.getElementById('doctorAppointmentModalOverlay'); if (o){ o.classList.remove('active'); document.body.style.overflow=''; } }
	var closeDocBtn = document.getElementById('closeDoctorAppointmentModalBtn'); if (closeDocBtn) closeDocBtn.addEventListener('click', closeDoctorAppointmentModal);
	var closeDocFooterBtn = document.getElementById('closeDoctorAppointmentModalFooterBtn'); if (closeDocFooterBtn) closeDocFooterBtn.addEventListener('click', closeDoctorAppointmentModal);
	var docOverlay = document.getElementById('doctorAppointmentModalOverlay'); if (docOverlay) docOverlay.addEventListener('click', function(e){ if (e.target === docOverlay) closeDoctorAppointmentModal(); });
	function renderDoctorsOnDuty(){ if (!dutyTbody) return; dutyTbody.innerHTML=''; doctorsOnDuty.forEach(function(doctor){ var row = dutyTbody.insertRow(); var cell = row.insertCell(); doctor.availability.forEach(function(slot){ var div = document.createElement('div'); div.classList.add('doctor-availability-slot'); div.innerHTML = '<strong>' + doctor.name + ' (' + doctor.specialization + ')</strong><br><strong>' + slot.date + ' ' + slot.time + '</strong><br>Patient: ' + slot.patient + '<br>Issue: ' + slot.issue; div.dataset.date = slot.date; div.dataset.timeSlot = slot.time; div.dataset.patient = slot.patient; div.dataset.issue = slot.issue; div.addEventListener('click', function(){ openDoctorAppointmentModal({ date: div.dataset.date, time: div.dataset.timeSlot, patient: div.dataset.patient, issue: div.dataset.issue }); }); cell.appendChild(div); }); }); }
	window.DocDash.renderDoctorsOnDuty = renderDoctorsOnDuty;

	// initial
	generateCalendar();
	renderOverview();
	var viewAllBtn = document.getElementById('viewAllAppointmentsBtn'); if (viewAllBtn) viewAllBtn.addEventListener('click', function(){ renderOverview(null); });
	renderDoctorsOnDuty();

})();


