// Patient Details: modal open/close, validation hooks, camera, file handling, submission

document.addEventListener('DOMContentLoaded', () => {
    const patientDetailsModal = document.getElementById('patientDetailsModal');
    const closePatientDetailsModalBtn = document.getElementById('closePatientDetailsModalBtn');
    const patientDetailsForm = document.getElementById('patientDetailsForm');
    const patientBirthdateInput = document.getElementById('patientBirthdate');
    const patientGenderSelect = document.getElementById('patientGender');
    const patientContactInput = document.getElementById('patientContact');
    const patientAddressInput = document.getElementById('patientAddress');
    const patientBirthdateError = document.getElementById('patientBirthdateError');
    const patientGenderError = document.getElementById('patientGenderError');
    const patientContactError = document.getElementById('patientContactError');
    const patientAddressError = document.getElementById('patientAddressError');
    const patientDetailsSuccessMessage = document.getElementById('patientDetailsSuccessMessage');

    const patientBarangayNumberInput = document.getElementById('patientBarangayNumber');
    const patientMiddleNameInput = document.getElementById('patientMiddleName');
    const patientAgeInput = document.getElementById('patientAge');
    const patientCivilStatusSelect = document.getElementById('patientCivilStatus');
    const patientReligionInput = document.getElementById('patientReligion');
    const patientWorkInput = document.getElementById('patientWork');
    const patientMotherNameInput = document.getElementById('patientMotherName');
    const patientFatherNameInput = document.getElementById('patientFatherName');
    const patientImmunizationHistoryInput = document.getElementById('patientImmunizationHistory');
    const patientAllergyInput = document.getElementById('patientAllergy');
    const patientBloodTypeSelect = document.getElementById('patientBloodType');
    const patientIdUploadInput = document.getElementById('patientIdUpload');

    const cameraFeed = document.getElementById('cameraFeed');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const profilePhotoFile = document.getElementById('profilePhotoFile');
    const photoCanvas = document.getElementById('photoCanvas');
    const capturedPhoto = document.getElementById('capturedPhoto');
    const profilePhotoDisplay = document.getElementById('profilePhotoDisplay');
    const displayProfilePhoto = document.getElementById('displayProfilePhoto');
    const capturedPhotoError = document.getElementById('capturedPhotoError');
    const cameraControls = document.getElementById('cameraControls');
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const retakePhotoBtn = document.getElementById('retakePhotoBtn');
    const photoFrame = document.getElementById('photoFrame');
    const framePlaceholder = document.getElementById('framePlaceholder');

    const contactPattern = /^(09|\+639)\d{9}$/;
    const addressPattern = /^[a-zA-Z0-9\s,.'-]+$/;
    const barangayNumberPattern = /^\d+$/;
    const agePattern = /^\d+$/;
    const namePattern = /^[a-zA-Z\s'-]+$/;

    // Expose open function for auth.js to call after successful signup
    window.__openPatientDetailsModal = function openPatientDetailsModal() {
        if (!patientDetailsModal) return;
        patientDetailsModal.classList.add('active');
        patientBirthdateInput && patientBirthdateInput.focus();
        setupCamera();
    };

    function closePatientDetailsModal() {
        if (!patientDetailsModal || !patientDetailsForm) return;
        patientDetailsModal.classList.remove('active');
        patientDetailsForm.reset();
        [patientBirthdateInput, patientGenderSelect, patientContactInput, patientAddressInput, patientBarangayNumberInput, patientMiddleNameInput, patientAgeInput, patientCivilStatusSelect, patientReligionInput, patientWorkInput, patientMotherNameInput, patientFatherNameInput, patientImmunizationHistoryInput, patientAllergyInput, patientBloodTypeSelect, patientIdUploadInput].forEach(el => el && el.classList.remove('error', 'success'));
        [patientBirthdateError, patientGenderError, patientContactError, patientAddressError].forEach(el => el && (el.style.display = 'none'));
        patientDetailsSuccessMessage && (patientDetailsSuccessMessage.style.display = 'none');
        if (capturedPhoto) { capturedPhoto.style.display = 'none'; capturedPhoto.src = ''; }
        if (cameraFeed && cameraFeed.srcObject) { try { cameraFeed.srcObject.getTracks().forEach(t => t.stop()); } catch {} }
    }

    if (closePatientDetailsModalBtn) closePatientDetailsModalBtn.addEventListener('click', closePatientDetailsModal);
    if (patientDetailsModal) patientDetailsModal.addEventListener('click', (event) => { if (event.target === patientDetailsModal) closePatientDetailsModal(); });

    function validateInput(inputElement, pattern, errorElementId) {
        const errorElement = document.getElementById(errorElementId);
        const value = (inputElement && inputElement.value || '').trim();
        let isValid = true; let errorMessage = '';
        if (inputElement && inputElement.hasAttribute('required') && value === '') { isValid = false; errorMessage = 'This field is required.'; }
        else if (pattern && value !== '' && !pattern.test(value)) {
            isValid = false;
            if (inputElement.type === 'tel') errorMessage = 'Please enter a valid 11-digit contact number (e.g., 09123456789).';
            else if (inputElement.type === 'number') errorMessage = 'Please enter a valid number.';
            else if (inputElement.tagName === 'SELECT') errorMessage = 'Please select an option.';
            else if (inputElement.id === 'patientBarangayNumber') errorMessage = 'Please enter a valid barangay number (digits only).';
            else if (inputElement.id === 'patientAge') errorMessage = 'Please enter a valid age (digits only).';
            else if (['patientMiddleName','patientReligion','patientWork','patientMotherName','patientFatherName'].includes(inputElement.id)) errorMessage = 'Please enter a valid name/text.';
            else errorMessage = `Please enter a valid ${(inputElement.placeholder || 'value').toLowerCase()}.`;
        }
        if (inputElement) {
            if (isValid) { inputElement.classList.remove('error'); inputElement.classList.add('success'); if (errorElement) errorElement.style.display = 'none'; }
            else { inputElement.classList.remove('success'); inputElement.classList.add('error'); if (errorElement) { errorElement.style.display = 'block'; errorElement.textContent = errorMessage; } }
        }
        return isValid;
    }

    // Live validation bindings
    if (patientBirthdateInput) patientBirthdateInput.addEventListener('input', () => validateInput(patientBirthdateInput, /.+/, 'patientBirthdateError'));
    if (patientGenderSelect) patientGenderSelect.addEventListener('change', () => validateInput(patientGenderSelect, /.+/, 'patientGenderError'));
    if (patientContactInput) patientContactInput.addEventListener('input', () => validateInput(patientContactInput, contactPattern, 'patientContactError'));
    if (patientAddressInput) patientAddressInput.addEventListener('input', () => validateInput(patientAddressInput, addressPattern, 'patientAddressError'));
    if (patientBarangayNumberInput) patientBarangayNumberInput.addEventListener('input', () => validateInput(patientBarangayNumberInput, barangayNumberPattern, 'patientBarangayNumberError'));
    if (patientMiddleNameInput) patientMiddleNameInput.addEventListener('input', () => validateInput(patientMiddleNameInput, namePattern, 'patientMiddleNameError'));
    if (patientAgeInput) patientAgeInput.addEventListener('input', () => validateInput(patientAgeInput, agePattern, 'patientAgeError'));
    if (patientCivilStatusSelect) patientCivilStatusSelect.addEventListener('change', () => validateInput(patientCivilStatusSelect, /.+/, 'patientCivilStatusError'));
    if (patientReligionInput) patientReligionInput.addEventListener('input', () => validateInput(patientReligionInput, namePattern, 'patientReligionError'));
    if (patientWorkInput) patientWorkInput.addEventListener('input', () => validateInput(patientWorkInput, namePattern, 'patientWorkError'));
    if (patientMotherNameInput) patientMotherNameInput.addEventListener('input', () => validateInput(patientMotherNameInput, namePattern, 'patientMotherNameError'));
    if (patientFatherNameInput) patientFatherNameInput.addEventListener('input', () => validateInput(patientFatherNameInput, namePattern, 'patientFatherNameError'));
    if (patientImmunizationHistoryInput) patientImmunizationHistoryInput.addEventListener('input', () => validateInput(patientImmunizationHistoryInput, /.+/, 'patientImmunizationHistoryError'));
    if (patientAllergyInput) patientAllergyInput.addEventListener('input', () => validateInput(patientAllergyInput, /.+/, 'patientAllergyError'));
    if (patientBloodTypeSelect) patientBloodTypeSelect.addEventListener('change', () => validateInput(patientBloodTypeSelect, /.+/, 'patientBloodTypeError'));

    if (patientIdUploadInput) patientIdUploadInput.addEventListener('change', () => {
        if (patientIdUploadInput.files && patientIdUploadInput.files.length > 0) {
            const file = patientIdUploadInput.files[0];
            if (file.type && file.type.startsWith('image/')) {
                patientIdUploadInput.classList.remove('error');
                patientIdUploadInput.classList.add('success');
                const el = document.getElementById('patientIdUploadError');
                if (el) el.style.display = 'none';
            } else {
                patientIdUploadInput.classList.remove('success');
                patientIdUploadInput.classList.add('error');
                const el = document.getElementById('patientIdUploadError');
                if (el) { el.style.display = 'block'; el.textContent = 'Please upload a valid image file.'; }
            }
        }
    });

    // ===== Voice Input: attach mic buttons to Basic Information fields =====
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
                const rec = new SpeechRecognition();
                rec.lang = 'en-PH';
                rec.continuous = false;
                rec.onresult = function(e){
                    const t = e.results[0][0].transcript || '';
                    input.value = t;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                };
                rec.onend = function(){ btn.innerHTML = '<i class=\"fas fa-microphone\"></i>'; };
                rec.start();
                btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            } catch(_) {}
        });
    }

    // Attach mics to target fields
    attachMicToField(patientAgeInput);
    attachMicToField(patientContactInput);
    attachMicToField(patientAddressInput);

    // Camera handling
    let mediaStream;
    function fitMediaToFrame() {
        if (!photoFrame) return;
        const fw = photoFrame.clientWidth; const fh = photoFrame.clientHeight;
        if (cameraFeed) { Object.assign(cameraFeed.style, { position: 'absolute', left: '0', top: '0', width: fw + 'px', height: fh + 'px', objectFit: 'cover' }); }
        if (capturedPhoto) { Object.assign(capturedPhoto.style, { position: 'absolute', left: '0', top: '0', width: fw + 'px', height: fh + 'px', objectFit: 'cover' }); }
    }
    async function setupCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (cameraFeed) { cameraFeed.srcObject = mediaStream; cameraFeed.style.display = 'block'; }
            if (cameraControls) cameraControls.style.display = 'flex';
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'inline-flex';
            if (retakePhotoBtn) retakePhotoBtn.style.display = 'none';
            if (capturedPhoto) { capturedPhoto.style.display = 'none'; capturedPhoto.classList.add('hidden'); capturedPhoto.src = ''; }
            if (capturedPhotoError) capturedPhotoError.style.display = 'none';
            if (framePlaceholder) framePlaceholder.style.display = 'none';
            fitMediaToFrame();
        } catch (err) {
            if (cameraFeed) cameraFeed.style.display = 'none';
            if (capturedPhotoError) capturedPhotoError.style.display = 'none';
            if (!capturedPhoto || !capturedPhoto.src) { if (framePlaceholder) framePlaceholder.style.display = 'flex'; }
        }
    }
    function captureCurrentFrame() {
        fitMediaToFrame();
        if (!cameraFeed || !photoCanvas || !capturedPhoto) return;
        photoCanvas.width = cameraFeed.videoWidth; photoCanvas.height = cameraFeed.videoHeight;
        photoCanvas.getContext('2d').drawImage(cameraFeed, 0, 0, photoCanvas.width, photoCanvas.height);
        const dataURL = photoCanvas.toDataURL('image/jpeg', 0.9);
        capturedPhoto.src = dataURL;
        capturedPhoto.style.display = 'block';
        capturedPhoto.classList.remove('hidden');
        if (capturedPhotoError) capturedPhotoError.style.display = 'none';
        if (cameraFeed) cameraFeed.style.display = 'none';
        fitMediaToFrame();
        if (displayProfilePhoto && profilePhotoDisplay) { displayProfilePhoto.src = dataURL; profilePhotoDisplay.classList.remove('hidden'); }
        if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
        if (retakePhotoBtn) retakePhotoBtn.style.display = 'inline-flex';
    }
    if (takePhotoBtn) takePhotoBtn.addEventListener('click', () => { setupCamera().then(() => { if (!mediaStream && capturedPhotoError) { capturedPhotoError.style.display = 'block'; capturedPhotoError.textContent = 'Camera not available on this device. Please choose a photo instead.'; } }); });
    if (capturePhotoBtn) capturePhotoBtn.addEventListener('click', () => { if (!mediaStream) { setupCamera().then(() => { if (mediaStream) captureCurrentFrame(); }); } else { captureCurrentFrame(); } });
    if (retakePhotoBtn) retakePhotoBtn.addEventListener('click', () => {
        if (!mediaStream) setupCamera(); else {
            if (cameraFeed) cameraFeed.style.display = 'block';
            if (cameraControls) cameraControls.style.display = 'flex';
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'inline-flex';
            if (retakePhotoBtn) retakePhotoBtn.style.display = 'none';
            if (capturedPhoto) { capturedPhoto.style.display = 'none'; capturedPhoto.classList.add('hidden'); }
            fitMediaToFrame();
        }
    });
    if (profilePhotoFile) profilePhotoFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0]; if (!file) return;
        const mime = (file.type || '').toLowerCase(); if (!(mime.indexOf('image/') === 0)) { if (capturedPhotoError) { capturedPhotoError.style.display = 'block'; capturedPhotoError.textContent = 'Please select a valid image file.'; } return; }
        const reader = new FileReader(); reader.onload = () => {
            const dataUrl = reader.result; if (!capturedPhoto) return;
            capturedPhoto.setAttribute('src', dataUrl);
            capturedPhoto.style.display = 'block';
            capturedPhoto.classList.remove('hidden');
            if (capturedPhotoError) { capturedPhotoError.textContent = ''; capturedPhotoError.style.display = 'none'; }
            if (cameraFeed) cameraFeed.style.display = 'none';
            if (cameraControls) cameraControls.style.display = 'flex';
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
            if (retakePhotoBtn) retakePhotoBtn.style.display = 'inline-flex';
            if (framePlaceholder) framePlaceholder.style.display = 'none';
            fitMediaToFrame();
            if (displayProfilePhoto && profilePhotoDisplay) { displayProfilePhoto.src = dataUrl; profilePhotoDisplay.classList.remove('hidden'); }
            if (mediaStream) { try { mediaStream.getTracks().forEach(track => track.stop()); } catch {} mediaStream = null; }
            if (cameraFeed) { cameraFeed.srcObject = null; cameraFeed.style.display = 'none'; }
        }; reader.readAsDataURL(file);
    });
    window.addEventListener('resize', fitMediaToFrame);

    // Submit patient details
    if (patientDetailsForm) patientDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ok = [
            validateInput(patientBirthdateInput, /.+/, 'patientBirthdateError'),
            validateInput(patientGenderSelect, /.+/, 'patientGenderError'),
            validateInput(patientContactInput, contactPattern, 'patientContactError'),
            validateInput(patientAddressInput, addressPattern, 'patientAddressError'),
            validateInput(patientBarangayNumberInput, barangayNumberPattern, 'patientBarangayNumberError'),
            validateInput(patientMiddleNameInput, namePattern, 'patientMiddleNameError'),
            validateInput(patientAgeInput, agePattern, 'patientAgeError'),
            validateInput(patientCivilStatusSelect, /.+/, 'patientCivilStatusError'),
            validateInput(patientReligionInput, namePattern, 'patientReligionError'),
            validateInput(patientWorkInput, namePattern, 'patientWorkError'),
            validateInput(patientMotherNameInput, namePattern, 'patientMotherNameError'),
            validateInput(patientFatherNameInput, namePattern, 'patientFatherNameError'),
            validateInput(patientImmunizationHistoryInput, /.+/, 'patientImmunizationHistoryError'),
            validateInput(patientAllergyInput, /.+/, 'patientAllergyError'),
            validateInput(patientBloodTypeSelect, /.+/, 'patientBloodTypeError')
        ].every(Boolean);
        const photoBase64 = capturedPhoto && capturedPhoto.src ? capturedPhoto.src : '';
        if (!ok) { patientDetailsForm.classList.add('shake'); setTimeout(() => patientDetailsForm.classList.remove('shake'), 400); return; }
        const submitBtn = patientDetailsForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; submitBtn.disabled = true; }
        try {
            let idUploadBase64Sync = '';
            if (patientIdUploadInput && patientIdUploadInput.files && patientIdUploadInput.files.length > 0) {
                const file = patientIdUploadInput.files[0];
                if (file.type && file.type.startsWith('image/')) {
                    idUploadBase64Sync = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (e2) => resolve(e2.target.result); reader.onerror = reject; reader.readAsDataURL(file); });
                }
            }
            const res = await fetch('../Patient-Dash/Back-end/patient-details-save.php?v=' + Date.now(), {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                    email: (localStorage.getItem('userEmail') || ''),
                    birthDate: patientBirthdateInput && patientBirthdateInput.value,
                    age: patientAgeInput && parseInt(patientAgeInput.value, 10),
                    gender: patientGenderSelect && patientGenderSelect.value,
                    civilStatus: patientCivilStatusSelect && patientCivilStatusSelect.value,
                    contact: patientContactInput && patientContactInput.value,
                    barangay: patientBarangayNumberInput && patientBarangayNumberInput.value,
                    address: patientAddressInput && patientAddressInput.value,
                    middleName: patientMiddleNameInput && patientMiddleNameInput.value,
                    religion: patientReligionInput && patientReligionInput.value,
                    work: patientWorkInput && patientWorkInput.value,
                    motherName: patientMotherNameInput && patientMotherNameInput.value,
                    fatherName: patientFatherNameInput && patientFatherNameInput.value,
                    immunizationHistory: patientImmunizationHistoryInput && patientImmunizationHistoryInput.value,
                    allergy: patientAllergyInput && patientAllergyInput.value,
                    bloodType: patientBloodTypeSelect && patientBloodTypeSelect.value,
                    profile_photo: photoBase64
                })
            });
            const raw = await res.text();
            let data; try { data = JSON.parse(raw); } catch (e) { data = { ok:false, error:'Invalid response', raw }; }
            if (res.ok && data.ok) {
                if (patientDetailsSuccessMessage) { patientDetailsSuccessMessage.textContent = 'Details saved successfully!'; patientDetailsSuccessMessage.style.display = 'block'; patientDetailsSuccessMessage.classList.remove('text-red-500'); patientDetailsSuccessMessage.classList.add('text-green-600'); }
            } else {
                if (patientDetailsSuccessMessage) { patientDetailsSuccessMessage.textContent = data.error || 'Save failed. Please try again.'; patientDetailsSuccessMessage.style.display = 'block'; patientDetailsSuccessMessage.classList.remove('text-green-600'); patientDetailsSuccessMessage.classList.add('text-red-500'); }
            }
        } catch (err) {
            if (patientDetailsSuccessMessage) { patientDetailsSuccessMessage.textContent = 'Network error. Please try again.'; patientDetailsSuccessMessage.style.display = 'block'; patientDetailsSuccessMessage.classList.remove('text-green-600'); patientDetailsSuccessMessage.classList.add('text-red-500'); }
        } finally { if (submitBtn) { submitBtn.innerHTML = 'Save Details'; submitBtn.disabled = false; } }
    });
});


