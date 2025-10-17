// Data load and populate cache + modal wiring

const CONSTANTS = window.CONSTANTS || {
    PLACEHOLDER_TEXTS: { NOT_SPECIFIED:'', NONE_REPORTED:'', NOT_ASSIGNED:'', WELCOME_BACK:'Warm Greetings!', HEALTH_JOURNEY_TEXT:'Your health journey, simplified. View your history, and stay connected with 4Care.' },
    API_ENDPOINTS: { PATIENT_DETAILS_GET: 'Back-end/patient-details-get.php', PATIENT_DETAILS_UPDATE: 'Back-end/patient-details-update.php', SIGNUP_LOOKUP: '../Main-Dash/Back-end/signup-db.php' }
};

let cachedPatientData = null;
let originalPatientData = null;
let originalProfilePhoto = null;
let selectedProfilePhoto = null;
let selectedIdPhoto = null;

// Guard: ensure optional helper doesn't break population flow if not defined elsewhere
if (typeof window.updateIdDisplay !== 'function') {
    window.updateIdDisplay = function(){ /* no-op when ID display UI is absent */ };
}

function initializeStaticText() {
    const welcomeHeading = document.getElementById('welcomeHeading');
    const healthJourneyText = document.getElementById('healthJourneyText');
    if (welcomeHeading) welcomeHeading.textContent = CONSTANTS.PLACEHOLDER_TEXTS.WELCOME_BACK;
    if (healthJourneyText) healthJourneyText.textContent = CONSTANTS.PLACEHOLDER_TEXTS.HEALTH_JOURNEY_TEXT;
}

function loadProfilePhoto(profilePhotoData) {
    const patientProfilePhoto = document.getElementById('patientProfilePhoto');
    const modalPatientProfilePhoto = document.getElementById('modalPatientProfilePhoto');
    if (profilePhotoData && profilePhotoData.trim() !== '') {
        if (patientProfilePhoto) patientProfilePhoto.src = profilePhotoData;
        if (modalPatientProfilePhoto) modalPatientProfilePhoto.src = profilePhotoData;
    }
}

function populateModalDisplay(data) {
    const d = data || {};
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || ''; };
    const first = d.accountFirstName || d.firstName || '';
    const last = d.accountLastName || d.lastName || '';
    const fullName = (first && last) ? `${first} ${last}` : '';
    setText('modalPatientName', fullName);
    setText('modalDisplayFullName', fullName);
    setText('modalDisplayGender', d.gender || '');
    setText('modalDisplayAge', d.age ? `${d.age} years` : '');
    setText('modalDisplayDateOfBirth', d.birthDate || d.dob || '');
    setText('modalDisplayBloodType', d.bloodType || '');
    setText('modalDisplayCivilStatus', d.civilStatus || '');
    setText('modalDisplayPhone', d.contact || d.phone || '');
    // Show signup email as read-only
    setText('modalDisplayEmail', d.signupEmail || d.email || '');
    setText('modalDisplayAddress', d.address || '');
    setText('modalDisplayEmergencyContact', d.emergencyContact || d.emergencyName || '');
    setText('modalDisplayAllergies', d.allergy || d.allergies || '');
    setText('modalDisplayMedications', d.medications || '');
    setText('modalDisplayImmunizationHistory', d.immunizationHistory || '');
    setText('modalDisplayBarangay', d.barangay || '');
    setText('modalDisplayRegistrationDate', d.registrationDate || d.created_at || d.date_created || '');
    loadProfilePhoto(d.profile_photo);
}

function setTextMany(ids, value) {
    if (!Array.isArray(ids)) return;
    ids.forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = value || ''; });
}

function switchToReadOnlyMode() {
    ['personalInfoReadOnly','contactInfoReadOnly','medicalInfoReadOnly','additionalInfoReadOnly'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });
    ['personalInfoEdit','contactInfoEdit','medicalInfoEdit','additionalInfoEdit'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    const changeBtn = document.getElementById('changeModalProfilePhotoBtn'); if (changeBtn) changeBtn.style.display = 'none';
    const saveBtn = document.getElementById('savePatientInfoBtn'); if (saveBtn) saveBtn.style.display = 'none';
    const editBtn = document.getElementById('editPatientInfoBtn'); if (editBtn) editBtn.style.display = 'block';
    const cancelBtn = document.getElementById('cancelEditBtn'); if (cancelBtn) cancelBtn.style.display = 'none';
}

function switchToEditMode() {
    // Hide read-only sections
    ['personalInfoReadOnly','contactInfoReadOnly','medicalInfoReadOnly','additionalInfoReadOnly'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    // Show edit sections
    ['personalInfoEdit','contactInfoEdit','medicalInfoEdit','additionalInfoEdit'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });
    const changeBtn = document.getElementById('changeModalProfilePhotoBtn'); if (changeBtn) changeBtn.style.display = 'flex';
    const saveBtn = document.getElementById('savePatientInfoBtn'); if (saveBtn) saveBtn.style.display = 'block';
    const editBtn = document.getElementById('editPatientInfoBtn'); if (editBtn) editBtn.style.display = 'none';
    const cancelBtn = document.getElementById('cancelEditBtn'); if (cancelBtn) cancelBtn.style.display = 'block';
}

function populateEditFieldsFromCache() {
    const d = (window.__patientData && window.__patientData.cache) || {};
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    setVal('editFirstName', d.accountFirstName || d.firstName);
    setVal('editLastName', d.accountLastName || d.lastName);
    setVal('editGender', d.gender);
    setVal('editAge', d.age);
    setVal('editDateOfBirth', d.birthDate || d.dob);
    setVal('editBloodType', d.bloodType);
    setVal('editCivilStatus', d.civilStatus);
    setVal('editPhone', d.contact || d.phone);
    // Email input removed from edit; nothing to set
    setVal('editAddress', d.address);
    setVal('editEmergencyContact', d.emergencyContact || d.emergencyName);
    setVal('editAllergies', d.allergy || d.allergies);
    setVal('editMedications', d.medications);
    setVal('editImmunizationHistory', d.immunizationHistory);
    setVal('editChronicDisease', d.chronicDisease);
    setVal('editImmunization', d.immunization);
    setVal('editBarangay', d.barangay);
    setVal('editRegistrationDate', d.registrationDate || d.created_at || d.date_created);
}



document.addEventListener('DOMContentLoaded', async () => {
    initializeStaticText();
    if (typeof initSpeakButtons === 'function') initSpeakButtons();
    try {
        // Derive email from localStorage first (login gmail), fallback to sessionStorage, then DOM
        let email = (localStorage.getItem('userEmail') || '').trim();
        if (!email) {
            email = (sessionStorage.getItem('userEmail') || '').trim();
        }
        if (!email) {
            const displayEmailEl = document.getElementById('displayEmail');
            if (displayEmailEl) email = (displayEmailEl.textContent || '').trim();
        }
        // For testing purposes, if still no email, try to get from URL params
        if (!email) {
            const urlParams = new URLSearchParams(window.location.search);
            email = urlParams.get('email') || '';
        }
        // Last resort: hardcode Nathaniel's email for testing
        if (!email) {
            email = 'nathanielbautista0302@gmail.com';
            console.log('[PatientCard] Using hardcoded email for testing:', email);
        }
        if (!email) {
            console.warn('[PatientCard] No email found in localStorage, sessionStorage, DOM, or URL params; cannot load profile card.');
        }
        if (email) {
            console.log('[PatientCard] Fetching profile for email:', email);
            const url = CONSTANTS.API_ENDPOINTS.PATIENT_DETAILS_GET + '?email=' + encodeURIComponent(email);
            console.log('[PatientCard] GET', url);
            const res = await fetch(url);
            let payload;
            try { payload = await res.json(); } catch (e) { payload = { ok:false, error: 'Invalid JSON', raw: await res.text().catch(() => '') }; }
            console.log('[PatientCard] Response status:', res.status, 'payload:', payload);
            const displayEmail = document.getElementById('displayEmail');
            if (displayEmail) displayEmail.textContent = email;
            const clearDisplays = () => {
                const ids = ['displayPatientName','displayGender','displayAge','displayBloodType','displayCivilStatus','displayPhone','displayAddress','displayBarangay','displayEmergencyContact'];
                ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
                const welcome = document.getElementById('welcomeHeading'); if (welcome) welcome.textContent = 'Warm Greetings!';
            };
            if (payload && payload.ok) {
                const d = payload.data || null; cachedPatientData = d;
                loadProfilePhoto(d && d.profile_photo);
                updateIdDisplay(d && d.idPhoto);
                // Prefer account first/last name for card display, fallback to profile names
                const first = (d && (d.accountFirstName || d.firstName)) || '';
                const last = (d && (d.accountLastName || d.lastName)) || '';
                const fullName = (first && last) ? `${first} ${last}` : '';
                const displayFullName = document.getElementById('displayFullName'); if (displayFullName) displayFullName.textContent = fullName;
                setTextMany(['displayPatientName','patientName'], fullName);
                const welcome = document.getElementById('welcomeHeading'); if (welcome) welcome.textContent = fullName ? `Warm Greetings! ${fullName}` : 'Warm Greetings!';
                if (!d) { clearDisplays(); }
                else {
                    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
                    const genderVal = d.gender || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const ageVal = d.age ? `${d.age} years` : CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const dobVal = d.birthDate || d.dob || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const bloodVal = d.bloodType || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const civilVal = d.civilStatus || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const phoneVal = d.contact || d.phone || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const addrVal = d.address || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const emerVal = d.emergencyContact || d.emergencyName || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;
                    const brgyVal = d.barangay || CONSTANTS.PLACEHOLDER_TEXTS.NOT_SPECIFIED;

                    setText('displayGender', genderVal);
                    setTextMany(['patientGender'], genderVal);
                    setText('displayAge', ageVal);
                    setTextMany(['patientAge'], ageVal);
                    setText('displayDateOfBirth', dobVal);
                    setText('displayBloodType', bloodVal);
                    setTextMany(['patientBloodType'], bloodVal);
                    setText('displayCivilStatus', civilVal);
                    setTextMany(['patientCivilStatus'], civilVal);
                    setText('displayPhone', phoneVal);
                    setTextMany(['patientContact','patientPhone'], phoneVal);
                    setText('displayAddress', addrVal);
                    setTextMany(['patientAddress'], addrVal);
                    setText('displayBarangay', brgyVal);
                    setText('displayEmergencyContact', emerVal);
                    setTextMany(['patientEmergencyContact'], emerVal);
                    setText('modalDisplayRegistrationDate', d.registrationDate || '');
                }
            } else {
                console.warn('[PatientCard] Failed to load profile card data:', payload && payload.error ? payload.error : 'Unknown error');
                clearDisplays();
            }
        }
    } catch (e) {}

    // Wire up View Full Profile modal open/close
    const patientInfoTriggerBtn = document.getElementById('patientInfoTrigger');
    const patientInfoModal = document.getElementById('patientInfoModal');
    const closePatientInfoModalBtn = document.getElementById('closePatientInfoModalBtn');
    if (patientInfoTriggerBtn && patientInfoModal) {
        patientInfoTriggerBtn.addEventListener('click', () => {
            populateModalDisplay(cachedPatientData);
            switchToReadOnlyMode();
            patientInfoModal.classList.add('active');
        });
    }
    if (closePatientInfoModalBtn && patientInfoModal) {
        closePatientInfoModalBtn.addEventListener('click', () => { patientInfoModal.classList.remove('active'); });
        patientInfoModal.addEventListener('click', (event) => { if (event.target === patientInfoModal) patientInfoModal.classList.remove('active'); });
    }

    // Wire up Edit / Cancel / Save buttons
    const editPatientInfoBtn = document.getElementById('editPatientInfoBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const savePatientInfoBtn = document.getElementById('savePatientInfoBtn');
    const changeModalProfilePhotoBtn = document.getElementById('changeModalProfilePhotoBtn');
    const profilePhotoUpload = document.getElementById('profilePhotoUpload');

    if (editPatientInfoBtn) {
        editPatientInfoBtn.addEventListener('click', () => {
            populateEditFieldsFromCache();
            switchToEditMode();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            populateModalDisplay(cachedPatientData);
            switchToReadOnlyMode();
        });
    }

    // Wire up profile photo change: open file picker on plus button
    if (changeModalProfilePhotoBtn && profilePhotoUpload) {
        changeModalProfilePhotoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            profilePhotoUpload.click();
        });

        profilePhotoUpload.addEventListener('change', () => {
            const file = profilePhotoUpload.files && profilePhotoUpload.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
            const maxBytes = 2 * 1024 * 1024; // 2MB
            if (file.size > maxBytes) { alert('Image too large. Max 2MB.'); return; }
            const reader = new FileReader();
            reader.onload = () => {
                selectedProfilePhoto = reader.result || null;
                // Preview in modal and card
                loadProfilePhoto(selectedProfilePhoto);
                const saveBtn = document.getElementById('savePatientInfoBtn');
                if (saveBtn) saveBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }


    if (savePatientInfoBtn) {
        savePatientInfoBtn.addEventListener('click', async () => {
            // Build a robust email value from session/cache since the input was removed
            const emailFromState = (
                (localStorage.getItem('userEmail') || '') ||
                (cachedPatientData && (cachedPatientData.signupEmail || cachedPatientData.email) || '') ||
                (document.getElementById('displayEmail') ? document.getElementById('displayEmail').textContent.trim() : '')
            ).trim();
            if (!emailFromState) {
                alert('Email not found in session. Please re-login.');
                return;
            }

            // Minimal save: send a subset safely if API exists
            const payload = {
                email: emailFromState,
                firstName: document.getElementById('editFirstName')?.value || '',
                lastName: document.getElementById('editLastName')?.value || '',
                gender: document.getElementById('editGender')?.value || '',
                age: document.getElementById('editAge')?.value || '',
                contact: document.getElementById('editPhone')?.value || '',
                address: document.getElementById('editAddress')?.value || '',
                barangay: document.getElementById('editBarangay')?.value || '',
                emergencyContact: document.getElementById('editEmergencyContact')?.value || '',
                birthDate: document.getElementById('editDateOfBirth')?.value || '',
                
            };

            if (selectedProfilePhoto) {
                payload.profile_photo = selectedProfilePhoto;
            }


            try {
                const res = await fetch(CONSTANTS.API_ENDPOINTS.PATIENT_DETAILS_UPDATE, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                let data;
                try { data = await res.json(); } catch (_) { data = { ok:false, error: await res.text().catch(() => 'Unknown error') }; }
                if (res.ok && data && data.ok) {
                    // Merge into cache and refresh read-only view
                    window.__patientData.cache = Object.assign({}, window.__patientData.cache || {}, payload);
                    populateModalDisplay(window.__patientData.cache);
                    
                    // Update main dashboard display
                    const first = payload.firstName || '';
                    const last = payload.lastName || '';
                    const fullName = (first && last) ? `${first} ${last}` : '';
                    const displayFullName = document.getElementById('displayFullName');
                    if (displayFullName) displayFullName.textContent = fullName;
                    
                    // Update welcome heading
                    const welcome = document.getElementById('welcomeHeading');
                    if (welcome) welcome.textContent = fullName ? `Warm Greetings! ${fullName}` : 'Warm Greetings!';
                    
                    switchToReadOnlyMode();
                    alert('Patient information updated successfully!');
                } else {
                    const msg = (data && data.error) ? data.error : 'Error updating patient information.';
                    alert(msg);
                }
            } catch (e) {
                alert('Network error updating patient information.');
            }
        });
    }
});

// ===== Voice Input in Patient-Dash Edit Modal (View Full Profile -> Edit) =====
(function(){
  function attachMicToField(input){
    if (!input || input.dataset.hasMic === 'true') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'voice-input-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    if (input.parentNode) { input.parentNode.insertBefore(wrapper, input); wrapper.appendChild(input); }
    try { input.style.paddingRight = '40px'; } catch(_) {}
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'voice-btn-inside';
    btn.style.position = 'absolute';
    btn.style.right = '10px';
    btn.style.top = '50%';
    btn.style.transform = 'translateY(-50%)';
    btn.style.color = '#1a73e8';
    btn.style.background = 'transparent';
    btn.style.border = 'none';
    btn.style.lineHeight = '1';
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    wrapper.appendChild(btn);
    input.dataset.hasMic = 'true';
    btn.addEventListener('click', function(){
      try {
        const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        rec.lang = 'en-PH';
        rec.continuous = false;
        rec.onresult = function(e){
          const t = e.results[0][0].transcript || '';
          input.value = t;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        };
        rec.onend = function(){ btn.innerHTML = '<i class="fas fa-microphone"></i>'; };
        rec.start();
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      } catch(_) {}
    });
  }

  // Attach when edit mode is shown
  // Buttons that toggle edit views per file
  function wireEditButtons(){
    const btn = document.getElementById('editPatientInfoBtn');
    if (btn) btn.addEventListener('click', function(){ setTimeout(() => {
      attachMicToField(document.getElementById('editAge'));
      attachMicToField(document.getElementById('editPhone'));
      attachMicToField(document.getElementById('editAddress'));
    }, 50); });

    const contactBtn = document.getElementById('editContactInfoBtn');
    if (contactBtn) contactBtn.addEventListener('click', function(){ setTimeout(() => {
      attachMicToField(document.getElementById('editPhone'));
      attachMicToField(document.getElementById('editAddress'));
    }, 50); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireEditButtons); else wireEditButtons();
})();

window.__patientData = { get cache() { return cachedPatientData; }, set cache(v) { cachedPatientData = v; } };


