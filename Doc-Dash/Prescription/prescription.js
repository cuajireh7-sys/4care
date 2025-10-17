            // New: Upload Prescription Section Logic
            const uploadPrescriptionForm = document.getElementById('uploadPrescriptionForm');
            const prescriptionPatientSelect = document.getElementById('prescriptionPatientSelect');
            const prescriptionFile = document.getElementById('prescriptionFile');
            const uploadedPrescriptionsList = document.getElementById('uploadedPrescriptionsList');
            const prescriptionViewerModalOverlay = document.getElementById('prescriptionViewerModalOverlay');
            const closePrescriptionViewerModalBtn = document.getElementById('closePrescriptionViewerModalBtn');
            const prescriptionViewerIframe = document.getElementById('prescriptionViewerIframe');

            function populatePrescriptionPatientSelect() {
                // Clear existing options, but keep the example patient if it exists
                const existingOptions = prescriptionPatientSelect.querySelectorAll('option:not([value=""])');
                existingOptions.forEach(option => {
                    if (option.value !== 'pat1') { // Keep the example patient
                        option.remove();
                    }
                });

                patientsData.forEach(patient => {
                    // Only add if not already present (e.g., the example patient)
                    if (!prescriptionPatientSelect.querySelector(`option[value="${patient.id}"]`)) {
                        const option = document.createElement('option');
                        option.value = patient.id;
                        option.textContent = `${patient.firstName} ${patient.lastName}`;
                        prescriptionPatientSelect.appendChild(option);
                    }
                });
            }

            if (uploadPrescriptionForm) uploadPrescriptionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const selectedPatientId = prescriptionPatientSelect.value;
                const file = prescriptionFile.files[0];

                if (!selectedPatientId) {
                    alert('Please select a patient.');
                    return;
                }
                if (!file) {
                    alert('Please select a prescription file to upload.');
                    return;
                }

                const patient = patientsData.find(p => p.id === selectedPatientId);
                if (patient) {
                    console.log(`Uploading prescription for patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
                    console.log('File:', file);
                    
                    // In a real application, you would send this file to a server
                    // using FormData and an XMLHttpRequest or Fetch API.
                    // Example:
                    // const formData = new FormData();
                    // formData.append('patientId', selectedPatientId);
                    // formData.append('prescription', file);
                    // fetch('/api/upload-prescription', {
                    //     method: 'POST',
                    //     body: formData
                    // })
                    // .then(response => response.json())
                    // .then(data => {
                    //     alert('Prescription uploaded successfully!');
                    //     console.log('Upload response:', data);
                    //     uploadPrescriptionForm.reset();
                    // })
                    // .catch(error => {
                    //     console.error('Error uploading prescription:', error);
                    //     alert('Failed to upload prescription.');
                    // });

                    alert(`Prescription "${file.name}" uploaded successfully for ${patient.firstName} ${patient.lastName}! (Simulated upload)`);
                    if (typeof logActivity === 'function') {
                        logActivity('Doctor', 'Uploaded Prescription', `Patient: ${patient.firstName} ${patient.lastName}, File: ${file.name}` , null, { patientId: patient.id, fileName: file.name });
                    }
                    
                    // Add the uploaded file to the list (simulated)
                    const newFileItem = document.createElement('div');
                    newFileItem.classList.add('uploaded-file-item');
                    const fileName = `${patient.firstName}_${patient.lastName}_Prescription_${new Date().toISOString().slice(0, 10)}_${file.name}`;
                    // For demonstration, we'll use a placeholder URL. In a real app, this would be the URL returned by your server.
                    const fileUrl = URL.createObjectURL(file); // Create a temporary URL for the uploaded file
                    newFileItem.innerHTML = `
                        <i class="fas fa-file-pdf"></i>
                        <span class="file-name">${fileName}</span>
                        <button class="btn btn-primary view-prescription-btn" data-file-url="${fileUrl}">View</button>
                    `;
                    uploadedPrescriptionsList.appendChild(newFileItem);
                    addPrescriptionViewListener(newFileItem.querySelector('.view-prescription-btn'));

                    uploadPrescriptionForm.reset();
                } else {
                    alert('Selected patient not found.');
                }
            });

            // Function to open the prescription viewer modal
            function openPrescriptionViewerModal(fileUrl) {
                prescriptionViewerIframe.src = fileUrl;
                prescriptionViewerModalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            // Function to close the prescription viewer modal
            function closePrescriptionViewerModal() {
                prescriptionViewerModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
                prescriptionViewerIframe.src = ''; // Clear the iframe source
            }

            // Event listeners for the prescription viewer modal
            if (closePrescriptionViewerModalBtn) closePrescriptionViewerModalBtn.addEventListener('click', closePrescriptionViewerModal);
            if (prescriptionViewerModalOverlay) prescriptionViewerModalOverlay.addEventListener('click', (e) => {
                if (e.target === prescriptionViewerModalOverlay) {
                    closePrescriptionViewerModal();
                }
            });

            // Add event listener to existing and dynamically added view buttons
            function addPrescriptionViewListener(button) {
                button.addEventListener('click', (e) => {
                    const fileUrl = e.currentTarget.dataset.fileUrl;
                    openPrescriptionViewerModal(fileUrl);
                });
            }

            // Attach listener to the example file initially
            const exampleViewButton = document.querySelector('.uploaded-file-item .view-prescription-btn');
            if (exampleViewButton) {
                addPrescriptionViewListener(exampleViewButton);
            }
    

        var saveBtn = document.getElementById('savePrescription');
        if (saveBtn) saveBtn.addEventListener('click', () => {
  const data = {
    patient: patientName.value,
    medication: medication.value,
    dosage: dosage.value,
    frequency: frequency.value,
    instructions: instructions.value,
    date: new Date().toLocaleString()
  };
  console.log('Prescription saved:', data);
  alert('Prescription saved successfully!');
});