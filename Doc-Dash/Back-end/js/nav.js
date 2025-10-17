(function(){
	var navItems = document.querySelectorAll('.nav-item');
	var contentSections = document.querySelectorAll('.content-section');
	var body = document.body;
	var sectionsToHideSidebar = ['appointments','patients','inventory','activity-log','admin-settings','announcements','new-patient-registration','profile','settings','doctor-schedules','upload-prescription'];

	Array.prototype.forEach.call(navItems, function(item){
		item.addEventListener('click', function(e){
			e.preventDefault();
			Array.prototype.forEach.call(navItems, function(i){ i.classList.remove('active'); });
			this.classList.add('active');
			var sectionId = this.getAttribute('data-section') + '-section';
			var dataSection = this.getAttribute('data-section');
			Array.prototype.forEach.call(contentSections, function(sec){ sec.classList.remove('active'); });
			var target = document.getElementById(sectionId);
			if (target) target.classList.add('active');
			if (sectionsToHideSidebar.indexOf(dataSection) !== -1) body.classList.add('hide-right-sidebar'); else body.classList.remove('hide-right-sidebar');
			if (dataSection === 'inventory' && window.DocDash && typeof window.DocDash.renderInventoryTable === 'function') window.DocDash.renderInventoryTable('');
			if (dataSection === 'upload-prescription' && typeof window.populatePrescriptionPatientSelect === 'function') {
				window.populatePrescriptionPatientSelect();
				if (typeof window.populatePrescriptionGmailSelect === 'function') {
					window.populatePrescriptionGmailSelect();
				}
			}
			if (dataSection === 'patients' && window.DocDash && typeof window.DocDash.loadPatientsFromDatabase === 'function') window.DocDash.loadPatientsFromDatabase();
		});
	});

	var dashboardSection = document.getElementById('dashboard-section'); if (dashboardSection) dashboardSection.classList.add('active');
	body.classList.remove('hide-right-sidebar');
})();


