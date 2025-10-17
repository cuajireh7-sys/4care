document.addEventListener('DOMContentLoaded', () => {
      const loginModal = document.getElementById('loginModal');
      const signupModal = document.getElementById('signupModal');
      const forgotPasswordModal = document.getElementById('forgotPasswordModal');
      const termsModal = document.getElementById('termsModal'); 
      const privacyModal = document.getElementById('privacyModal');

      const closeSignupModalBtn = document.getElementById('closeSignupModalBtn');
      const closeForgotPasswordModalBtn = document.getElementById('closeForgotPasswordModalBtn');
      const closeTermsModalBtn = document.getElementById('closeTermsModalBtn'); 
      const closePrivacyModalBtn = document.getElementById('closePrivacyModalBtn'); 
      const closePrivacyModalBtn2 = document.getElementById('closePrivacyModalBtn2'); 

      const openSignupModalLink = document.getElementById('openSignupModalLink');
      const openLoginModalLink = document.getElementById('openLoginModalLink');
      const forgotPasswordLink = document.getElementById('forgotPasswordLink');
      const backToLoginLink = document.getElementById('backToLoginLink');
      const termsLink = document.getElementById('termsLink'); 
      const privacyLink = document.getElementById('privacyLink');

      const userAgreement = document.getElementById('userAgreement'); 
      const signupSubmit = document.getElementById('signupSubmit'); 
      const termsAgreement = document.getElementById('termsAgreement'); 
      const continueToSignupBtn = document.getElementById('continueToSignup'); 

      function showModal(modal) {
        modal.classList.add('active');
        modal.setAttribute('tabindex', '-1');
        modal.focus();
      }

      function hideModal(modal) {
        modal.classList.remove('active');
      }

      closeSignupModalBtn.addEventListener('click', () => {
        if (termsAgreement) termsAgreement.checked = false; 
        if (userAgreement) userAgreement.checked = false; 
        if (signupSubmit) signupSubmit.disabled = true;
        hideModal(signupModal);
        showModal(loginModal);
      });
      closeForgotPasswordModalBtn.addEventListener('click', () => {
        hideModal(forgotPasswordModal);
        showModal(loginModal);
      });
      closeTermsModalBtn.addEventListener('click', () => {
        hideModal(termsModal);
        showModal(loginModal);
      });
      closePrivacyModalBtn.addEventListener('click', () => {
        hideModal(privacyModal);
        showModal(loginModal);
      });
      closePrivacyModalBtn2.addEventListener('click', () => {
        hideModal(privacyModal);
        showModal(loginModal);
      });

      [signupModal, forgotPasswordModal, termsModal, privacyModal].forEach(modal => {
        modal.addEventListener('click', e => {
          if (e.target === modal) {
            hideModal(modal);
            if (modal.id !== 'loginModal') {
              showModal(loginModal);
            }
          }
        });
      });

      window.showTermsFirst = function(e) {
        e.preventDefault();
        hideModal(loginModal);
        showModal(termsModal);
        
        continueToSignupBtn.onclick = () => {
          if (!termsAgreement.checked) {
            alert('Please accept the terms to continue');
            return false;
          }
          userAgreement.checked = true;
          signupSubmit.disabled = false;
          hideModal(termsModal);
          showModal(signupModal);
        };
      };

      openLoginModalLink.addEventListener('click', e => {
        e.preventDefault();
        hideModal(signupModal);
        showModal(loginModal);
      });

      forgotPasswordLink.addEventListener('click', e => {
        e.preventDefault();
        hideModal(loginModal);
        showModal(forgotPasswordModal);
      });


      backToLoginLink.addEventListener('click', e => {
        e.preventDefault();
        hideModal(forgotPasswordModal);
        showModal(loginModal);
      });


      userAgreement.addEventListener('change', () => {
        signupSubmit.disabled = !userAgreement.checked;
      });
      
      document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;

        const signupFirstName = document.getElementById('signupFirstName');
        const signupFirstNameError = document.getElementById('signupFirstNameError');
        if (signupFirstName.value.trim() === '') {
          signupFirstName.classList.add('error');
          signupFirstNameError.textContent = 'First name is required.';
          signupFirstNameError.style.display = 'block';
          isValid = false;
        } else {
          signupFirstName.classList.remove('error');
          signupFirstNameError.style.display = 'none';
        }

        const signupLastName = document.getElementById('signupLastName');
        const signupLastNameError = document.getElementById('signupLastNameError');
        if (signupLastName.value.trim() === '') {
          signupLastName.classList.add('error');
          signupLastNameError.textContent = 'Last name is required.';
          signupLastNameError.style.display = 'block';
          isValid = false;
        } else {
          signupLastName.classList.remove('error');
          signupLastNameError.style.display = 'none';
        }

        const signupEmail = document.getElementById('signupEmail');
        const signupEmailError = document.getElementById('signupEmailError');
        if (!validateEmail(signupEmail.value)) {
          signupEmail.classList.add('error');
          signupEmailError.textContent = 'Please enter a valid email address.';
          signupEmailError.style.display = 'block';
          isValid = false;
        } else {
          signupEmail.classList.remove('error');
          signupEmailError.style.display = 'none';
        }

        const signupContactNumber = document.getElementById('signupContactNumber');
        const signupContactNumberError = document.getElementById('signupContactNumberError');
        if (signupContactNumber.value.trim() === '' || !/^\+?[0-9\s\-()]{7,20}$/.test(signupContactNumber.value)) {
          signupContactNumber.classList.add('error');
          signupContactNumberError.textContent = 'Please enter a valid contact number.';
          signupContactNumberError.style.display = 'block';
          isValid = false;
        } else {
          signupContactNumber.classList.remove('error');
          signupContactNumberError.style.display = 'none';
        }

        const signupHomeAddress = document.getElementById('signupHomeAddress');
        const signupHomeAddressError = document.getElementById('signupHomeAddressError');
        if (signupHomeAddress.value.trim() === '') {
          signupHomeAddress.classList.add('error');
          signupHomeAddressError.textContent = 'Home address is required.';
          signupHomeAddressError.style.display = 'block';
          isValid = false;
        } else {
          signupHomeAddress.classList.remove('error');
          signupHomeAddressError.style.display = 'none';
        }

        const signupPosition = document.getElementById('signupPosition');
        const signupPositionError = document.getElementById('signupPositionError');
        if (signupPosition.value === '') {
          signupPosition.classList.add('error');
          positionError.style.display = 'block';
          isValid = false;
        } else {
          signupPosition.classList.remove('error');
          positionError.style.display = 'none';
        }

        const signupPassword = document.getElementById('signupPassword');
        const signupPasswordError = document.getElementById('signupPasswordError');
        if (signupPassword.value.length < 6) {
          signupPassword.classList.add('error');
          signupPasswordError.textContent = 'Password must be at least 6 characters.';
          signupPasswordError.style.display = 'block';
          isValid = false;
        } else {
          signupPassword.classList.remove('error');
          signupPasswordError.style.display = 'none';
        }

        const signupConfirmPassword = document.getElementById('signupConfirmPassword');
        const signupConfirmPasswordError = document.getElementById('signupConfirmPasswordError');
        if (signupConfirmPassword.value !== signupPassword.value) {
          signupConfirmPassword.classList.add('error');
          signupConfirmPasswordError.textContent = 'Passwords do not match.';
          signupConfirmPasswordError.style.display = 'block';
          isValid = false;
        } else {
          signupConfirmPassword.classList.remove('error');
          signupConfirmPasswordError.style.display = 'none';
        }

        const agreementError = document.getElementById('agreementError');
        if (!userAgreement.checked) {
          agreementError.style.display = 'block';
          isValid = false;
        } else {
          agreementError.style.display = 'none';
        }

        if (isValid) {
          document.getElementById('signupSuccessMessage').style.display = 'block';
          setTimeout(() => {
            document.getElementById('signupSuccessMessage').style.display = 'none';
            hideModal(signupModal);
            showModal(loginModal);
          }, 2000);
        }
      });

      termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(signupModal);
        showModal(termsModal);
      });

      document.getElementById('loginEmail').addEventListener('input', function() {
        const emailError = document.getElementById('loginEmailError');
        const selectedRole = document.getElementById('loginRole').value || 'admin';
        
        // Clear general error when user starts typing
        document.getElementById('loginGeneralError').style.display = 'none';
        
        // Only validate email format for non-admin and non-doctor roles
        if (selectedRole !== 'admin' && selectedRole !== 'doctor' && !validateEmail(this.value)) {
          this.classList.add('error');
          emailError.textContent = 'Please enter a valid email address';
          emailError.style.display = 'block';
        } else {
          this.classList.remove('error');
          emailError.style.display = 'none';
        }
      });

      document.getElementById('loginPassword').addEventListener('input', function() {
        const passwordError = document.getElementById('loginPasswordError');
        
        // Clear general error when user starts typing
        document.getElementById('loginGeneralError').style.display = 'none';
        
        if (this.value.length < 6) {
          this.classList.add('error');
          passwordError.textContent = 'Password must be at least 6 characters';
          passwordError.style.display = 'block';
        } else {
          this.classList.remove('error');
          passwordError.style.display = 'none';
        }
      });

      privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(signupModal);
        showModal(privacyModal);
      });

      window.selectRole = function(element, role) { 
        // Remove active class from all role options
        document.querySelectorAll('.role-option').forEach(opt => {
          opt.classList.remove('active');
        });
        
        // Add active class to clicked element (with null check)
        if (element && element.classList) {
          element.classList.add('active');
        }
        
        document.getElementById('loginRole').value = role;
        document.getElementById('loginRoleError').style.display = 'none';
        document.getElementById('loginGeneralError').style.display = 'none';
        console.log('Role selected:', role);

        // Switch email input validation behavior based on role
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
          if (role === 'admin' || role === 'doctor') {
            // Allow non-email usernames for admin and doctor
            emailInput.setAttribute('type', 'text');
            emailInput.setAttribute('placeholder', 'Enter your username');
          } else {
            emailInput.setAttribute('type', 'email');
            emailInput.setAttribute('placeholder', 'Enter your email');
          }
        }
      };
      
      // Set admin as default role immediately (safe execution)
      (function ensureDefaultRole() {
        const adminOption = document.querySelector('.role-option[data-value="admin"]');
        if (adminOption && typeof window.selectRole === 'function') {
          window.selectRole(adminOption, 'admin');
        }
      })();

      function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      }

      document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;
        
        const loginRole = document.getElementById('loginRole');
        const loginRoleError = document.getElementById('loginRoleError');
        if (!loginRole.value) {
          loginRoleError.textContent = 'Please select your role.';
          loginRoleError.style.display = 'block';
          isValid = false;
        } else {
          loginRoleError.style.display = 'none';
        }

        const email = document.getElementById('loginEmail');
        const emailError = document.getElementById('loginEmailError');
        const selectedRoleForValidation = document.getElementById('loginRole').value || 'admin';
        // For admin and doctor login we treat the field as username and only require non-empty.
        if (selectedRoleForValidation === 'admin' || selectedRoleForValidation === 'doctor') {
          if (email.value.trim() === '') {
            email.classList.add('error');
            emailError.textContent = 'Please enter your username';
            emailError.style.display = 'block';
            isValid = false;
          } else {
            email.classList.remove('error');
            emailError.style.display = 'none';
          }
        } else {
          if (!validateEmail(email.value)) {
            email.classList.add('error');
            emailError.textContent = 'Please enter a valid email address';
            emailError.style.display = 'block';
            isValid = false;
          } else {
            email.classList.remove('error');
            emailError.style.display = 'none';
          }
        }

        const password = document.getElementById('loginPassword');
        const passwordError = document.getElementById('loginPasswordError');
        if (password.value.length < 6) {
          password.classList.add('error');
          passwordError.textContent = 'Password must be at least 6 characters';
          passwordError.style.display = 'block';
          isValid = false;
        } else {
          password.classList.remove('error');
          passwordError.style.display = 'none';
        }

        if (isValid) {
          (async () => {
            try {
              const emailVal = document.getElementById('loginEmail').value.trim();
              const passVal = document.getElementById('loginPassword').value;
              const selectedRole = document.getElementById('loginRole').value || 'admin';

              // Call backend login (admin or doctor authentication)
              const ROOT = window.location.origin + '/4care';
              const endpoint = (selectedRole === 'doctor')
                ? ROOT + '/Admin-Dash/Back-end/auth/doctor-login.php'
                : ROOT + '/Admin-Dash/Back-end/auth/login.php';
              console.log('Attempting login via:', endpoint);
              const formBody = new URLSearchParams();
              formBody.append('username', emailVal);
              formBody.append('password', passVal);
              const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                body: formBody.toString()
              });

              const data = await resp.json().catch(() => ({ ok:false, error:'Invalid response' }));
              if (!resp.ok || !data.ok) {
                throw new Error((data && data.error) ? data.error : 'Login failed');
              }

              // Save token for subsequent pages
              if (data.data && data.data.token) {
                localStorage.setItem('auth_token', data.data.token);
              }

              // Verify token and redirect by actual role from server, not UI toggle
              document.getElementById('loginSuccessMessage').style.display = 'block';
              
              // Redirect based on role
              if (data.role === 'doctor') {
                window.location.href = ROOT + '/Doc-Dash/4Care-Doc.html';
              } else {
                window.location.href = ROOT + '/Admin-Dash/4Care-Admin.html';
              }
            } catch (err) {
              // Clear any previous errors
              document.getElementById('loginEmailError').style.display = 'none';
              document.getElementById('loginPasswordError').style.display = 'none';
              document.getElementById('loginGeneralError').style.display = 'none';
              
              // Show error message
              let errorMessage = 'Login failed';
              
              if (err && err.message) {
                if (err.message.includes('Invalid credentials') || err.message.includes('Username and password are required')) {
                  errorMessage = 'Wrong credentials. Please check your username and password.';
                } else {
                  errorMessage = err.message;
                }
              }
              
              // Show general error message
              const generalError = document.getElementById('loginGeneralError');
              generalError.textContent = errorMessage;
              generalError.style.display = 'block';
              console.error('Login error:', err);
            }
          })();
        }
      });

      document.getElementById('signupContactNumber').addEventListener('input', function() {
        const contactNumberError = document.getElementById('signupContactNumberError');
        if (this.value.trim() === '' || !/^\+?[0-9\s\-()]{7,20}$/.test(this.value)) {
          this.classList.add('error');
          contactNumberError.textContent = 'Please enter a valid contact number.';
          contactNumberError.style.display = 'block';
        } else {
          contactNumberError.style.display = 'none';
        }
      });

      document.getElementById('signupHomeAddress').addEventListener('input', function() {
        const homeAddressError = document.getElementById('signupHomeAddressError');
        if (this.value.trim() === '') {
          this.classList.add('error');
          homeAddressError.textContent = 'Please enter your home address.';
          homeAddressError.style.display = 'block';
        } else {
          signupHomeAddress.classList.remove('error');
          homeAddressError.style.display = 'none';
        }
      });

      document.getElementById('signupPosition').addEventListener('change', function() {
        const positionError = document.getElementById('signupPositionError');
        if (this.value === '') {
          this.classList.add('error');
          positionError.style.display = 'block';
        } else {
          this.classList.remove('error');
          positionError.style.display = 'none';
        }
      });
    });