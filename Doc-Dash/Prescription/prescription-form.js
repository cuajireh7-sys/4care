// Dynamic Prescription Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let medicationCounter = 1;
    const medicationsContainer = document.getElementById('medicationsContainer');
    const addMedicationBtn = document.getElementById('addMedicationBtn');
    const savePrescriptionBtn = document.getElementById('savePrescription');
    const clearFormBtn = document.getElementById('clearForm');
    const prescriptionForm = document.getElementById('prescriptionForm');
    const patientIdInput = document.getElementById('patientId');
    const patientNameInput = document.getElementById('patientName');

    // ===== Remove Full Name suggestions: we'll only use Patient ID picker =====
    let cachedPatients = [];

    // ===== Professional typeahead for Patient ID (formatted) =====
    (function initPatientIdTypeahead(){
        if (!patientIdInput) return;
        // wrapper for suggestions
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        patientIdInput.parentNode.insertBefore(wrapper, patientIdInput);
        wrapper.appendChild(patientIdInput);

        const list = document.createElement('div');
        list.id = 'patientIdSuggestions';
        list.setAttribute('role','listbox');
        list.style.position = 'absolute';
        list.style.left = '0';
        list.style.right = '0';
        list.style.top = '100%';
        list.style.zIndex = '1000';
        list.style.background = '#ffffff';
        list.style.border = '1px solid #e5e7eb';
        list.style.borderRadius = '10px';
        list.style.boxShadow = '0 10px 24px rgba(0,0,0,0.10)';
        list.style.marginTop = '6px';
        list.style.maxHeight = '360px'; // show more; still scrollable
        list.style.overflowY = 'auto';
        list.style.display = 'none';
        wrapper.appendChild(list);

        function render(items){
            list.innerHTML = '';
            if (!items || !items.length){ list.style.display = 'none'; return; }
            items.forEach(p => {
                const row = document.createElement('div');
                row.setAttribute('role','option');
                row.style.padding = '10px 12px';
                row.style.cursor = 'pointer';
                row.style.display = 'flex';
                row.style.flexDirection = 'column';
                row.style.borderBottom = '1px solid #f1f5f9';
                row.onmouseenter = () => row.style.background = 'rgba(26,115,232,0.08)';
                row.onmouseleave = () => row.style.background = '#ffffff';
                row.innerHTML = '<div style="font-weight:600;color:#202124">' + (p.formatted_id || '') + '</div>' +
                                '<div style=\"font-size:12px;color:#6b7280;margin-top:2px\">' + (p.full_name || '') + (p.date_of_birth ? ' • DOB: ' + p.date_of_birth : '') + '</div>';
                row.addEventListener('click', function(){
                    // fill inputs
                    patientIdInput.value = p.formatted_id || '';
                    if (patientNameInput) patientNameInput.value = p.full_name || '';
                    list.style.display = 'none';
                });
                list.appendChild(row);
            });
            list.style.display = 'block';
        }

        // Ensure we have cache from previous init; if not, fetch
        function ensureCacheThenRender(cb){
            if (cachedPatients && cachedPatients.length) { cb(); return; }
            fetch('/4care/Doc-Dash/Back-end/api/get-patients-for-prescription.php')
                .then(r => r.json())
                .then(out => { if (out && out.success && Array.isArray(out.data)) cachedPatients = out.data; cb(); })
                .catch(() => cb());
        }

        patientIdInput.addEventListener('focus', function(){ ensureCacheThenRender(()=> render(cachedPatients)); });
        patientIdInput.addEventListener('input', function(){
            const q = (patientIdInput.value || '').toLowerCase();
            ensureCacheThenRender(()=>{
                const filtered = !q ? cachedPatients : cachedPatients.filter(p =>
                    String(p.formatted_id||'').toLowerCase().includes(q) || String(p.full_name||'').toLowerCase().includes(q)
                );
                render(filtered);
            });
        });
        document.addEventListener('click', function(e){ if (list && !wrapper.contains(e.target)) list.style.display = 'none'; });
    })();

    // Add medication functionality
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', function() {
            addMedicationRow();
        });
    }

    // Save prescription functionality
    if (savePrescriptionBtn) {
        savePrescriptionBtn.addEventListener('click', function() {
            savePrescription();
        });
    }

    // Clear form functionality
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', function() {
            clearForm();
        });
    }

    // Function to add a new medication row
    function addMedicationRow() {
        medicationCounter++;
        const medicationRow = document.createElement('div');
        medicationRow.className = 'medication-row';
        medicationRow.setAttribute('data-medication-id', medicationCounter);

        medicationRow.innerHTML = `
            <div class="medication-header">
                <span class="medication-number">Medication ${medicationCounter}</span>
                <button type="button" class="btn-remove-medication" onclick="removeMedication(this)">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            
            <div class="form-row">
                <div class="form-group quarter">
                    <label>Medication:</label>
                    <input type="text" name="medication[]" placeholder="Enter medication name" required>
                </div>
                <div class="form-group quarter">
                    <label>Dosage:</label>
                    <input type="text" name="dosage[]" placeholder="e.g., 500mg" required>
                </div>
                <div class="form-group quarter">
                    <label>Frequency:</label>
                    <input type="text" name="frequency[]" placeholder="e.g., 3x a day" required>
                </div>
                <div class="form-group quarter">
                    <label>Duration:</label>
                    <input type="text" name="duration[]" placeholder="e.g., 7 days">
                </div>
            </div>
        `;

        medicationsContainer.appendChild(medicationRow);
        updateRemoveButtons();
    }

    // Function to remove medication row
    window.removeMedication = function(button) {
        const medicationRow = button.closest('.medication-row');
        const medicationRows = medicationsContainer.querySelectorAll('.medication-row');
        
        // Don't allow removing if there's only one medication
        if (medicationRows.length > 1) {
            medicationRow.remove();
            updateMedicationNumbers();
            updateRemoveButtons();
        } else {
            alert('You must have at least one medication in the prescription.');
        }
    };

    // Function to update medication numbers
    function updateMedicationNumbers() {
        const medicationRows = Array.from(medicationsContainer.querySelectorAll('.medication-row'));
        let visibleIndex = 0;
        medicationRows.forEach((row) => {
            // Only count rows that are in the DOM (not deleted)
            if (row.parentElement === medicationsContainer) {
                visibleIndex += 1;
                const numberSpan = row.querySelector('.medication-number');
                numberSpan.textContent = `Medication ${visibleIndex}`;
                row.setAttribute('data-medication-id', visibleIndex);
            }
        });
        // Keep the global counter equal to the current visible count so the next add is sequential
        medicationCounter = visibleIndex;
    }

    // Function to show/hide remove buttons
    function updateRemoveButtons() {
        const medicationRows = medicationsContainer.querySelectorAll('.medication-row');
        const removeButtons = medicationsContainer.querySelectorAll('.btn-remove-medication');
        
        if (medicationRows.length > 1) {
            removeButtons.forEach(button => {
                button.style.display = 'block';
            });
        } else {
            removeButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
    }

    // Function to save prescription
    function savePrescription() {
        const patientId = document.getElementById('patientId').value;
        const patientName = document.getElementById('patientName').value;
        
        if (!patientId.trim()) {
            alert('Please enter a Patient ID.');
            return;
        }
        
        if (!patientName.trim()) {
            alert('Please enter a patient name.');
            return;
        }

        // Collect all medications
        const medications = [];
        const medicationRows = medicationsContainer.querySelectorAll('.medication-row');
        
        let hasValidMedication = false;
        
        medicationRows.forEach((row, index) => {
            const medication = row.querySelector('input[name="medication[]"]').value;
            const dosage = row.querySelector('input[name="dosage[]"]').value;
            const frequency = row.querySelector('input[name="frequency[]"]').value;
            const duration = row.querySelector('input[name="duration[]"]').value;

            if (medication.trim() && dosage.trim() && frequency.trim()) {
                medications.push({
                    medication: medication.trim(),
                    dosage: dosage.trim(),
                    frequency: frequency.trim(),
                    duration: duration.trim()
                });
                hasValidMedication = true;
            }
        });

        if (!hasValidMedication) {
            alert('Please enter at least one complete medication (name, dosage, and frequency are required).');
            return;
        }

        // Prepare data for submission
        const prescriptionData = {
            patientId: patientId.trim(),
            patientName: patientName.trim(),
            medications: medications,
            date: new Date().toISOString(),
            doctorId: getCurrentDoctorId() // You'll need to implement this function
        };

        // Send to server
        submitPrescription(prescriptionData);
    }

    // Function to submit prescription to server
    function submitPrescription(data) {
        // Show loading state
        savePrescriptionBtn.disabled = true;
        savePrescriptionBtn.textContent = 'Saving...';

        fetch('/4care/Doc-Dash/Back-end/api/save-prescription.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Prescription saved successfully!');
                clearForm();
                
                // Log activity if function exists
                if (typeof logActivity === 'function') {
                    logActivity('Doctor', 'Created Prescription', 
                        `Patient: ${data.patientName} (ID: ${data.patientId}), Medications: ${data.medications.length}`, 
                        null, { patientId: data.patientId, patientName: data.patientName, medicationCount: data.medications.length });
                }
            } else {
                alert('Error saving prescription: ' + (result.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving prescription. Please try again.');
        })
        .finally(() => {
            // Reset button state
            savePrescriptionBtn.disabled = false;
            savePrescriptionBtn.textContent = 'Save Prescription';
        });
    }

    // Function to clear form
    function clearForm() {
        if (confirm('Are you sure you want to clear the form? All entered data will be lost.')) {
            prescriptionForm.reset();
            
            // Reset to single medication row
            const medicationRows = medicationsContainer.querySelectorAll('.medication-row');
            for (let i = 1; i < medicationRows.length; i++) {
                medicationRows[i].remove();
            }
            
            medicationCounter = 1;
            updateMedicationNumbers();
            updateRemoveButtons();
        }
    }

    // Function to get current doctor ID (implement based on your authentication system)
    function getCurrentDoctorId() {
        // This should return the current logged-in doctor's ID
        // You might get this from a session variable, localStorage, or global variable
        // For now, returning a placeholder
        return window.currentDoctorId || 1;
    }

    // Initialize remove buttons visibility
    updateRemoveButtons();
});
