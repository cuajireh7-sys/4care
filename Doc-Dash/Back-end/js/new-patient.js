(function(){
	window.DocDash = window.DocDash || {};

	var form = document.getElementById('newPatientForm');
	if (!form) return;

	// Prefill next Patient ID code
	async function prefillPatientId(){
		try {
			var r = await fetch('/4care/Doc-Dash/Back-end/api/get-next-patient-id.php');
			var j = await r.json();
			if (j && j.success && j.patient_code) {
				var el = document.getElementById('newPatientVisibleId');
				if (el) el.value = j.patient_code;
			}
		} catch(e) { /* ignore */ }
	}
	
	prefillPatientId();

	var submitBtn = form.querySelector('button[type="submit"]');
	form.addEventListener('submit', async function(e){
		e.preventDefault();
		try {
			var formData = {
				firstName: (document.getElementById('newPatientFirstName')||{}).value,
				lastName: (document.getElementById('newPatientLastName')||{}).value,
				dob: (document.getElementById('newPatientDob')||{}).value,
				gender: (document.getElementById('newPatientGender')||{}).value,
				email: (document.getElementById('newPatientEmail')||{}).value,
				phone: (document.getElementById('newPatientPhone')||{}).value,
				address: (document.getElementById('newPatientAddress')||{}).value,
				barangay: (document.getElementById('newPatientBarangay')||{}).value,
				city: (document.getElementById('newPatientCity')||{}).value,
				zipCode: (document.getElementById('newPatientZipCode')||{}).value,
				bloodType: (document.getElementById('newPatientBloodType')||{}).value,
				allergies: (document.getElementById('newPatientAllergies')||{}).value,
				conditions: (document.getElementById('newPatientConditions')||{}).value,
				medications: (document.getElementById('newPatientMedications')||{}).value,
				emergencyName: (document.getElementById('newPatientEmergencyName')||{}).value,
				emergencyRelationship: (document.getElementById('newPatientEmergencyRelationship')||{}).value,
				emergencyPhone: (document.getElementById('newPatientEmergencyPhone')||{}).value
			};
			var required = ['firstName','lastName','dob','gender','phone','address','barangay','city','zipCode'];
			var missing = required.filter(function(k){ var v = formData[k]; return !v || String(v).trim() === ''; });
			if (missing.length > 0) { window.DocDash.showNotification('error','Missing Required Fields','Please fill in: ' + missing.join(', ')); return; }
			if (submitBtn) { var original = submitBtn.textContent; submitBtn.textContent = 'Saving...'; submitBtn.disabled = true; }
			var response = await fetch('/4care/Doc-Dash/Back-end/api/save-patient.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
			var result = await response.json();
			if (result.success) {
				if (typeof window.DocDash.loadPatientsFromDatabase === 'function') await window.DocDash.loadPatientsFromDatabase();
				if (typeof window.updatePrescriptionPatientDropdown === 'function') window.updatePrescriptionPatientDropdown();
				window.DocDash.logActivity('Doctor', 'Added New Patient', 'Patient: ' + formData.firstName + ' ' + formData.lastName + ' (ID: ' + result.patient_id + ')', null, formData);
				window.DocDash.showNotification('success','Patient Added Successfully!','Patient ' + formData.firstName + ' ' + formData.lastName + ' has been saved to the database.');
				form.reset();
				prefillPatientId();
			} else {
				window.DocDash.showNotification('error','Error Adding Patient', result.message);
			}
		} catch (e) {
			window.DocDash.showNotification('error','Connection Error','Failed to connect to server. Please try again.');
		} finally {
			if (submitBtn) { submitBtn.textContent = 'Submit'; submitBtn.disabled = false; }
		}
	});

})();


