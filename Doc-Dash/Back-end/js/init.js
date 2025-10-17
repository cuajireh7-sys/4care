(function(){
	document.addEventListener('DOMContentLoaded', function(){
		// URL message handling
		var urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('success') === '1') {
			var msg = urlParams.get('message') || 'Patient saved successfully!';
			if (window.DocDash && typeof window.DocDash.showNotification === 'function') window.DocDash.showNotification('success', 'Success!', msg);
			window.history.replaceState({}, document.title, window.location.pathname);
		} else if (urlParams.get('error') === '1') {
			var emsg = urlParams.get('message') || 'Error saving patient';
			if (window.DocDash && typeof window.DocDash.showNotification === 'function') window.DocDash.showNotification('error', 'Error!', emsg);
			window.history.replaceState({}, document.title, window.location.pathname);
		}

		// session check
		(function(){
			try {
				fetch('/4care/Admin-Dash/Back-end/auth/doctor-session.php', { credentials: 'include', cache: 'no-store' })
					.then(function(res){ if (!res.ok) throw new Error('Not authenticated'); return res.json(); })
					.then(function(data){ if (!data || !data.ok) throw new Error('Not authenticated'); })
					.catch(function(){
						var ROOT = (window.location.protocol.indexOf('http') === 0 ? (window.location.origin + '/4care') : 'http://localhost/4care');
						window.location.href = ROOT + '/Staff-Login/Staff-Login.html';
					});
			} catch (e) {}
		})();

		// password show/hide and update
		Array.prototype.forEach.call(document.querySelectorAll('.password-toggle'), function(btn){
			btn.addEventListener('click', function(){
				var targetId = btn.getAttribute('data-target');
				var input = document.getElementById(targetId);
				if (!input) return;
				var isHidden = input.type === 'password';
				input.type = isHidden ? 'text' : 'password';
				var icon = btn.querySelector('i');
				if (icon) { icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash'); }
				btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
			});
		});

		var updatePasswordBtn = document.getElementById('updatePasswordBtn');
		if (updatePasswordBtn) updatePasswordBtn.addEventListener('click', async function(e){
			e.preventDefault();
			var currentPassword = (document.getElementById('currentPassword')||{}).value;
			var newPassword = (document.getElementById('newPassword')||{}).value;
			var confirmNewPassword = (document.getElementById('confirmNewPassword')||{}).value;
			if (!currentPassword || !newPassword || !confirmNewPassword) { alert('Please fill in all password fields.'); return; }
			if (newPassword !== confirmNewPassword) { alert('New passwords do not match.'); return; }
			if (newPassword.length < 8) { alert('Password must be at least 8 characters.'); return; }
			try {
				var res = await fetch('/4care/Admin-Dash/Back-end/auth/update-doctor-password.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword, confirmPassword: confirmNewPassword }) });
				var data = await res.json();
				if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update password');
				alert('Password updated successfully. You will be redirected to login.');
				var ROOT = (window.location.protocol.indexOf('http') === 0 ? (window.location.origin + '/4care') : 'http://localhost/4care');
				window.location.href = ROOT + '/Staff-Login/Staff-Login.html';
			} catch (err) { alert(err.message || 'Unable to update password.'); }
			(document.getElementById('currentPassword')||{}).value = '';
			(document.getElementById('newPassword')||{}).value = '';
			(document.getElementById('confirmNewPassword')||{}).value = '';
		});

		// logout modal
		var logoutButton = document.getElementById('logoutButton');
		var logoutModalOverlay = document.getElementById('logoutModalOverlay');
		var closeLogoutModalBtn = document.getElementById('closeLogoutModalBtn');
		var cancelLogout = document.getElementById('cancelLogout');
		var confirmLogout = document.getElementById('confirmLogout');
		function closeLogout(){ 
			if (logoutModalOverlay){ 
				logoutModalOverlay.classList.remove('active'); 
				document.body.style.overflow=''; 
				document.body.classList.remove('modal-active');
			} 
		}
		if (logoutButton) logoutButton.addEventListener('click', function(e){ 
			e.preventDefault(); 
			if (logoutModalOverlay){ 
				logoutModalOverlay.classList.add('active'); 
				document.body.style.overflow='hidden'; 
				document.body.classList.add('modal-active');
			} 
		});
		if (closeLogoutModalBtn) closeLogoutModalBtn.addEventListener('click', closeLogout);
		if (cancelLogout) cancelLogout.addEventListener('click', closeLogout);
		if (confirmLogout) confirmLogout.addEventListener('click', function(){ 
			// Clear any session data and redirect to staff login
			sessionStorage.clear();
			localStorage.clear();
			window.location.href = '/4care/Staff-Login/Staff-Login.html'; 
		});

		// doctor profile load and status toggle
		var profileOnlineStatus = document.getElementById('profileOnlineStatus');
		var hospitalStatusText = document.getElementById('hospitalStatusText');
		var statusToggleSwitch = document.getElementById('statusToggleSwitch');
		function updateHospitalStatus(isOnline){ if (hospitalStatusText) hospitalStatusText.textContent = isOnline ? 'Online' : 'Offline'; if (profileOnlineStatus) profileOnlineStatus.style.backgroundColor = isOnline ? '#34a853' : '#dc3545'; }
		async function loadDoctorProfileFromApi(){ try { var res = await fetch('/4care/Doc-Dash/Back-end/api/get-doctor-profile.php', { credentials: 'include', cache: 'no-store' }); if (!res.ok) throw new Error('fail'); var payload = await res.json(); if (!payload || !payload.success) throw new Error('fail'); var d = payload.data || {}; var profile = { image: 'https://st2.depositphotos.com/1006318/5909/v/450/depositphotos_59095203-stock-illustration-medical-doctor-profile.jpg', name: d.username ? ('Dr. ' + String(d.username).replace(/^dr\.?\s*/i,'').replace(/_/g,' ')) : 'Doctor', position: d.specialization || '', email: d.email || '', isOnline: String(d.online_status == null ? '1' : d.online_status) === '1' }; (document.getElementById('loggedInDoctorImage')||{}).src = profile.image; if (document.getElementById('loggedInDoctorName')) document.getElementById('loggedInDoctorName').textContent = profile.name; if (document.getElementById('loggedInDoctorPosition')) document.getElementById('loggedInDoctorPosition').textContent = 'General Practitioner'; if (document.getElementById('loggedInDoctorEmail')) document.getElementById('loggedInDoctorEmail').textContent = profile.email; updateHospitalStatus(profile.isOnline); if (statusToggleSwitch) statusToggleSwitch.checked = profile.isOnline; } catch(e) { /* keep defaults */ } }
		if (statusToggleSwitch) statusToggleSwitch.addEventListener('change', async function(e){ var next = e.target.checked; updateHospitalStatus(next); if (window.DocDash && typeof window.DocDash.logActivity === 'function') window.DocDash.logActivity('Doctor','Changed Hospital Status','Status changed to ' + (next ? 'Online' : 'Offline'), !next, next); try { await fetch('/4care/Doc-Dash/Back-end/api/update-doctor-profile.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ online_status: next ? 1 : 0 }) }); } catch (e) {} });
		loadDoctorProfileFromApi();

		// kick off initial loads
		if (window.DocDash) {
			console.log('DocDash object found');
			if (typeof window.DocDash.loadPatientsFromDatabase === 'function') {
				console.log('Loading patients from database...');
				window.DocDash.loadPatientsFromDatabase();
			}
			if (typeof window.DocDash.loadDoctorDashboardStats === 'function') {
				console.log('Calling loadDoctorDashboardStats...');
				window.DocDash.loadDoctorDashboardStats();
			} else {
				console.error('loadDoctorDashboardStats function not found');
			}
		} else {
			console.error('DocDash object not found');
		}
	});
})();


