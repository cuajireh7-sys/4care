/*
  forms-logic.js
  Role-based Forms system for 4Care-Doc.html
  - Shows search bar after selecting a form button
  - Role-based routing by patient age:
      age < 1 -> "children" form (Record for Children)
      1 <= age <= 16 -> "pediatric" form (Pediatric Record)
      age > 16 -> "heeadsss" form (HEEADSSS Health Assessment)
  - Autosave to localStorage per (formType, patientId)
  - Load previous / Clear saved controls
  - Intended to be included just before </body>
*/

(function () {
    // Utility: debounce
    function debounce(fn, wait = 400) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }
  
    const MOCK_PATIENTS = [
      { id: "p001", name: "John Doe", age: 0.5, gender: "Male", barangay: "Barangay 546", phone: "09171234567", dob: "2025-04-01" },
      { id: "p002", name: "Jane Smith", age: 8, gender: "Female", barangay: "Barangay 547", phone: "09171234568", dob: "2017-03-15" },
      { id: "p003", name: "Carlos Reyes", age: 16, gender: "Male", barangay: "Barangay 548", phone: "09171234569", dob: "2009-09-10" },
      { id: "p004", name: "Ana Lopez", age: 18, gender: "Female", barangay: "Barangay 549", phone: "09171234570", dob: "2007-02-02" }
    ];
  
    function initFormsModule(options) {
      const patients = options && options.patients ? options.patients : MOCK_PATIENTS;
  
      const formsSection = document.getElementById("forms-section");
      if (!formsSection) {
        console.warn("forms-logic: #forms-section not found. Make sure the HTML snippet is added.");
        return;
      }
  
      const formButtons = formsSection.querySelectorAll(".form-btn");
      const formContainer = document.getElementById("form-container");
      const searchInput = document.getElementById("searchPatientInput");
      const patientResults = document.getElementById("patientResults");
      const patientInfo = document.getElementById("patientInfo");
      const selectedNameEl = document.getElementById("selectedPatientName");
      const selectedAgeEl = document.getElementById("selectedPatientAge");
      const selectedGenderEl = document.getElementById("selectedPatientGender");
      const selectedBarangayEl = document.getElementById("selectedPatientBarangay");
      const specificFormContainer = document.getElementById("specificFormContainer");
      const loadPreviousBtn = document.getElementById("loadPreviousBtn");
      const clearSavedBtn = document.getElementById("clearSavedBtn");
  
      if (!formContainer || !searchInput || !patientResults || !patientInfo || !specificFormContainer) {
        console.error("forms-logic: Required elements are missing from the DOM. Please ensure the HTML block for forms is present.");
        return;
      }
  
      formContainer.style.display = "none";
      patientInfo.style.display = "none";
      const searchGroup = searchInput.closest(".form-group");
      if (searchGroup) searchGroup.style.display = "none";

      // Ensure mic inside Search Patient input immediately
      (function ensureSearchMic(){
        const input = searchInput;
        if (!input || input.dataset.hasMic === "true") return;
        const wrapper = document.createElement('div');
        wrapper.className = 'voice-input-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';
        if (input.parentNode) {
          input.parentNode.insertBefore(wrapper, input);
          wrapper.appendChild(input);
          try { input.style.paddingRight = '40px'; } catch(_) {}
          const micBtn = document.createElement('button');
          micBtn.type = 'button';
          micBtn.className = 'voice-btn-inside';
          micBtn.style.position = 'absolute';
          micBtn.style.right = '10px';
          micBtn.style.top = '50%';
          micBtn.style.transform = 'translateY(-50%)';
          micBtn.style.color = '#1a73e8';
          micBtn.style.background = 'transparent';
          micBtn.style.border = 'none';
          micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
          wrapper.appendChild(micBtn);
          input.dataset.hasMic = 'true';
          micBtn.addEventListener('click', () => {
            try {
              const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
              if (!SR) return;
              const rec = new SR();
              rec.lang = 'en-PH';
              rec.continuous = false;
              rec.onresult = (e)=>{
                const t = e.results[0][0].transcript || '';
                input.value = t;
                input.dispatchEvent(new Event('input', {bubbles:true}));
              };
              rec.onend = ()=>{ micBtn.innerHTML = '<i class="fas fa-microphone"></i>'; };
              rec.start();
              micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            } catch(_) {}
          });
        }
      })();

      // New Patient Registration: place mics only when form becomes visible to avoid duplicates
      function attachRegistrationMics() {
        const container = document.getElementById('new-patient-registration-section');
        if (!container || container.dataset.micsApplied === 'true') return;
        // 1) Explicitly REMOVE mic wrappers/buttons from Patient ID and DOB if present
        ['newPatientVisibleId', 'newPatientDob'].forEach((id)=>{
          const input = container.querySelector('#' + id);
          if (!input) return;
          // Unwrap from voice-input-wrapper if previously wrapped
          const wrapper = input.parentElement && input.parentElement.classList && input.parentElement.classList.contains('voice-input-wrapper') ? input.parentElement : null;
          if (wrapper) {
            try { input.style.paddingRight = ''; } catch(_) {}
            wrapper.parentNode.insertBefore(input, wrapper);
            wrapper.remove();
          } else {
            // Or remove any mic button sibling if injected without wrapper
            const micBtn = input.parentElement && input.parentElement.querySelector && input.parentElement.querySelector('.voice-btn-inside');
            if (micBtn) micBtn.remove();
          }
          // Mark so we skip re-adding
          input.dataset.hasMic = 'true';
        });

        const inputs = container.querySelectorAll('input.input-field, textarea.input-field');
        inputs.forEach((input)=>{
          if (input.classList.contains('no-voice')) return;
          if (input.id === 'newPatientVisibleId' || input.id === 'newPatientDob') return;
          if (input.dataset.hasMic === 'true') return;
          const wrapper = document.createElement('div');
          wrapper.className = 'voice-input-wrapper';
          wrapper.style.position = 'relative';
          wrapper.style.display = 'inline-block';
          wrapper.style.width = '100%';
          input.parentNode.insertBefore(wrapper, input);
          wrapper.appendChild(input);
          try { input.style.paddingRight = '40px'; } catch(_) {}
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'voice-btn-inside';
          // Inline positioning to guarantee the mic sits inside the input (override any conflicting CSS)
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
          btn.addEventListener('click', ()=>{
            try { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return; const rec = new SR(); rec.lang='en-PH'; rec.continuous=false; rec.onresult=(e)=>{ const t=e.results[0][0].transcript||''; input.value=t; input.dispatchEvent(new Event('input',{bubbles:true})); }; rec.onend=()=>{ btn.innerHTML='<i class="fas fa-microphone"></i>'; }; rec.start(); btn.innerHTML='<i class="fas fa-microphone-slash"></i>'; } catch(_) {}
          });
        });
        container.dataset.micsApplied = 'true';
      }

      // Attach once initially if visible; also attach when navigating to the section
      attachRegistrationMics();
      document.addEventListener('click', (e)=>{
        const target = e.target.closest('[data-section]');
        if (target && target.getAttribute('data-section') === 'new-patient-registration') {
          setTimeout(attachRegistrationMics, 50);
        }
      });
  
  
      let activeFormType = null; 
      let selectedPatient = null; 
      let autosaveTimer = null;
  
      function storageKey(formType, patientId) {
        return `4care_form__${formType}__${patientId}`;
      }
  
      function renderSearchResults(list) {
        if (!list || list.length === 0) {
          patientResults.innerHTML = "<p style='color:#777'>No patients found.</p>";
          return;
        }
        patientResults.innerHTML = list.map(p => {
          return `<div class="patient-row" data-id="${p.id}" style="padding:6px 8px; border-bottom:1px solid #eee; cursor:pointer;">
                    <strong>${p.name}</strong> • ${p.age} y • ${p.gender} <div style="font-size:0.9rem;color:#666">${p.barangay || ''} ${p.phone ? '• ' + p.phone : ''}</div>
                  </div>`;
        }).join("");
  
        const rows = patientResults.querySelectorAll(".patient-row");
        rows.forEach(r => r.addEventListener("click", () => {
          const id = r.dataset.id;
          const p = patients.find(x => x.id === id);
          if (!p) return;
          selectPatient(p);
        }));
      }
  
      // Select patient and apply role-based form logic
      function selectPatient(patient) {
        selectedPatient = patient;
        if (selectedNameEl) selectedNameEl.textContent = patient.name || "";
        if (selectedAgeEl) selectedAgeEl.textContent = typeof patient.age === "number" ? patient.age : "";
        if (selectedGenderEl) selectedGenderEl.textContent = patient.gender || "";
        if (selectedBarangayEl) selectedBarangayEl.textContent = patient.barangay || "";
        patientInfo.style.display = "block";
        const age = Number(patient.age);
        let targetFormForPatient = null;
        if (!isNaN(age)) {
          if (age < 1) targetFormForPatient = "children";
          else if (age >= 1 && age <= 16) targetFormForPatient = "pediatric";
          else targetFormForPatient = "heeadsss";
        }
        if (activeFormType && targetFormForPatient && activeFormType !== targetFormForPatient) {
          const msg = `Patient is ${patient.age} year(s). The recommended form for this age is: ${prettyFormName(targetFormForPatient)}. Loading it now.`;
          showTempNotice(msg);
          activeFormType = targetFormForPatient;
        }
        renderFormFor(activeFormType || targetFormForPatient);
      }
  
      function prettyFormName(k) {
        if (k === "pediatric") return "Pediatric Record Form";
        if (k === "children") return "Record for Children Form";
        if (k === "heeadsss") return "HEEADSSS Health Assessment Form";
        return k;
      }
  
      // Show ephemeral notice near top of forms section
      function showTempNotice(text, timeout = 1800) {
        let el = formsSection.querySelector(".forms-notice");
        if (!el) {
          el = document.createElement("div");
          el.className = "forms-notice";
          el.style.padding = "8px 12px";
          el.style.background = "rgba(26,115,232,0.08)";
          el.style.border = "1px solid rgba(26,115,232,0.12)";
          el.style.borderRadius = "6px";
          el.style.marginBottom = "12px";
          formsSection.insertBefore(el, formsSection.firstChild);
        }
        el.textContent = text;
        el.style.opacity = "1";
        setTimeout(() => {
          el.style.opacity = "0";
        }, timeout);
      }
  
      // Render form templates (full forms based on your field lists)
      function renderFormFor(type) {
        if (!type) {
          specificFormContainer.innerHTML = "<p style='color:#666'>No form selected.</p>";
          return;
        }
        activeFormType = type;
        // Show container and ensure search row visible
        formContainer.style.display = "block";
        const sg = searchInput.closest(".form-group");
        if (sg) sg.style.display = "block";
  
        // Templates: include personal info display + sections as requested
        let html = "";
        if (type === "pediatric") {
          html = `
            <form id="form_${type}" class="clinic-form">
              <div class="form-section" style="background:#f7fbff;padding:12px;border-radius:8px;margin-bottom:12px;">
                <h3 class="form-section-title">Pediatric Record Form</h3>
              </div>
  
              <div class="form-section">
                <h4 class="form-section-title">Report Generation - Midwife Notes</h4>
                <div class="form-grid md-cols-2">
                  <div class="form-group"><label>Subjective Complaint</label><textarea data-field="subjective" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Objective Findings</label><textarea data-field="objective" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Age in months</label><input data-field="ageMonths" class="input-field" /></div>
                  <div class="form-group"><label>Vital Signs (weight, BMI, temp, RR)</label><input data-field="vitals" class="input-field" placeholder="eg. 12kg, BMI 16, 36.5°C, RR 20" /></div>
                  <div class="form-group"><label>Assessment</label><textarea data-field="assessment" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Plan</label><textarea data-field="plan" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Implementation</label><textarea data-field="implementation" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Time / Discharge</label><input data-field="timeDischarge" class="input-field" /></div>
                </div>
              </div>
  
              <div class="form-section">
                <h4 class="form-section-title">Doctor Orders</h4>
                <div class="form-grid md-cols-2">
                  <div class="form-group"><label>Chief Complaint</label><input data-field="doc_chiefComplaint" class="input-field" /></div>
                  <div class="form-group"><label>Findings</label><textarea data-field="doc_findings" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Impression</label><textarea data-field="doc_impression" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Management</label><textarea data-field="doc_management" class="input-field" rows="2"></textarea></div>
                </div>
              </div>
  
              <div class="form-actions" style="margin-top:10px;">
                <button type="button" class="btn btn-primary" id="saveFormBtn">Save</button>
                <button type="button" class="btn-secondary" id="printFormBtn">Print</button>
              </div>
            </form>
          `;
        } else if (type === "children") {
          html = `
            <form id="form_${type}" class="clinic-form">
              <div class="form-section" style="background:#f7fbff;padding:12px;border-radius:8px;margin-bottom:12px;">
                <h3 class="form-section-title">Record for Children</h3>
                <div style="font-size:0.95rem;color:#444;margin-bottom:8px;">(Immunization table included below)</div>
              </div>
  
              <div class="form-section">
                <h4 class="form-section-title">Basic Data & Immunization</h4>
                <div class="form-grid md-cols-2">
                  <div class="form-group"><label>Immunization History - notes</label><textarea data-field="imm_history_notes" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Breastfeeding</label>
                    <select data-field="breastfeeding" class="input-field">
                      <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
                    </select>
                  </div>
                  <div class="form-group"><label>Social History - Smoking</label><select data-field="smoking" class="input-field"><option value="">-</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                  <div class="form-group"><label>Alcohol</label><select data-field="alcohol" class="input-field"><option value="">-</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                  <div class="form-group"><label>Prohibited drugs</label><select data-field="drugs" class="input-field"><option value="">-</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                  <div class="form-group"><label>Medical History</label><textarea data-field="medicalHistory" class="input-field" rows="2"></textarea></div>
                </div>
              </div>
  
              <div class="form-section">
                <h4 class="form-section-title">Immunization Table (date given)</h4>
                <div class="form-grid">
                  <div class="form-group"><label>BCG - Date Given</label><input data-field="imm_bcg" class="input-field" /></div>
                  <div class="form-group"><label>PentaHib1 - Date</label><input data-field="imm_penta1" class="input-field" /></div>
                  <div class="form-group"><label>PentaHib2 - Date</label><input data-field="imm_penta2" class="input-field" /></div>
                  <div class="form-group"><label>PentaHib3 - Date</label><input data-field="imm_penta3" class="input-field" /></div>
                  <div class="form-group"><label>OPV1 - Date</label><input data-field="imm_opv1" class="input-field" /></div>
                  <div class="form-group"><label>OPV2 - Date</label><input data-field="imm_opv2" class="input-field" /></div>
                  <div class="form-group"><label>OPV3 - Date</label><input data-field="imm_opv3" class="input-field" /></div>
                  <div class="form-group"><label>Hep B - Date</label><input data-field="imm_hepb" class="input-field" /></div>
                  <div class="form-group"><label>Rotavirus1 - Date</label><input data-field="imm_rot1" class="input-field" /></div>
                  <div class="form-group"><label>Rotavirus2 - Date</label><input data-field="imm_rot2" class="input-field" /></div>
                  <div class="form-group"><label>AMV - Date</label><input data-field="imm_amv" class="input-field" /></div>
                  <div class="form-group"><label>MMR - Date</label><input data-field="imm_mmr" class="input-field" /></div>
                </div>
              </div>
  
              <div class="form-section">
                <h4 class="form-section-title">Doctor's Order</h4>
                <div class="form-grid md-cols-2">
                  <div class="form-group"><label>Chief complaint</label><input data-field="doc_chief" class="input-field" /></div>
                  <div class="form-group"><label>Findings</label><textarea data-field="doc_findings" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Impression</label><textarea data-field="doc_impression" class="input-field" rows="2"></textarea></div>
                  <div class="form-group"><label>Management</label><textarea data-field="doc_management" class="input-field" rows="2"></textarea></div>
                </div>
              </div>
  
              <div class="form-actions" style="margin-top:10px;">
                <button type="button" class="btn btn-primary" id="saveFormBtn">Save</button>
                <button type="button" class="btn-secondary" id="printFormBtn">Print</button>
              </div>
            </form>
          `;
        } else if (type === "heeadsss") {
          html = `
            <form id="form_${type}" class="clinic-form">
              <div class="form-section" style="background:#f7fbff;padding:12px;border-radius:8px;margin-bottom:12px;">
                <h3 class="form-section-title">HEEADSSS Health Assessment Form</h3>
                <div style="font-size:0.95rem;color:#444;margin-bottom:8px;">(Adolescent health & vitals)</div>
              </div>
  
              <div class="form-section">
                <h4 class="form-section-title">Adolescent Health Info</h4>
                <div class="form-grid md-cols-2">
                  <div class="form-group"><label>Height (cm)</label><input data-field="height" class="input-field" /></div>
                  <div class="form-group"><label>Weight (kg)</label><input data-field="weight" class="input-field" /></div>
                  <div class="form-group"><label>BMI</label><input data-field="bmi" class="input-field" /></div>
                  <div class="form-group"><label>Immunization status</label><input data-field="imm_status" class="input-field" /></div>
                </div>
              </div>
  
              <div class="form-section">
                <h4 class="form-section-title">Vital Signs & Assessment</h4>
                <div class="form-grid md-cols-2">
                  <div class="form-group"><label>Temperature</label><input data-field="temp" class="input-field" /></div>
                  <div class="form-group"><label>Respiratory Rate (RR)</label><input data-field="rr" class="input-field" /></div>
                  <div class="form-group"><label>Pulse Rate (PR)</label><input data-field="pr" class="input-field" /></div>
                  <div class="form-group"><label>Blood Pressure (BP)</label><input data-field="bp" class="input-field" /></div>
                  <div class="form-group"><label>Chief complaint</label><input data-field="chief" class="input-field" /></div>
                  <div class="form-group"><label>Working diagnosis</label><input data-field="working_diagnosis" class="input-field" /></div>
                  <div class="form-group"><label>Management</label><textarea data-field="management" class="input-field" rows="2"></textarea></div>
                </div>
              </div>
  
              <div class="form-actions" style="margin-top:10px;">
                <button type="button" class="btn btn-primary" id="saveFormBtn">Save</button>
                <button type="button" class="btn-secondary" id="printFormBtn">Print</button>
              </div>
            </form>
          `;
        } else {
          specificFormContainer.innerHTML = "<p>No form template for this type.</p>";
          return;
        }
  
        specificFormContainer.innerHTML = html;
  
        // After rendering, wire up autosave/loading and button handlers
        wireFormBehavior(type, selectedPatient && selectedPatient.id ? selectedPatient.id : null);
        // Attach voice mic buttons inside inputs for this form
        setTimeout(() => {
          try { 
            if (typeof enableVoiceInputInForm === 'function') { 
              const formEl = document.getElementById(`form_${type}`);
              if (formEl) {
                console.log('Applying microphone functionality to form:', type);
                enableVoiceInputInForm(formEl); 
              } else {
                console.warn('Form element not found:', `form_${type}`);
              }
            } 
          } catch (e) { 
            console.error('Error applying microphone functionality:', e);
          }
        }, 100);
      }
  
      // Wire up the form: load saved, attach input listeners (autosave), Save / Print handlers
      function wireFormBehavior(type, patientId) {
        const formEl = document.getElementById(`form_${type}`);
        if (!formEl) return;
  
        const key = patientId ? storageKey(type, patientId) : null;
  
        // Load if saved
        if (key && localStorage.getItem(key)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            applySavedToForm(formEl, data);
            if (loadPreviousBtn) loadPreviousBtn.style.display = "inline-block";
            if (clearSavedBtn) clearSavedBtn.style.display = "inline-block";
          } catch (e) {
            console.warn("forms-logic: error parsing saved data", e);
          }
        } else {
          if (loadPreviousBtn) loadPreviousBtn.style.display = "none";
          if (clearSavedBtn) clearSavedBtn.style.display = "none";
        }
  
        // Attach input listeners for autosave (debounced)
        const inputs = formEl.querySelectorAll("[data-field]");
        const saveNow = () => {
          if (!key) return;
          const payload = gatherFormData(formEl);
          localStorage.setItem(key, JSON.stringify(payload));
          showTempNotice("Autosaved");
        };
        const debouncedSave = debounce(saveNow, 600);
        inputs.forEach(i => {
          i.removeEventListener("input", debouncedSave); // safe: remove if previously attached
          i.addEventListener("input", debouncedSave);
          i.addEventListener("change", debouncedSave);
        });
  
        // Save button explicit
        const saveBtn = formEl.querySelector("#saveFormBtn");
        if (saveBtn) {
          saveBtn.onclick = () => {
            if (!key) {
              alert("No patient selected to save for.");
              return;
            }
            const payload = gatherFormData(formEl);
            localStorage.setItem(key, JSON.stringify(payload));
            if (loadPreviousBtn) loadPreviousBtn.style.display = "inline-block";
            if (clearSavedBtn) clearSavedBtn.style.display = "inline-block";
            alert("Form saved.");
          };
        }
  
        // Print button: opens print view of just the form contents
        const printBtn = formEl.querySelector("#printFormBtn");
        if (printBtn) {
          printBtn.onclick = () => {
            const printContent = formEl.innerHTML;
            const w = window.open("", "_blank", "width=900,height=700");
            const style = `
              <style>
                body{font-family: Arial, Helvetica, sans-serif; padding:20px; color:#111}
                h3{color:#1a73e8}
                .form-section{margin-bottom:12px}
                .input-field{display:block;width:100%;padding:6px;border:1px solid #ddd;border-radius:4px}
              </style>`;
            w.document.write(`<!doctype html><html><head><title>Print Form</title>${style}</head><body><h2>${prettyFormName(type)}</h2><div>Patient: ${selectedPatient ? selectedPatient.name : ''}</div><hr/>${printContent}</body></html>`);
            w.document.close();
            w.focus();
            setTimeout(()=> w.print(), 500);
          };
        }
  
        // Load previous
        if (loadPreviousBtn) {
          loadPreviousBtn.onclick = () => {
            if (!key) return;
            const raw = localStorage.getItem(key);
            if (!raw) { alert("No saved data."); return; }
            try {
              const obj = JSON.parse(raw);
              applySavedToForm(formEl, obj);
              alert("Loaded saved data.");
            } catch (e) {
              console.error(e);
              alert("Failed to load saved data.");
            }
          };
        }
  
        // Clear saved
        if (clearSavedBtn) {
          clearSavedBtn.onclick = () => {
            if (!key) return;
            if (!confirm("Clear saved data for this patient and form?")) return;
            localStorage.removeItem(key);
            if (loadPreviousBtn) loadPreviousBtn.style.display = "none";
            clearSavedBtn.style.display = "none";
            alert("Saved data cleared.");
          };
        }
      }
  
  
      // Gather values from form into an object
      function gatherFormData(formEl) {
        const fields = formEl.querySelectorAll("[data-field]");
        const obj = {};
        fields.forEach(f => {
          if (f.type === "checkbox") obj[f.dataset.field] = f.checked;
          else obj[f.dataset.field] = f.value;
        });
        // store metadata
        if (selectedPatient && selectedPatient.id) obj.__patientId = selectedPatient.id;
        obj.__savedAt = new Date().toISOString();
        return obj;
      }
  
      function applySavedToForm(formEl, data) {
        if (!data) return;
        const fields = formEl.querySelectorAll("[data-field]");
        fields.forEach(f => {
          const key = f.dataset.field;
          if (typeof data[key] !== "undefined") {
            if (f.type === "checkbox") f.checked = !!data[key];
            else f.value = data[key];
          }
        });
      }
  
      // Event: when user types in search input
      const performSearch = debounce(() => {
        const q = (searchInput.value || "").trim().toLowerCase();
        if (!q) {
          patientResults.innerHTML = "";
          return;
        }
        const matches = patients.filter(p => p.name.toLowerCase().includes(q));
        renderSearchResults(matches);
      }, 250);
  
      searchInput.addEventListener("input", performSearch);
  
      // Clicking a form button shows search bar (only after click) and sets activeFormType
      formButtons.forEach(b => {
        b.addEventListener("click", (ev) => {
          ev.preventDefault();
          const f = b.dataset.form;
          activeFormType = f;
          // reveal search and formContainer
          formContainer.style.display = "block";
          searchInput.closest(".form-group").style.display = "block";
          patientResults.innerHTML = "";
          patientInfo.style.display = "none";
          specificFormContainer.innerHTML = "<p style='color:#777'>Select a patient to open the form.</p>";
          // clear selection
          selectedPatient = null;
          selectedNameEl.textContent = "";
          selectedAgeEl.textContent = "";
          selectedGenderEl.textContent = "";
          selectedBarangayEl.textContent = "";
          // focus search
          setTimeout(()=> { try { searchInput.focus(); } catch (e) {} }, 80);
        });
      });
  
      // If you want to preload patient list from your existing New Patient Registration table/form,
      // you can replace / merge MOCK_PATIENTS with a call to fetch that data here.
      // Example: call a global function getRegisteredPatients() if you implemented one.
      // For now, expose a small helper to update patients array at runtime:
      function updatePatients(newList) {
        if (!Array.isArray(newList)) return;
        // mutate the patients array
        while (patients.length) patients.pop();
        newList.forEach(n => patients.push(n));
      }
  
      // Expose to window for debugging / runtime updates
      window.formsModule = {
        updatePatients,
        renderSearchResults,
        selectPatient,
        storageKey
      };
  
      // On initial load the forms section is hidden; if needed we can show it based on last state.
      // (Optional: restore last-opened form)
      try {
        const last = localStorage.getItem("4care_last_section");
        if (last === "forms") {
          // leave hidden until user clicks nav; we respect your nav toggle
        }
      } catch (e) { /* ignore */ }
    } // end initFormsModule
  
    // Auto-run on DOMContentLoaded
    document.addEventListener("DOMContentLoaded", () => {
      initFormsModule({ patients: MOCK_PATIENTS });
    });
  })();
  
  
  // ======================
  // VOICE INPUT FEATURE
  // ======================
  function enableVoiceInputInForm(formEl) {
    console.log('enableVoiceInputInForm called with:', formEl);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }
  
    // Explicitly remove mic from specific date fields if wrapped previously
    ['followUpDate'].forEach((id)=>{
      const input = formEl.querySelector('#' + id);
      if (!input) return;
      const wrapper = input.parentElement && input.parentElement.classList && input.parentElement.classList.contains('voice-input-wrapper') ? input.parentElement : null;
      if (wrapper) {
        try { input.style.paddingRight = ''; } catch(_) {}
        wrapper.parentNode.insertBefore(input, wrapper);
        wrapper.remove();
      } else {
        const micBtn = input.parentElement && input.parentElement.querySelector && input.parentElement.querySelector('.voice-btn-inside');
        if (micBtn) micBtn.remove();
      }
      input.dataset.hasMic = 'true';
    });

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-PH";
  
  // Only attach mic buttons to form inputs, not to search bars or hidden fields
  const fields = Array.from(
    formEl.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea')
  ).filter(field => 
    !field.classList.contains("no-voice") &&
    field.id !== 'newPatientVisibleId' && field.id !== 'newPatientDob' &&
    field.offsetParent !== null
  );
  
  console.log('Found fields for microphone:', fields.length, fields);
  
    fields.forEach((field) => {
      if (field.readOnly || field.disabled || field.type === "hidden") return;

      // Prevent duplicates (either already wrapped or explicitly marked)
      if (field.dataset.hasMic === "true") return;
      if (field.parentNode && field.parentNode.classList && field.parentNode.classList.contains("voice-input-wrapper")) return;
      
      console.log('Adding microphone to field:', field);

      // Create wrapper (relative), and mark field to avoid double-wrapping
      const wrapper = document.createElement("div");
      wrapper.className = "voice-input-wrapper";
      // Force positioning so mic sits inside
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.style.width = '100%';
      field.dataset.hasMic = "true";
      field.parentNode.insertBefore(wrapper, field);
      wrapper.appendChild(field);
      try { field.style.paddingRight = '40px'; } catch(_) {}

      // Create mic button INSIDE the input area (absolute at right)
      const micBtn = document.createElement("button");
      micBtn.type = "button";
      micBtn.className = "voice-btn-inside";
      // Inline styles to override conflicting CSS
      micBtn.style.position = 'absolute';
      micBtn.style.right = '10px';
      micBtn.style.top = '50%';
      micBtn.style.transform = 'translateY(-50%)';
      micBtn.style.color = '#1a73e8';
      micBtn.style.background = 'transparent';
      micBtn.style.border = 'none';
      micBtn.style.lineHeight = '1';
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      micBtn.title = "Click to use voice input";
      wrapper.appendChild(micBtn);
  
      // Handle mic click
      micBtn.addEventListener("click", () => {
        // Store reference to current field and button
        recognition.currentField = field;
        recognition.currentMicBtn = micBtn;
        
        recognition.start();
        micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        micBtn.classList.add("listening");
        micBtn.disabled = true;
      });
    });

    // Set up recognition event handlers once for all fields
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (recognition.currentField && recognition.currentMicBtn) {
        recognition.currentField.value = transcript;
        recognition.currentField.dispatchEvent(new Event("input", { bubbles: true })); // trigger autosave
        
        recognition.currentMicBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        recognition.currentMicBtn.classList.remove("listening");
        recognition.currentMicBtn.disabled = false;
      }
    };

    recognition.onerror = () => {
      if (recognition.currentMicBtn) {
        recognition.currentMicBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        recognition.currentMicBtn.classList.remove("listening");
        recognition.currentMicBtn.disabled = false;
      }
    };

    recognition.onend = () => {
      if (recognition.currentMicBtn) {
        recognition.currentMicBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        recognition.currentMicBtn.classList.remove("listening");
        recognition.currentMicBtn.disabled = false;
      }
    };
  }