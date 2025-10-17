document.addEventListener("DOMContentLoaded", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = "en-PH";
    recognition.continuous = false;
    recognition.interimResults = false;
  
    let activeField = null;
  
    // Function to attach mic buttons inside input fields
  function attachVoiceButtons(context = document) {
      const inputs = context.querySelectorAll(
        'input[type="text"], input[type="tel"], input[type="email"], input[type="date"], textarea'
      );
  
      inputs.forEach((input) => {
        if (input.dataset.hasMic) return;
        input.dataset.hasMic = "true";
  
        // Wrap input in relative container
        const wrapper = document.createElement("div");
        wrapper.className = "voice-input-wrapper";
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        try { input.style.paddingRight = '40px'; } catch(_) {}
  
        // Create mic icon inside input
        const micBtn = document.createElement("button");
        micBtn.type = "button";
        micBtn.className = "voice-btn-inside";
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        micBtn.title = "Click to use voice input";
        wrapper.appendChild(micBtn);
  
        // Click event for mic
        micBtn.addEventListener("click", () => {
          activeField = input;
          recognition.start();
          micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
          micBtn.classList.add("listening");
        });
      });
    }
  
    // Speech recognition results
    recognition.addEventListener("result", (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (activeField) {
        activeField.value = transcript;
        activeField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  
    // Stop state reset
    recognition.addEventListener("end", () => {
      document.querySelectorAll(".voice-btn-inside.listening").forEach((btn) => {
        btn.classList.remove("listening");
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
      });
    });
  
    // Attach on load
    attachVoiceButtons();

  // Open logout modal instead of navigating away
  const logoutButton = document.getElementById('logoutButton');
  const logoutModalOverlay = document.getElementById('logoutModalOverlay');
  const closeLogoutModalBtn = document.getElementById('closeLogoutModalBtn');
  const cancelLogout = document.getElementById('cancelLogout');
  const confirmLogout = document.getElementById('confirmLogout');
  if (logoutButton && logoutModalOverlay) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      logoutModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-active');
    });
  }
  function closeLogout() {
    if (logoutModalOverlay) logoutModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-active');
  }
  if (closeLogoutModalBtn) closeLogoutModalBtn.addEventListener('click', closeLogout);
  if (cancelLogout) cancelLogout.addEventListener('click', closeLogout);
  if (confirmLogout) confirmLogout.addEventListener('click', () => {
    // Clear any session data and redirect to staff login
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/4care/Staff-Login/Staff-Login.html';
  });
  
    // Watch for dynamically loaded forms (like from forms-logic.js)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) attachVoiceButtons(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });