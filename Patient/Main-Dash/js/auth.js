// Authentication: login, signup, forgot password, user agreement, OTP authentication
// Updated: Removed SMS option, direct OTP form after login

document.addEventListener('DOMContentLoaded', () => {
    // OTP Authentication elements (removed unused modals)
    // const otpMethodModal = document.getElementById('otpMethodModal');
    // const closeOtpMethodModalBtn = document.getElementById('closeOtpMethodModalBtn');
    // const selectEmailOtp = document.getElementById('selectEmailOtp');
    // const selectPhoneOtp = document.getElementById('selectPhoneOtp');
    
    // Email input modal
    const emailInputModal = document.getElementById('emailInputModal');
    const closeEmailInputModalBtn = document.getElementById('closeEmailInputModalBtn');
    const emailInputForm = document.getElementById('emailInputForm');
    const emailInput = document.getElementById('emailInput');
    const emailInputError = document.getElementById('emailInputError');
    
    // Phone input modal
    const phoneInputModal = document.getElementById('phoneInputModal');
    const closePhoneInputModalBtn = document.getElementById('closePhoneInputModalBtn');
    const phoneInputForm = document.getElementById('phoneInputForm');
    const phoneInput = document.getElementById('phoneInput');
    const phoneInputError = document.getElementById('phoneInputError');
    
    // Email OTP modal
    const emailOtpModal = document.getElementById('emailOtpModal');
    const closeEmailOtpModalBtn = document.getElementById('closeEmailOtpModalBtn');
    const emailOtpForm = document.getElementById('emailOtpForm');
    const emailOtpError = document.getElementById('emailOtpError');
    const resendEmailOtp = document.getElementById('resendEmailOtp');
    
    // Phone OTP modal
    const phoneOtpModal = document.getElementById('phoneOtpModal');
    const closePhoneOtpModalBtn = document.getElementById('closePhoneOtpModalBtn');
    const phoneOtpForm = document.getElementById('phoneOtpForm');
    const phoneOtpError = document.getElementById('phoneOtpError');
    const resendPhoneOtp = document.getElementById('resendPhoneOtp');
    
    // Store current authentication context
    let currentAuthContext = {
        email: '',
        phone: '',
        method: 'email' // Always use email now
    };
    
    // OTP attempt tracking
    let otpAttempts = 0;
    const maxAttempts = 3;
    let lockoutEndTime = null;
    
    // OTP timer tracking
    let otpTimer = null;
    let otpExpiryTime = null;

    const loginModal = document.getElementById('loginModal');
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginEmailError = document.getElementById('loginEmailError');
    const loginPasswordError = document.getElementById('loginPasswordError');
    const loginSuccessMessage = document.getElementById('loginSuccessMessage');
    const openLoginModalBtn = document.getElementById('openLoginModalBtn');
    const openLoginModalBtnMobile = document.getElementById('openLoginModalBtnMobile');

    const signupModal = document.getElementById('signupModal');
    const closeSignupModalBtn = document.getElementById('closeSignupModalBtn');
    const signupForm = document.getElementById('signupForm');
    const signupFirstNameInput = document.getElementById('signupFirstName');
    const signupLastNameInput = document.getElementById('signupLastName');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPasswordInput = document.getElementById('signupPassword');
    const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword');
    const signupFirstNameError = document.getElementById('signupFirstNameError');
    const signupLastNameError = document.getElementById('signupLastNameError');
    const signupEmailError = document.getElementById('signupEmailError');
    const signupPasswordError = document.getElementById('signupPasswordError');
    const signupConfirmPasswordError = document.getElementById('signupConfirmPasswordError');
    const signupSuccessMessage = document.getElementById('signupSuccessMessage');
    const openSignupModalLink = document.getElementById('openSignupModalLink');

    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotPasswordModalBtn = document.getElementById('closeForgotPasswordModalBtn');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotEmailInput = document.getElementById('forgotEmail');
    const forgotEmailError = document.getElementById('forgotEmailError');
    const forgotPasswordSuccessMessage = document.getElementById('forgotPasswordSuccessMessage');
    const backToLoginLink = document.getElementById('backToLoginLink');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    // Password toggle elements
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPasswordIcon = document.getElementById('loginPasswordIcon');
    const toggleSignupPassword = document.getElementById('toggleSignupPassword');
    const signupPasswordIcon = document.getElementById('signupPasswordIcon');
    const toggleSignupConfirmPassword = document.getElementById('toggleSignupConfirmPassword');
    const signupConfirmPasswordIcon = document.getElementById('signupConfirmPasswordIcon');

    const userAgreementModal = document.getElementById('userAgreementModal');
    const closeUserAgreementBtn = document.getElementById('closeUserAgreementBtn');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const acceptAgreementBtn = document.getElementById('acceptAgreementBtn');
    const declineAgreementBtn = document.getElementById('declineAgreementBtn');
    const openSignupModalBtnNav = document.getElementById('openSignupModalBtnNav');
    const openSignupModalBtnMobileNav = document.getElementById('openSignupModalBtnMobileNav');

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_]).{8,}$/;
    const namePattern = /^[a-zA-Z\s'-]+$/;

    function togglePasswordVisibility(input, icon) {
        if (!input || !icon) return;
        if (input.type === 'password') { input.type = 'text'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
        else { input.type = 'password'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    }

    if (toggleLoginPassword && loginPasswordInput && loginPasswordIcon) toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility(loginPasswordInput, loginPasswordIcon));
    if (toggleSignupPassword && signupPasswordInput && signupPasswordIcon) toggleSignupPassword.addEventListener('click', () => togglePasswordVisibility(signupPasswordInput, signupPasswordIcon));
    if (toggleSignupConfirmPassword && signupConfirmPasswordInput && signupConfirmPasswordIcon) toggleSignupConfirmPassword.addEventListener('click', () => togglePasswordVisibility(signupConfirmPasswordInput, signupConfirmPasswordIcon));

    function openLoginModal(e) { if (e) e.preventDefault(); if (!loginModal) return; loginModal.classList.add('active'); signupModal && signupModal.classList.remove('active'); forgotPasswordModal && forgotPasswordModal.classList.remove('active'); loginEmailInput && loginEmailInput.focus(); }
    function closeLoginModal() { if (!loginModal || !loginForm) return; loginModal.classList.remove('active'); loginForm.reset(); loginEmailInput && loginEmailInput.classList.remove('error', 'success'); loginPasswordInput && loginPasswordInput.classList.remove('error', 'success'); if (loginEmailError) loginEmailError.style.display = 'none'; if (loginPasswordError) loginPasswordError.style.display = 'none'; if (loginSuccessMessage) loginSuccessMessage.style.display = 'none'; }
    function openSignupModal(e) { if (e) e.preventDefault(); if (!signupModal) return; signupModal.classList.add('active'); loginModal && loginModal.classList.remove('active'); forgotPasswordModal && forgotPasswordModal.classList.remove('active'); signupFirstNameInput && signupFirstNameInput.focus(); }
    function closeSignupModal() { if (!signupModal || !signupForm) return; signupModal.classList.remove('active'); signupForm.reset(); [signupFirstNameInput, signupLastNameInput, signupEmailInput, signupPasswordInput, signupConfirmPasswordInput].forEach(inp => inp && inp.classList.remove('error', 'success')); [signupFirstNameError, signupLastNameError, signupEmailError, signupPasswordError, signupConfirmPasswordError].forEach(el => el && (el.style.display = 'none')); if (signupSuccessMessage) signupSuccessMessage.style.display = 'none'; const profilePhotoDisplay = document.getElementById('profilePhotoDisplay'); const displayProfilePhoto = document.getElementById('displayProfilePhoto'); if (profilePhotoDisplay) profilePhotoDisplay.classList.add('hidden'); if (displayProfilePhoto) displayProfilePhoto.src = ''; }
    function openForgotPasswordModal(e) { if (e) e.preventDefault(); if (!forgotPasswordModal) return; forgotPasswordModal.classList.add('active'); loginModal && loginModal.classList.remove('active'); signupModal && signupModal.classList.remove('active'); forgotEmailInput && forgotEmailInput.focus(); }
    function closeForgotPasswordModal() { if (!forgotPasswordModal || !forgotPasswordForm) return; forgotPasswordModal.classList.remove('active'); forgotPasswordForm.reset(); if (forgotEmailInput) forgotEmailInput.classList.remove('error', 'success'); if (forgotEmailError) forgotEmailError.style.display = 'none'; if (forgotPasswordSuccessMessage) forgotPasswordSuccessMessage.style.display = 'none'; }

    if (openLoginModalBtn) openLoginModalBtn.addEventListener('click', openLoginModal);
    if (openLoginModalBtnMobile) openLoginModalBtnMobile.addEventListener('click', openLoginModal);
    if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', closeLoginModal);
    if (loginModal) loginModal.addEventListener('click', (event) => { if (event.target === loginModal) closeLoginModal(); });
    if (openSignupModalLink) openSignupModalLink.addEventListener('click', openSignupModal);
    const openLoginModalLink = document.getElementById('openLoginModalLink');
    if (openLoginModalLink) openLoginModalLink.addEventListener('click', openLoginModal);
    if (closeSignupModalBtn) closeSignupModalBtn.addEventListener('click', closeSignupModal);
    if (signupModal) signupModal.addEventListener('click', (event) => { if (event.target === signupModal) closeSignupModal(); });
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', openForgotPasswordModal);
    if (closeForgotPasswordModalBtn) closeForgotPasswordModalBtn.addEventListener('click', closeForgotPasswordModal);
    if (forgotPasswordModal) forgotPasswordModal.addEventListener('click', (event) => { if (event.target === forgotPasswordModal) closeForgotPasswordModal(); });
    if (backToLoginLink) backToLoginLink.addEventListener('click', openLoginModal);

    function showUserAgreement(e) { e.preventDefault(); userAgreementModal && userAgreementModal.classList.add('active'); }
    function closeUserAgreement() { userAgreementModal && userAgreementModal.classList.remove('active'); }
    if (openSignupModalBtnNav) openSignupModalBtnNav.addEventListener('click', showUserAgreement);
    if (openSignupModalBtnMobileNav) openSignupModalBtnMobileNav.addEventListener('click', showUserAgreement);
    if (declineAgreementBtn) declineAgreementBtn.addEventListener('click', closeUserAgreement);
    if (closeUserAgreementBtn) closeUserAgreementBtn.addEventListener('click', closeUserAgreement);
    if (agreeTermsCheckbox && acceptAgreementBtn) {
        agreeTermsCheckbox.addEventListener('change', (e) => { acceptAgreementBtn.disabled = !e.target.checked; });
        acceptAgreementBtn.addEventListener('click', () => { closeUserAgreement(); signupModal && signupModal.classList.add('active'); });
    }

    function validateEmail(email) { if (!emailPattern.test(email)) return { valid: false, message: 'Please enter a valid email address.' }; return { valid: true, message: 'Valid email address format.' }; }
    function validateInput(inputElement, pattern, errorElementId) {
        const errorElement = document.getElementById(errorElementId);
        const value = (inputElement && inputElement.value || '').trim();
        let isValid = true; let errorMessage = '';
        if (inputElement && inputElement.hasAttribute('required') && value === '') { isValid = false; errorMessage = 'This field is required.'; }
        else if (pattern && value !== '' && !pattern.test(value)) { isValid = false; if (inputElement.type === 'email') { const emailValidation = validateEmail(value); errorMessage = emailValidation.message; } else if (inputElement.type === 'password') { errorMessage = 'Password must be at least 6 characters.'; } else { errorMessage = `Please enter a valid ${(inputElement.placeholder || 'value').toLowerCase()}.`; } }
        if (inputElement) { if (isValid) { inputElement.classList.remove('error'); inputElement.classList.add('success'); if (errorElement) errorElement.style.display = 'none'; } else { inputElement.classList.remove('success'); inputElement.classList.add('error'); if (errorElement) { errorElement.style.display = 'block'; errorElement.textContent = errorMessage; } } }
        return isValid;
    }

    function validateConfirmPassword() {
        if (!signupConfirmPasswordInput || !signupPasswordInput) return false;
        const isValid = signupConfirmPasswordInput.value === signupPasswordInput.value && signupConfirmPasswordInput.value !== '';
        if (isValid) { signupConfirmPasswordInput.classList.remove('error'); signupConfirmPasswordInput.classList.add('success'); signupConfirmPasswordError && (signupConfirmPasswordError.style.display = 'none'); }
        else { signupConfirmPasswordInput.classList.remove('success'); signupConfirmPasswordInput.classList.add('error'); if (signupConfirmPasswordError) { signupConfirmPasswordError.style.display = 'block'; signupConfirmPasswordError.textContent = 'Passwords do not match.'; } }
        return isValid;
    }

    if (loginEmailInput) loginEmailInput.addEventListener('input', () => validateInput(loginEmailInput, emailPattern, 'loginEmailError'));
    if (loginPasswordInput) loginPasswordInput.addEventListener('input', () => validateInput(loginPasswordInput, /./, 'loginPasswordError'));
    if (signupFirstNameInput) signupFirstNameInput.addEventListener('input', () => validateInput(signupFirstNameInput, namePattern, 'signupFirstNameError'));
    if (signupLastNameInput) signupLastNameInput.addEventListener('input', () => validateInput(signupLastNameInput, namePattern, 'signupLastNameError'));
    if (signupEmailInput) signupEmailInput.addEventListener('input', () => validateInput(signupEmailInput, emailPattern, 'signupEmailError'));
    if (signupPasswordInput) signupPasswordInput.addEventListener('input', () => { validateInput(signupPasswordInput, passwordPattern, 'signupPasswordError'); if (signupConfirmPasswordInput && signupConfirmPasswordInput.value !== '') validateConfirmPassword(); });
    if (signupConfirmPasswordInput) signupConfirmPasswordInput.addEventListener('input', validateConfirmPassword);
    
    // Add phone number validation
    const signupPhoneInput = document.getElementById('signupPhone');
    const phonePattern = /^\+?[1-9]\d{1,14}$/;
    if (signupPhoneInput) signupPhoneInput.addEventListener('input', () => validateInput(signupPhoneInput, phonePattern, 'signupPhoneError'));

    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isEmailValid = validateInput(loginEmailInput, emailPattern, 'loginEmailError');
        const isPasswordValid = validateInput(loginPasswordInput, /./, 'loginPasswordError');
        if (!(isEmailValid && isPasswordValid)) return;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...'; submitBtn.disabled = true; }
        try {
            const res = await fetch('Back-end/signup-db.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', email: loginEmailInput.value.trim(), password: loginPasswordInput.value }) });
            const data = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
            if (res.ok && data.ok) {
                // Store user email in currentAuthContext for OTP process
                currentAuthContext.email = loginEmailInput.value.trim();
                // Credentials are valid, automatically send OTP and show OTP modal
                console.log('Login successful, automatically sending OTP');
                closeLoginModal();
                await sendOtpAndShowModal();
            } else {
                if (loginSuccessMessage) { loginSuccessMessage.textContent = data.error || 'Wrong email or password.'; loginSuccessMessage.style.display = 'block'; loginSuccessMessage.classList.remove('text-green-600'); loginSuccessMessage.classList.add('text-red-500'); }
            }
        } catch (_) {
            if (loginSuccessMessage) { loginSuccessMessage.textContent = 'Network error, please try again.'; loginSuccessMessage.style.display = 'block'; loginSuccessMessage.classList.remove('text-green-600'); loginSuccessMessage.classList.add('text-red-500'); }
        } finally {
            if (submitBtn) { submitBtn.innerHTML = 'Login'; submitBtn.disabled = false; }
        }
    });

    if (signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isFirstNameValid = validateInput(signupFirstNameInput, namePattern, 'signupFirstNameError');
        const isLastNameValid = validateInput(signupLastNameInput, namePattern, 'signupLastNameError');
        const isEmailValid = validateInput(signupEmailInput, emailPattern, 'signupEmailError');
        const isPasswordValid = validateInput(signupPasswordInput, passwordPattern, 'signupPasswordError');
        const isConfirmPasswordValid = validateConfirmPassword();
        
        if (!(isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid)) { 
            signupForm.classList.add('shake'); 
            setTimeout(() => signupForm.classList.remove('shake'), 400); 
            return; 
        }
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...'; submitBtn.disabled = true; }
        try {
            const res = await fetch('Back-end/signup-db.php', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    firstName: signupFirstNameInput.value.trim(), 
                    lastName: signupLastNameInput.value.trim(), 
                    email: signupEmailInput.value.trim(), 
                    password: signupPasswordInput.value 
                }) 
            });
            const raw = await res.text();
            let data; try { data = JSON.parse(raw); } catch { data = { ok: false, error: 'Invalid response', raw }; }
            if (res.ok && data.ok) {
                // Store user email in localStorage for the patient details form
                localStorage.setItem('userEmail', signupEmailInput.value.trim());
                // Registration successful, go directly to patient details form
                closeSignupModal();
                showPatientDetailsForm();
            } else {
                if (signupSuccessMessage) { signupSuccessMessage.textContent = (data && data.error) ? data.error : 'Registration failed. Please try again.'; signupSuccessMessage.classList.remove('hidden'); signupSuccessMessage.style.display = 'block'; signupSuccessMessage.classList.remove('text-green-600'); signupSuccessMessage.classList.add('text-red-500'); signupSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }
        } catch (err) {
            if (signupSuccessMessage) { signupSuccessMessage.textContent = 'Network error. Please try again.'; signupSuccessMessage.classList.remove('hidden'); signupSuccessMessage.style.display = 'block'; signupSuccessMessage.classList.remove('text-green-600'); signupSuccessMessage.classList.add('text-red-500'); signupSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        } finally { if (submitBtn) { submitBtn.innerHTML = 'Sign Up'; submitBtn.disabled = false; } }
    });

    if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ok = (function(){ if (!forgotEmailInput) return false; const v = (forgotEmailInput.value || '').trim(); const valid = emailPattern.test(v); if (valid) { forgotEmailInput.classList.remove('error'); forgotEmailInput.classList.add('success'); if (forgotEmailError) forgotEmailError.style.display = 'none'; } else { forgotEmailInput.classList.remove('success'); forgotEmailInput.classList.add('error'); if (forgotEmailError) { forgotEmailError.style.display = 'block'; forgotEmailError.textContent = 'Please enter a valid email address.'; } } return valid; })();
        if (!ok) { forgotPasswordForm.classList.add('shake'); setTimeout(() => forgotPasswordForm.classList.remove('shake'), 400); return; }
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Processing...'; submitBtn.disabled = true; }
        try {
            const email = (forgotEmailInput.value || '').trim();
            const params = new URLSearchParams(); 
            params.set('email', email);
            
            const res = await fetch('Back-end/forgot-password/send-pass-reset-simple.php', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
                body: params.toString() 
            });
            
            const responseText = await res.text();
            console.log('Raw response:', responseText); // Debug log
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', responseText);
                throw new Error('Invalid response from server. Please check console for details.');
            }
            
            if (data.ok) {
                if (forgotPasswordSuccessMessage) { 
                    forgotPasswordSuccessMessage.textContent = data.message; 
                    forgotPasswordSuccessMessage.style.display = 'block'; 
                    forgotPasswordSuccessMessage.classList.remove('text-red-500'); 
                    forgotPasswordSuccessMessage.classList.add('text-green-600'); 
                }
                setTimeout(() => { closeForgotPasswordModal(); openLoginModal(); }, 3000);
            } else {
                if (forgotPasswordSuccessMessage) { 
                    forgotPasswordSuccessMessage.textContent = data.error || 'An error occurred. Please try again.'; 
                    forgotPasswordSuccessMessage.style.display = 'block'; 
                    forgotPasswordSuccessMessage.classList.remove('text-green-600'); 
                    forgotPasswordSuccessMessage.classList.add('text-red-500'); 
                }
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            if (forgotPasswordSuccessMessage) { 
                forgotPasswordSuccessMessage.textContent = 'Network error. Please try again.'; 
                forgotPasswordSuccessMessage.style.display = 'block'; 
                forgotPasswordSuccessMessage.classList.remove('text-green-600'); 
                forgotPasswordSuccessMessage.classList.add('text-red-500'); 
            }
        } finally { if (submitBtn) { submitBtn.innerHTML = 'Send Reset Link'; submitBtn.disabled = false; } }
    });

    // OTP Authentication Functions
    async function sendOtpAndShowModal() {
        try {
            // Send OTP to email
            const response = await fetch('Back-end/api/generate-otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: currentAuthContext.email,
                    method: 'email'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show OTP form directly with email confirmation message
                showEmailOtpModal();
                // Update the OTP modal message to show OTP was sent
                updateOtpModalMessage();
            } else {
                console.error('Failed to send OTP:', data.message);
                // Show OTP form even if sending failed
                showEmailOtpModal();
                updateOtpModalMessage();
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            // Show OTP form even if there's an error
            showEmailOtpModal();
            updateOtpModalMessage();
        }
    }

    // Removed unused OTP method modal functions since we go directly to OTP form
    // function showOtpMethodModal() { ... }
    // function hideOtpMethodModal() { ... }

    // Helper function to update OTP modal message
    function updateOtpModalMessage() {
        const otpEmailDisplay = document.getElementById('otpEmailDisplay');
        
        if (otpEmailDisplay) {
            otpEmailDisplay.textContent = currentAuthContext.email;
        }
    }

    function showEmailOtpModal() {
        if (emailOtpModal) {
            // Reset attempt counter when showing modal
            otpAttempts = 0;
            updateAttemptCounter();
            // Show form and hide lockout message
            showOtpForm();
            hideLockoutMessage();
            // Start the 2-minute timer
            startOtpTimer();
            
            emailOtpModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Helper functions for OTP timer management
    function startOtpTimer() {
        // Clear any existing timer
        if (otpTimer) {
            clearInterval(otpTimer);
        }
        
        // Set expiry time to 2 minutes from now
        otpExpiryTime = Date.now() + (2 * 60 * 1000); // 2 minutes
        
        // Update timer display immediately
        updateOtpTimer();
        
        // Update timer every second
        otpTimer = setInterval(updateOtpTimer, 1000);
    }
    
    function updateOtpTimer() {
        const timerElement = document.getElementById('otpTimer');
        if (!timerElement || !otpExpiryTime) return;
        
        const now = Date.now();
        const remaining = Math.max(0, otpExpiryTime - now);
        
        if (remaining <= 0) {
            // Timer expired
            clearInterval(otpTimer);
            timerElement.textContent = '0:00';
            // Only adjust inline styles to avoid changing container sizing
            const iconElement = timerElement.parentElement?.querySelector('i');
            if (iconElement) {
                iconElement.style.color = '#dc2626';
            }
            
            const labelSpan = timerElement.parentElement;
            if (labelSpan) {
                // Replace only the text node so container size stays stable
                if (labelSpan.firstChild && labelSpan.firstChild.nodeType === 3) {
                    labelSpan.firstChild.nodeValue = 'Code Expired';
                } else {
                    // Fallback
                    labelSpan.textContent = 'Code Expired';
                }
                timerElement.style.display = 'none';
            }
            
            // Disable form
            disableOtpForm();
            
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        timerElement.textContent = timeString;
        
        // Change color when less than 1 minute remaining (no size changes)
        if (remaining <= 60000) { // 1 minute
            timerElement.style.color = '#b91c1c';
            const iconElement = timerElement.parentElement?.querySelector('i');
            if (iconElement) {
                iconElement.style.color = '#dc2626';
            }
        }
        
        // Add urgent warning when less than 30 seconds remaining (stable size)
        if (remaining <= 30000) { // 30 seconds
            // Keep base label text as-is ("Expires in ")
            timerElement.style.color = '#dc2626'; // Red color for urgent
            timerElement.style.fontWeight = 'bold';
            // Keep font size unchanged to preserve layout
            // Subtle pulse on opacity only
            if (remaining <= 10000) { // 10 seconds
                timerElement.style.animation = 'pulse 1s infinite';
            }
        }
    }
    
    function stopOtpTimer() {
        if (otpTimer) {
            clearInterval(otpTimer);
            otpTimer = null;
        }
        otpExpiryTime = null;
    }
    
    function disableOtpForm() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const verifyBtn = document.getElementById('verifyOtpBtn');
        
        otpInputs.forEach(input => {
            input.disabled = true;
            input.classList.add('opacity-50', 'cursor-not-allowed');
        });
        
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    function enableOtpForm() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const verifyBtn = document.getElementById('verifyOtpBtn');
        
        otpInputs.forEach(input => {
            input.disabled = false;
            input.classList.remove('opacity-50', 'cursor-not-allowed');
        });
        
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    // Helper functions for OTP attempt management
    function updateAttemptCounter() {
        const attemptCounter = document.getElementById('attemptCounter');
        if (attemptCounter) {
            const remaining = maxAttempts - otpAttempts;
            attemptCounter.textContent = remaining;
            
            // Change color based on remaining attempts
            const counterContainer = attemptCounter.closest('.bg-amber-50');
            if (counterContainer) {
                if (remaining <= 1) {
                    counterContainer.className = 'inline-flex items-center bg-red-50 border border-red-200 rounded-full px-4 py-2';
                    attemptCounter.parentElement.className = 'text-red-800 text-sm font-medium';
                    counterContainer.querySelector('i').className = 'fas fa-exclamation-triangle text-red-600 mr-2';
                } else if (remaining === 2) {
                    counterContainer.className = 'inline-flex items-center bg-orange-50 border border-orange-200 rounded-full px-4 py-2';
                    attemptCounter.parentElement.className = 'text-orange-800 text-sm font-medium';
                    counterContainer.querySelector('i').className = 'fas fa-shield-alt text-orange-600 mr-2';
                }
            }
        }
    }
    
    function showLockoutMessage() {
        const lockoutMessage = document.getElementById('lockoutMessage');
        const lockoutTimer = document.getElementById('lockoutTimer');
        
        if (lockoutMessage) {
            lockoutMessage.classList.remove('hidden');
        }
        
        // Start countdown timer
        if (lockoutTimer) {
            const startTime = Date.now();
            const updateTimer = () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, lockoutEndTime - Date.now());
                const minutes = Math.ceil(remaining / 1000 / 60);
                
                if (remaining > 0) {
                    lockoutTimer.textContent = `${minutes} minutes`;
                    setTimeout(updateTimer, 1000);
                } else {
                    lockoutTimer.textContent = '0 minutes';
                    // Reset lockout
                    lockoutEndTime = null;
                    otpAttempts = 0;
                    updateAttemptCounter();
                    hideLockoutMessage();
                    showOtpForm();
                }
            };
            updateTimer();
        }
    }
    
    function hideLockoutMessage() {
        const lockoutMessage = document.getElementById('lockoutMessage');
        if (lockoutMessage) {
            lockoutMessage.classList.add('hidden');
        }
    }
    
    function hideOtpForm() {
        const emailOtpForm = document.getElementById('emailOtpForm');
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        
        if (emailOtpForm) {
            emailOtpForm.style.display = 'none';
        }
        if (verifyOtpBtn) {
            verifyOtpBtn.style.display = 'none';
        }
    }
    
    function showOtpForm() {
        const emailOtpForm = document.getElementById('emailOtpForm');
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        
        if (emailOtpForm) {
            emailOtpForm.style.display = 'block';
        }
        if (verifyOtpBtn) {
            verifyOtpBtn.style.display = 'block';
        }
    }

    function hideEmailOtpModal() {
        if (emailOtpModal) {
            emailOtpModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function resetOtpForm() {
        // Clear any existing timer
        if (otpTimer) {
            clearInterval(otpTimer);
            otpTimer = null;
        }
        
        // Reset form elements
        const otpInput = document.getElementById('otpCode');
        if (otpInput) {
            otpInput.value = '';
        }
        
        // Reset attempt counter
        otpAttempts = 0;
        updateAttemptCounter();
        
        // Reset timer display (keep container styling stable)
        const timerElement = document.getElementById('otpTimer');
        if (timerElement) {
            timerElement.textContent = '2:00';
            // Ensure timer is visible again after being hidden on expiry
            timerElement.style.display = '';
            
            // Only inline styles to avoid layout shift
            const iconElement = timerElement.parentElement?.querySelector('i');
            if (iconElement) {
                iconElement.style.color = '#2563eb';
            }
            const firstSpan = timerElement.parentElement?.querySelector('span:first-child');
            if (firstSpan) {
                firstSpan.textContent = 'Code expires in:';
            }
            
            // Reset timer styling
            timerElement.style.color = '';
            timerElement.style.fontWeight = '';
            timerElement.style.fontSize = '';
            timerElement.style.animation = '';
        }
        
        // Re-enable form
        enableOtpForm();
    }

    function showPhoneOtpModal() {
        if (phoneOtpModal) {
            phoneOtpModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hidePhoneOtpModal() {
        if (phoneOtpModal) {
            phoneOtpModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Email input modal functions
    function showEmailInputModal() {
        if (emailInputModal) {
            emailInputModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideEmailInputModal() {
        if (emailInputModal) {
            emailInputModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Phone input modal functions
    function showPhoneInputModal() {
        if (phoneInputModal) {
            phoneInputModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hidePhoneInputModal() {
        if (phoneInputModal) {
            phoneInputModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async function generateOtp(email, phone, method) {
        try {
            const response = await fetch('Back-end/api/generate-otp.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    phone: phone,
                    method: method
                })
            });

            // Try to parse JSON; if server errored, surface a clear message
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                return data;
            } catch (e) {
                return { success: false, message: 'Server error. Please check SMTP/app configuration.', raw: text };
            }
        } catch (error) {
            console.error('Error generating OTP:', error);
            return { success: false, message: 'Network error' };
        }
    }

    async function verifyOtp(otpCode, method, email, phone) {
        try {
            const response = await fetch('Back-end/api/verify-otp.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    otp_code: otpCode,
                    method: method,
                    email: email,
                    phone: phone
                })
            });

            const text = await response.text();
            console.log('Verify OTP response:', text);
            try {
                const data = JSON.parse(text);
                return data;
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                return { success: false, message: 'Invalid server response' };
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return { success: false, message: 'Network error' };
        }
    }

    // OTP Modal Event Listeners
    // Removed unused modal event handlers
    // if (closeOtpMethodModalBtn) {
    //     closeOtpMethodModalBtn.addEventListener('click', hideOtpMethodModal);
    // }

    if (closeEmailInputModalBtn) {
        closeEmailInputModalBtn.addEventListener('click', hideEmailInputModal);
    }

    if (closePhoneInputModalBtn) {
        closePhoneInputModalBtn.addEventListener('click', hidePhoneInputModal);
    }

    if (closeEmailOtpModalBtn) {
        closeEmailOtpModalBtn.addEventListener('click', hideEmailOtpModal);
    }

    if (closePhoneOtpModalBtn) {
        closePhoneOtpModalBtn.addEventListener('click', hidePhoneOtpModal);
    }

    // Remove old SMS/Phone event handlers since we only use email now
    // if (selectEmailOtp) {
    //     selectEmailOtp.addEventListener('click', () => {
    //         currentAuthContext.method = 'email';
    //         hideOtpMethodModal();
    //         showEmailInputModal();
    //     });
    // }

    // if (selectPhoneOtp) {
    //     selectPhoneOtp.addEventListener('click', () => {
    //         currentAuthContext.method = 'phone';
    //         hideOtpMethodModal();
    //         showPhoneInputModal();
    //     });
    // }

    // Email input form handler
    if (emailInputForm) {
        emailInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            
            if (!email || !email.includes('@')) {
                if (emailInputError) {
                    emailInputError.textContent = 'Please enter a valid email address';
                    emailInputError.style.display = 'block';
                }
                return;
            }

            currentAuthContext.email = email;
            
            const result = await generateOtp(email, '', 'email');
            if (result.success) {
                hideEmailInputModal();
                showEmailOtpModal();
            } else {
                alert(result.message || 'Failed to send OTP');
            }
        });
    }

    // Phone input form handler
    if (phoneInputForm) {
        phoneInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = phoneInput.value.trim();
            
            if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) {
                if (phoneInputError) {
                    phoneInputError.textContent = 'Please enter a valid phone number';
                    phoneInputError.style.display = 'block';
                }
                return;
            }

            currentAuthContext.phone = phone;
            
            const result = await generateOtp(currentAuthContext.email, phone, 'phone');
            if (result.success) {
                hidePhoneInputModal();
                showPhoneOtpModal();
            } else {
                alert(result.message || 'Failed to send OTP');
            }
        });
    }

    // Function to get OTP code from individual input fields
    function getOtpCode(prefix) {
        const inputs = [];
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`${prefix}Otp${i}`);
            if (input) inputs.push(input.value);
        }
        return inputs.join('');
    }

    // Function to set up OTP input auto-focus
    function setupOtpInputs(prefix) {
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`${prefix}Otp${i}`);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (value.length === 1 && i < 6) {
                        const nextInput = document.getElementById(`${prefix}Otp${i + 1}`);
                        if (nextInput) nextInput.focus();
                    }
                });
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && e.target.value === '' && i > 1) {
                        const prevInput = document.getElementById(`${prefix}Otp${i - 1}`);
                        if (prevInput) prevInput.focus();
                    }
                });
            }
        }
    }

    if (emailOtpForm) {
        emailOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if user is locked out
            if (lockoutEndTime && Date.now() < lockoutEndTime) {
                const remainingTime = Math.ceil((lockoutEndTime - Date.now()) / 1000 / 60);
                if (emailOtpError) {
                    emailOtpError.textContent = `Account locked. Try again in ${remainingTime} minutes.`;
                    emailOtpError.style.display = 'block';
                }
                return;
            }
            
            // Check if OTP has expired
            if (otpExpiryTime && Date.now() >= otpExpiryTime) {
                if (emailOtpError) {
                    emailOtpError.textContent = 'OTP has expired. Please request a new code.';
                    emailOtpError.style.display = 'block';
                }
                return;
            }
            
            const otpCode = getOtpCode('email');
            
            if (otpCode.length !== 6) {
                if (emailOtpError) {
                    emailOtpError.textContent = 'Please enter a 6-digit code';
                    emailOtpError.style.display = 'block';
                }
                return;
            }

            const result = await verifyOtp(otpCode, 'email', currentAuthContext.email, '');
            if (result.success) {
                // Stop the timer and reset attempts on successful verification
                stopOtpTimer();
                otpAttempts = 0;
                updateAttemptCounter();
                // Store user email in localStorage for the dashboard
                localStorage.setItem('userEmail', result.data.email);
                // Redirect to patient dashboard after login OTP verification
                window.location.href = '../Patient-Dash/4Care-Patient.html';
            } else {
                // Increment attempt counter
                otpAttempts++;
                updateAttemptCounter();
                
                if (otpAttempts >= maxAttempts) {
                    // Lock user out for 5 minutes
                    lockoutEndTime = Date.now() + (5 * 60 * 1000); // 5 minutes
                    showLockoutMessage();
                    hideOtpForm();
                } else {
                    if (emailOtpError) {
                        emailOtpError.textContent = result.message || 'Invalid OTP code';
                        emailOtpError.style.display = 'block';
                    }
                }
            }
        });
        
        // Set up auto-focus for email OTP inputs
        setupOtpInputs('email');
    }

    // Function to show patient details form
    function showPatientDetailsForm() {
        // Hide OTP modal
        hideOtpForm();
        
        // Show patient details modal
        const patientDetailsModal = document.getElementById('patientDetailsModal');
        if (patientDetailsModal) {
            patientDetailsModal.style.display = 'block';
            patientDetailsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Phone OTP form handler removed since we only use email now
    // if (phoneOtpForm) {
    //     phoneOtpForm.addEventListener('submit', async (e) => {
    //         e.preventDefault();
    //         const otpCode = getOtpCode('phone');
    //         
    //         if (otpCode.length !== 6) {
    //             if (phoneOtpError) {
    //                 phoneOtpError.textContent = 'Please enter a 6-digit code';
    //                 phoneOtpError.style.display = 'block';
    //             }
    //             return;
    //         }

    //         const result = await verifyOtp(otpCode, 'phone', currentAuthContext.email, currentAuthContext.phone);
    //         if (result.success) {
    //             // Store user email in localStorage for the dashboard
    //             localStorage.setItem('userEmail', result.data.email);
    //             // Redirect to patient dashboard
    //             window.location.href = '../Patient-Dash/4Care-Patient.html';
    //         } else {
    //             if (phoneOtpError) {
    //                 phoneOtpError.textContent = result.message || 'Invalid OTP code';
    //                 phoneOtpError.style.display = 'block';
    //             }
    //         }
    //     });
        
    //     // Set up auto-focus for phone OTP inputs
    //     setupOtpInputs('phone');
    // }

    // Resend OTP functionality
    if (resendEmailOtp) {
        resendEmailOtp.addEventListener('click', async () => {
            const result = await generateOtp(currentAuthContext.email, '', 'email');
            if (result.success) {
                // Reset attempt counter and restart timer when resending
                otpAttempts = 0;
                updateAttemptCounter();
                hideLockoutMessage();
                showOtpForm();
                startOtpTimer(); // Restart the 2-minute timer
                
                if (emailOtpError) {
                    emailOtpError.textContent = 'New verification code sent!';
                    emailOtpError.style.display = 'block';
                    emailOtpError.classList.remove('text-red-500');
                    emailOtpError.classList.add('text-green-500');
                }
            } else {
                if (emailOtpError) {
                    emailOtpError.textContent = result.message || 'Failed to resend code';
                    emailOtpError.style.display = 'block';
                    emailOtpError.classList.remove('text-green-500');
                    emailOtpError.classList.add('text-red-500');
                }
            }
        });
    }

    // Phone resend OTP removed since we only use email now
    // if (resendPhoneOtp) {
    //     resendPhoneOtp.addEventListener('click', async () => {
    //         const result = await generateOtp(currentAuthContext.email, currentAuthContext.phone, 'phone');
    //         if (result.success) {
    //             alert('OTP resent successfully');
    //         } else {
    //             alert(result.message || 'Failed to resend OTP');
    //         }
    //     });
    // }

    // Removed unused back to method selection handlers
    // if (document.getElementById('backToOtpMethodFromEmailInput')) {
    //     document.getElementById('backToOtpMethodFromEmailInput').addEventListener('click', () => {
    //         hideEmailInputModal();
    //         showOtpMethodModal();
    //     });
    // }

    // Removed unused back to method selection handlers
    // if (document.getElementById('backToOtpMethodFromPhoneInput')) {
    //     document.getElementById('backToOtpMethodFromPhoneInput').addEventListener('click', () => {
    //         hidePhoneInputModal();
    //         showOtpMethodModal();
    //     });
    // }

    // if (document.getElementById('backToOtpMethodFromEmail')) {
    //     document.getElementById('backToOtpMethodFromEmail').addEventListener('click', () => {
    //         hideEmailOtpModal();
    //         showOtpMethodModal();
    //     });
    // }

    // if (document.getElementById('backToOtpMethodFromPhone')) {
    //     document.getElementById('backToOtpMethodFromPhone').addEventListener('click', () => {
    //         hidePhoneOtpModal();
    //         showOtpMethodModal();
    //     });
    // }

});


