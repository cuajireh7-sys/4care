// Patient Details modal: open/close, validation, camera, upload, and submission

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

    const patientBarangayNumberError = document.getElementById('patientBarangayNumberError');
    const patientMiddleNameError = document.getElementById('patientMiddleNameError');
    const patientAgeError = document.getElementById('patientAgeError');
    const patientCivilStatusError = document.getElementById('patientCivilStatusError');
    const patientReligionError = document.getElementById('patientReligionError');
    const patientWorkError = document.getElementById('patientWorkError');
    const patientMotherNameError = document.getElementById('patientMotherNameError');
    const patientFatherNameError = document.getElementById('patientFatherNameError');
    const patientImmunizationHistoryError = document.getElementById('patientImmunizationHistoryError');
    const patientAllergyError = document.getElementById('patientAllergyError');
    const patientBloodTypeError = document.getElementById('patientBloodTypeError');
    const patientIdUploadError = document.getElementById('patientIdUploadError');
    const capturedPhotoError = document.getElementById('capturedPhotoError');

    // Expose open/close for signup flow
    window.openPatientDetailsModal = function openPatientDetailsModal() {
        if (!patientDetailsModal) return;
        patientDetailsModal.classList.add('active');
        patientBirthdateInput && patientBirthdateInput.focus();
        setupCamera();
    };
    function closePatientDetailsModal() {
        if (!patientDetailsModal || !patientDetailsForm) return;
        patientDetailsModal.classList.remove('active');
        patientDetailsForm.reset();
        [patientBirthdateInput, patientGenderSelect, patientContactInput, patientAddressInput].forEach(inp => inp && inp.classList.remove('error', 'success'));
        patientDetailsSuccessMessage && (patientDetailsSuccessMessage.style.display = 'none');
        [patientBarangayNumberInput, patientMiddleNameInput, patientAgeInput, patientCivilStatusSelect, patientReligionInput, patientWorkInput, patientMotherNameInput, patientFatherNameInput, patientImmunizationHistoryInput, patientAllergyInput, patientBloodTypeSelect].forEach(inp => inp && inp.classList.remove('error', 'success'));
        [patientBarangayNumberError, patientMiddleNameError, patientAgeError, patientCivilStatusError, patientReligionError, patientWorkError, patientMotherNameError, patientFatherNameError, patientImmunizationHistoryError, patientAllergyError, patientBloodTypeError, patientIdUploadError, capturedPhotoError].forEach(el => el && (el.style.display = 'none'));
        if (capturedPhoto) { capturedPhoto.style.display = 'none'; capturedPhoto.src = ''; }
        try { if (cameraFeed && cameraFeed.srcObject) cameraFeed.srcObject.getTracks().forEach(track => track.stop()); } catch (_) {}
    }

    if (closePatientDetailsModalBtn) closePatientDetailsModalBtn.addEventListener('click', closePatientDetailsModal);
    if (patientDetailsModal) patientDetailsModal.addEventListener('click', (event) => { if (event.target === patientDetailsModal) closePatientDetailsModal(); });

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const namePattern = /^[a-zA-Z\s'-]+$/;
    const contactPattern = /^(09|\+639)\d{9}$/;
    const addressPattern = /^[a-zA-Z0-9\s,.'-]+$/;
    const barangayNumberPattern = /^\d+$/;
    const agePattern = /^\d+$/;

    function validateInput(inputElement, pattern, errorElementId) {
        const errorElement = document.getElementById(errorElementId);
        const value = (inputElement && inputElement.value || '').trim();
        let isValid = true; let errorMessage = '';
        if (inputElement && inputElement.hasAttribute('required') && value === '') { isValid = false; errorMessage = 'This field is required.'; }
        else if (pattern && value !== '' && !pattern.test(value)) {
            isValid = false;
            if (inputElement.type === 'email') errorMessage = 'Please enter a valid email address.';
            else if (inputElement.type === 'password') errorMessage = 'Password must be at least 6 characters.';
            else if (inputElement.type === 'tel') errorMessage = 'Please enter a valid 11-digit contact number (e.g., 09123456789).';
            else if (inputElement.type === 'date') errorMessage = 'Please enter a valid birthdate.';
            else if (inputElement.type === 'number') errorMessage = 'Please enter a valid number.';
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

    // Camera handlers
    let mediaStream;
    const cameraControls = document.getElementById('cameraControls');
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const retakePhotoBtn = document.getElementById('retakePhotoBtn');
    const framePlaceholder = document.getElementById('framePlaceholder');
    const photoFrame = document.getElementById('photoFrame');

    function fitMediaToFrame() {
        if (!photoFrame) return;
        const fw = photoFrame.clientWidth; const fh = photoFrame.clientHeight;
        if (cameraFeed) { cameraFeed.style.position = 'absolute'; cameraFeed.style.left = '0'; cameraFeed.style.top = '0'; cameraFeed.style.width = fw + 'px'; cameraFeed.style.height = fh + 'px'; cameraFeed.style.objectFit = 'cover'; }
        if (capturedPhoto) { capturedPhoto.style.position = 'absolute'; capturedPhoto.style.left = '0'; capturedPhoto.style.top = '0'; capturedPhoto.style.width = fw + 'px'; capturedPhoto.style.height = fh + 'px'; capturedPhoto.style.objectFit = 'cover'; }
    }

    async function setupCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraFeed.srcObject = mediaStream;
            cameraFeed.style.display = 'block';
            if (cameraControls) cameraControls.style.display = 'flex';
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'inline-flex';
            if (retakePhotoBtn) retakePhotoBtn.style.display = 'none';
            capturedPhoto.style.display = 'none';
            capturedPhoto.classList.add('hidden');
            capturedPhoto.src = '';
            capturedPhotoError.style.display = 'none';
            if (framePlaceholder) framePlaceholder.style.display = 'none';
            fitMediaToFrame();
        } catch (err) {
            cameraFeed.style.display = 'none';
            capturedPhotoError.style.display = 'none';
            if (!capturedPhoto.src && framePlaceholder) framePlaceholder.style.display = 'flex';
        }
    }

    if (takePhotoBtn) takePhotoBtn.addEventListener('click', () => { setupCamera().then(() => { if (!mediaStream) { capturedPhotoError.style.display = 'block'; capturedPhotoError.textContent = 'Camera not available on this device. Please choose a photo instead.'; } }); });

    function captureCurrentFrame() {
        fitMediaToFrame();
        photoCanvas.width = cameraFeed.videoWidth; photoCanvas.height = cameraFeed.videoHeight;
        photoCanvas.getContext('2d').drawImage(cameraFeed, 0, 0, photoCanvas.width, photoCanvas.height);
        const dataURL = photoCanvas.toDataURL('image/jpeg', 0.9);
        capturedPhoto.src = dataURL; capturedPhoto.style.display = 'block'; capturedPhoto.classList.remove('hidden'); capturedPhotoError.style.display = 'none';
        cameraFeed.style.display = 'none'; if (framePlaceholder) framePlaceholder.style.display = 'none'; fitMediaToFrame();
        if (displayProfilePhoto) { displayProfilePhoto.src = dataURL; profilePhotoDisplay && profilePhotoDisplay.classList.remove('hidden'); }
        if (capturePhotoBtn) capturePhotoBtn.style.display = 'none'; if (retakePhotoBtn) retakePhotoBtn.style.display = 'inline-flex';
    }

    if (capturePhotoBtn) capturePhotoBtn.addEventListener('click', () => { if (!mediaStream) { setupCamera().then(() => { if (mediaStream) captureCurrentFrame(); }); } else { captureCurrentFrame(); } });
    if (retakePhotoBtn) retakePhotoBtn.addEventListener('click', () => { if (!mediaStream) { setupCamera(); } else { cameraFeed.style.display = 'block'; if (cameraControls) cameraControls.style.display = 'flex'; if (capturePhotoBtn) capturePhotoBtn.style.display = 'inline-flex'; if (retakePhotoBtn) retakePhotoBtn.style.display = 'none'; capturedPhoto.style.display = 'none'; capturedPhoto.classList.add('hidden'); if (framePlaceholder) framePlaceholder.style.display = 'none'; fitMediaToFrame(); } });

    if (profilePhotoFile) profilePhotoFile.addEventListener('change', (e) => { const file = e.target.files && e.target.files[0]; if (!file) return; const mime = (file.type || '').toLowerCase(); if (!(mime.indexOf('image/') === 0)) { capturedPhotoError.style.display = 'block'; capturedPhotoError.textContent = 'Please select a valid image file.'; return; } const reader = new FileReader(); reader.onload = () => { const dataUrl = reader.result; capturedPhoto.setAttribute('src', dataUrl); capturedPhoto.style.display = 'block'; capturedPhoto.classList.remove('hidden'); capturedPhotoError.textContent = ''; capturedPhotoError.style.display = 'none'; cameraFeed.style.display = 'none'; if (cameraControls) cameraControls.style.display = 'flex'; if (capturePhotoBtn) capturePhotoBtn.style.display = 'none'; if (retakePhotoBtn) retakePhotoBtn.style.display = 'inline-flex'; if (framePlaceholder) framePlaceholder.style.display = 'none'; fitMediaToFrame(); if (displayProfilePhoto) { displayProfilePhoto.src = dataUrl; profilePhotoDisplay && profilePhotoDisplay.classList.remove('hidden'); } try { if (mediaStream) mediaStream.getTracks().forEach(track => track.stop()); } catch (_) {} cameraFeed.srcObject = null; cameraFeed.style.display = 'none'; }; reader.readAsDataURL(file); });

    window.addEventListener('resize', fitMediaToFrame);

    if (patientDetailsForm) patientDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isBirthdateValid = validateInput(patientBirthdateInput, /.+/, 'patientBirthdateError');
        const isGenderValid = validateInput(patientGenderSelect, /.+/, 'patientGenderError');
        const isContactValid = validateInput(patientContactInput, contactPattern, 'patientContactError');
        const isAddressValid = validateInput(patientAddressInput, addressPattern, 'patientAddressError');
        const isBarangayNumberValid = validateInput(patientBarangayNumberInput, barangayNumberPattern, 'patientBarangayNumberError');
        const isMiddleNameValid = validateInput(patientMiddleNameInput, namePattern, 'patientMiddleNameError');
        const isAgeValid = validateInput(patientAgeInput, agePattern, 'patientAgeError');
        const isCivilStatusValid = validateInput(patientCivilStatusSelect, /.+/, 'patientCivilStatusError');
        const isReligionValid = validateInput(patientReligionInput, namePattern, 'patientReligionError');
        const isWorkValid = validateInput(patientWorkInput, namePattern, 'patientWorkError');
        const isMotherNameValid = validateInput(patientMotherNameInput, namePattern, 'patientMotherNameError');
        const isFatherNameValid = validateInput(patientFatherNameInput, namePattern, 'patientFatherNameError');
        const isImmunizationHistoryValid = validateInput(patientImmunizationHistoryInput, /.+/, 'patientImmunizationHistoryError');
        const isAllergyValid = validateInput(patientAllergyInput, /.+/, 'patientAllergyError');
        const isBloodTypeValid = validateInput(patientBloodTypeSelect, /.+/, 'patientBloodTypeError');
            const photoBase64 = capturedPhoto && capturedPhoto.src ? capturedPhoto.src : '';
        if (!(isBirthdateValid && isGenderValid && isContactValid && isAddressValid && isBarangayNumberValid && isMiddleNameValid && isAgeValid && isCivilStatusValid && isReligionValid && isWorkValid && isMotherNameValid && isFatherNameValid && isImmunizationHistoryValid && isAllergyValid && isBloodTypeValid)) { patientDetailsForm.classList.add('shake'); setTimeout(() => patientDetailsForm.classList.remove('shake'), 400); return; }
        const submitBtn = patientDetailsForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; submitBtn.disabled = true; }
        try {
            let idUploadBase64Sync = '';
            if (patientIdUploadInput && patientIdUploadInput.files && patientIdUploadInput.files.length > 0) {
                const file = patientIdUploadInput.files[0];
                if (file.type && file.type.startsWith('image/')) {
                    idUploadBase64Sync = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (ev) => resolve(ev.target.result); reader.onerror = reject; reader.readAsDataURL(file); });
                }
            }
            // Optionally compress large images to avoid network failures
            async function maybeCompress(dataUrl) {
                try {
                    if (!dataUrl || typeof dataUrl !== 'string') return '';
                    // Rough cap ~1.8MB; browsers may reset connection on very large JSON bodies
                    if (dataUrl.length < 1800000) return dataUrl;
                    const img = new Image();
                    const result = await new Promise((resolve) => {
                        img.onload = () => {
                            // Scale down to max dimension 900px preserving aspect
                            const maxDim = 900;
                            let { width, height } = img;
                            if (width > height && width > maxDim) {
                                height = Math.round((maxDim / width) * height); width = maxDim;
                            } else if (height > width && height > maxDim) {
                                width = Math.round((maxDim / height) * width); height = maxDim;
                            } else if (width > maxDim) {
                                width = height = maxDim;
                            }
                            const c = document.createElement('canvas');
                            c.width = width; c.height = height;
                            const ctx = c.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            // Lower quality slightly to keep under limits
                            const compressed = c.toDataURL('image/jpeg', 0.75);
                            resolve(compressed);
                        };
                        img.onerror = () => resolve('');
                        img.src = dataUrl;
                    });
                    return result || '';
                } catch (_) { return ''; }
            }

            const safePhoto = await maybeCompress(photoBase64);

            // Build minimal payload expected by backend
            const payload = {
                email: (localStorage.getItem('userEmail') || document.getElementById('signupEmail')?.value || ''),
                birthDate: patientBirthdateInput.value, // NOTE: capital D to match backend
                age: parseInt(patientAgeInput.value, 10),
                gender: patientGenderSelect.value,
                contact: patientContactInput.value,
                address: patientAddressInput.value,
                barangay: (patientBarangayNumberInput && patientBarangayNumberInput.value) || '',
                emergencyContact: '',
                profile_photo: safePhoto
            };

            const res = await fetch('../Patient-Dash/Back-end/patient-details-save.php?v=' + Date.now(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const raw = await res.text(); let data; try { data = JSON.parse(raw); } catch (e) { data = { ok:false, error:'Invalid response', raw }; }
            if (res.ok && data.ok) { 
                if (patientDetailsSuccessMessage) { 
                    patientDetailsSuccessMessage.textContent = 'Details saved successfully! Please sign in now.'; 
                    patientDetailsSuccessMessage.style.display = 'block'; 
                    patientDetailsSuccessMessage.classList.remove('text-red-500'); 
                    patientDetailsSuccessMessage.classList.add('text-green-600'); 
                }
                
                // Scroll to success message
                if (patientDetailsSuccessMessage) {
                    patientDetailsSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // Start countdown and close modal
                startCountdownAndCloseModal();
            }
            else { if (patientDetailsSuccessMessage) { patientDetailsSuccessMessage.textContent = data.error || 'Save failed. Please try again.'; patientDetailsSuccessMessage.style.display = 'block'; patientDetailsSuccessMessage.classList.remove('text-green-600'); patientDetailsSuccessMessage.classList.add('text-red-500'); } }
        } catch (err) {
            if (patientDetailsSuccessMessage) { patientDetailsSuccessMessage.textContent = 'Network error. Please try again.'; patientDetailsSuccessMessage.style.display = 'block'; patientDetailsSuccessMessage.classList.remove('text-green-600'); patientDetailsSuccessMessage.classList.add('text-red-500'); }
        } finally { if (submitBtn) { submitBtn.innerHTML = 'Save Details'; submitBtn.disabled = false; } }
    });

    // Function to start countdown and close modal
    function startCountdownAndCloseModal() {
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            if (patientDetailsSuccessMessage) {
                patientDetailsSuccessMessage.textContent = `Details saved successfully! Please sign in now. Closing in ${countdown}...`;
            }
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                // Close the modal
                if (patientDetailsModal) {
                    patientDetailsModal.style.display = 'none';
                    patientDetailsModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        }, 1000);
    }
});


