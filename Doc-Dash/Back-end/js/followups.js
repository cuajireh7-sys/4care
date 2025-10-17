(function(){
    // Signal dashboard.js to skip its internal follow-up wiring
    window.UseExternalFollowUps = true;

    function byId(id){ return document.getElementById(id); }

    function populatePatientIds(patients){
        const sel = byId('followUpPatientId');
        if (!sel) return;
        sel.innerHTML = '<option value="">Select Patient ID</option>';
        (patients || window.DocDash?.patientsData || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = (p.patient_id ? ('#'+String(p.patient_id).padStart(5,'0')) : p.id);
            sel.appendChild(opt);
        });
    }

    async function populateSignupEmails(){
        const sel = byId('followUpPatientEmail');
        if (!sel) return;
        sel.innerHTML = '<option value="">Loading emails...</option>';
        try {
            const res = await fetch('/4care/Doc-Dash/Back-end/api/get-all-patient-emails.php');
            const out = await res.json();
            const list = out && out.data ? out.data : [];
            sel.innerHTML = '<option value="">Select Email (optional)</option>' + list.map(e => `<option value="${e.email}">${e.email}</option>`).join('');
        } catch(e) { sel.innerHTML = '<option value="">Failed to load emails</option>'; }
    }

    async function populateDoctors(){
        const sel = byId('followUpDoctorId');
        if (!sel) return;
        sel.innerHTML = '<option value="">Loading doctors...</option>';
        try {
            // Fetch doctors with employee_id and display name
            const res = await fetch('/4care/Doc-Dash/Back-end/api/get-doctors-list.php');
            const out = await res.json();
            const list = Array.isArray(out && out.data) ? out.data : [];
            const options = list
                .map(row => ({ id: String(row.employee_id || '').trim(), name: String(row.name || '').trim() }))
                .filter(r => r.id.length > 0 && r.name.length > 0)
                .map(r => `<option value="${r.id}">${r.name}</option>`)
                .join('');
            sel.innerHTML = '<option value="">Select Doctor</option>' + options;
        } catch(e){ sel.innerHTML = '<option value="">Failed to load doctors</option>'; }
    }

    function renderFollowUpsTable(){
        const tbody = byId('followUpsTableBody');
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
                    <button class="btn btn-danger btn-sm" data-delete-index="${idx}" style="margin-left:6px;"><i class="fas fa-trash" style="margin-right:5px;"></i>Delete</button>
                </td>`;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('button[data-edit-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-edit-index'));
                const fu = (window.followUps||[])[idx];
                const overlay = byId('addFollowUpModalOverlay');
                if (!fu || !overlay) return;
                overlay.classList.add('active');
                document.body.style.overflow='hidden';
                const pidSelect = byId('followUpPatientId');
                const pname = byId('followUpPatientName');
                const details = byId('followUpDetails');
                const date = byId('followUpDate');
                const status = byId('followUpStatus');
                const idxInput = byId('followUpIndex');
                const idInput = byId('followUpId');
                if (pidSelect) pidSelect.value = fu.patientId;
                if (pname) pname.value = fu.patientName || '';
                if (details) details.value = fu.details || '';
                if (date) date.value = fu.date || '';
                if (status) status.value = fu.status || 'Pending';
                if (idxInput) idxInput.value = String(idx);
                if (idInput) idInput.value = fu.id || '';
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
    }

    async function loadFollowUps(){
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
        } catch(e){ console.error('Failed to load follow-ups', e); }
    }

    async function saveFollowUpFromForm(e){
        e.preventDefault();
        const pidSelect = byId('followUpPatientId');
        const pnameInput = byId('followUpPatientName');
        const dateInput = byId('followUpDate');
        const detailsEl = byId('followUpDetails');
        const statusEl = byId('followUpStatus');
        const idxInput = byId('followUpIndex');
        const idInput = byId('followUpId');
        const id = pidSelect ? pidSelect.value : '';
        const doctorSel = byId('followUpDoctorId');
        const doctorId = doctorSel ? doctorSel.value : '';
        const emailSel = byId('followUpPatientEmail');
        const email = emailSel ? emailSel.value : '';
        const details = detailsEl ? detailsEl.value : '';
        const date = dateInput ? dateInput.value : '';
        const statusSel = statusEl ? statusEl.value : 'Pending';
        if (!id || !doctorId || !details || !date){ alert('Please complete all required fields.'); return; }
        const sel = (window.DocDash?.patientsData || []).find(p => p.id === id);
        const payload = {
            id: idInput && idInput.value ? idInput.value : '',
            patient_id: sel ? sel.patient_id : parseInt((id||'').replace('pat','')) || 0,
            email: email,
            patient_name: sel ? (sel.firstName + ' ' + sel.lastName) : (pnameInput ? pnameInput.value : ''),
            details: details,
            doctor_name: doctorId,
            date: date,
            status: (statusSel === 'Done' ? 'Done' : 'Pending')
        };
        try {
            const res = await fetch('/4care/Doc-Dash/Back-end/api/save-follow-up.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
            const out = await res.json();
            if (!out.success) { alert(out.message || 'Save failed'); return; }
            window.followUps = window.followUps || [];
            const rec = { id: out.id || payload.id || null, patientId: String(id), patientNumericId: payload.patient_id, patientDisplayId: payload.email || ('#'+String(payload.patient_id||0).padStart(5,'0')), patientName: payload.patient_name, details: payload.details, date: payload.date, status: 'Pending' };
            if (idxInput && idxInput.value !== '') {
                const i = parseInt(idxInput.value); if (!isNaN(i)) window.followUps[i] = rec;
            } else {
                window.followUps.unshift(rec);
            }
            renderFollowUpsTable();
            closeModal();
        } catch(err){ console.error('Save follow-up error', err); alert('Network error saving follow-up'); }
    }

    function openModal(){ const overlay = byId('addFollowUpModalOverlay'); if (overlay){ overlay.classList.add('active'); document.body.style.overflow='hidden'; const dateInput = byId('followUpDate'); if (dateInput){ dateInput.value = new Date().toISOString().split('T')[0]; } const idxInput = byId('followUpIndex'); if (idxInput) idxInput.value=''; const idInput = byId('followUpId'); if (idInput) idInput.value=''; populatePatientIds(); populateSignupEmails(); populateDoctors(); } }
    function closeModal(){ const overlay = byId('addFollowUpModalOverlay'); const form = byId('addFollowUpForm'); if (overlay){ overlay.classList.remove('active'); document.body.style.overflow=''; } if (form) form.reset(); }

    document.addEventListener('DOMContentLoaded', function(){
        const openBtn = byId('addFollowUpBtn');
        const overlay = byId('addFollowUpModalOverlay');
        const closeBtn = byId('closeAddFollowUpModalBtn');
        const cancelBtn = byId('cancelAddFollowUpBtn');
        const form = byId('addFollowUpForm');
        const pidSelect = byId('followUpPatientId');
        const pnameInput = byId('followUpPatientName');
        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closeModal(); });
        if (pidSelect) pidSelect.addEventListener('change', function(){ const sel = (window.DocDash?.patientsData || []).find(p => p.id === pidSelect.value); if (pnameInput) pnameInput.value = sel ? (sel.firstName + ' ' + sel.lastName) : ''; });
        if (form) form.addEventListener('submit', saveFollowUpFromForm);
        loadFollowUps();
    });

    // Expose for other scripts if needed
    window.renderFollowUpsTable = renderFollowUpsTable;
    window.loadFollowUps = loadFollowUps;
})();


