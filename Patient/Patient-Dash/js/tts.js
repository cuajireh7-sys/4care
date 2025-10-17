// Text-to-speech helpers reused by sections

function initSpeakButtons() {
    const buttons = document.querySelectorAll('.speak-section-btn');
    buttons.forEach(btn => {
        if (!btn.style.display) btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        if (!btn.style.minWidth) btn.style.minWidth = '190px';
        btn.style.whiteSpace = 'nowrap';
        btn.style.justifyContent = 'space-between';
        if (!btn.style.paddingLeft) btn.style.paddingLeft = '18px';
        if (!btn.style.paddingRight) btn.style.paddingRight = '18px';
        let leadingIcon = btn.querySelector('i');
        if (!leadingIcon) {
            leadingIcon = document.createElement('i');
            leadingIcon.className = 'fas fa-volume-up';
            leadingIcon.style.marginRight = '8px';
            btn.insertBefore(leadingIcon, btn.firstChild);
        } else {
            leadingIcon.className = 'fas fa-volume-up';
            if (!leadingIcon.style.marginRight) leadingIcon.style.marginRight = '8px';
        }
        let tail = btn.querySelector('.tts-tail');
        if (!tail) {
            tail = document.createElement('span');
            tail.className = 'tts-tail';
            tail.style.display = 'inline-flex';
            tail.style.alignItems = 'center';
            tail.style.gap = '6px';
            tail.style.marginLeft = '8px';
            btn.appendChild(tail);
        }
        let pauseEl = tail.querySelector('.tts-pause-inbtn');
        if (!pauseEl) {
            pauseEl = document.createElement('span');
            pauseEl.className = 'tts-pause-inbtn';
            pauseEl.innerHTML = '<i class="fas fa-pause"></i>';
            pauseEl.style.display = 'inline-flex';
            pauseEl.style.alignItems = 'center';
            pauseEl.style.justifyContent = 'center';
            pauseEl.style.width = '1rem';
            pauseEl.style.height = '1rem';
            pauseEl.style.color = '#ffffff';
            pauseEl.style.opacity = '0.9';
            pauseEl.style.cursor = 'pointer';
            pauseEl.style.visibility = 'hidden';
            pauseEl.addEventListener('click', function(e){ e.stopPropagation(); try { if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); } else if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); } } catch (err) {} updateSpeakButtonControls(); });
            tail.appendChild(pauseEl);
        } else { pauseEl.style.visibility = 'hidden'; }
        let repeatEl = tail.querySelector('.tts-repeat-inbtn');
        if (!repeatEl) {
            repeatEl = document.createElement('span');
            repeatEl.className = 'tts-repeat-inbtn';
            repeatEl.innerHTML = '<i class="fas fa-rotate-right"></i>';
            repeatEl.style.display = 'inline-flex';
            repeatEl.style.alignItems = 'center';
            repeatEl.style.justifyContent = 'center';
            repeatEl.style.width = '1rem';
            repeatEl.style.height = '1rem';
            repeatEl.style.color = '#0ea5e9';
            repeatEl.style.cursor = 'pointer';
            repeatEl.style.visibility = 'hidden';
            repeatEl.addEventListener('click', function(e){ e.stopPropagation(); if (window.currentTtsText) { try { window.speechSynthesis.cancel(); } catch (err) {} speakText(window.currentTtsText, btn); } });
            tail.appendChild(repeatEl);
        } else { repeatEl.style.visibility = 'hidden'; }
    });
}

function speakText(text, buttonRef) {
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; utterance.rate = 1; utterance.pitch = 1;
        window.currentUtterance = utterance; window.currentTtsButton = buttonRef || null; window.currentTtsText = text;
        utterance.onend = function() { updateSpeakButtonControls(); };
        utterance.onpause = function() { updateSpeakButtonControls(); };
        utterance.onresume = function() { updateSpeakButtonControls(); };
        window.speechSynthesis.speak(utterance);
        updateSpeakButtonControls();
    } else {
        alert('Your browser does not support text-to-speech.');
    }
}

document.addEventListener('click', function(event) {
    const trigger = event.target.classList && event.target.classList.contains('speak-section-btn') ? event.target : (event.target.closest ? event.target.closest('.speak-section-btn') : null);
    if (!trigger) return;
    const sectionId = trigger.dataset.sectionId;
    let textToSpeak = '';
    if (sectionId === 'homeSection') {
        const profileCard = document.querySelector('.patient-profile-card');
        if (profileCard) { const clone = profileCard.cloneNode(true); const viewProfileBtn = clone.querySelector('#patientInfoTrigger'); if (viewProfileBtn) viewProfileBtn.remove(); const speakBtn = clone.querySelector('.speak-section-btn'); if (speakBtn) speakBtn.remove(); textToSpeak = clone.innerText; }
    } else {
        const section = document.getElementById(sectionId);
        if (section) { const clone = section.cloneNode(true); const speakBtn = clone.querySelector('.speak-section-btn'); if (speakBtn) speakBtn.remove(); textToSpeak = clone.innerText; }
    }
    textToSpeak = textToSpeak.replace(/\s+/g, ' ').trim();
    if (textToSpeak) {
        if (window.speechSynthesis && window.speechSynthesis.speaking && window.currentTtsButton === trigger) {
            if (window.speechSynthesis.paused) { try { window.speechSynthesis.resume(); } catch (e) {} }
            else { try { window.speechSynthesis.pause(); } catch (e) {} }
            updateSpeakButtonControls();
        } else { speakText(textToSpeak, trigger); }
    }
});

function updateSpeakButtonControls() {
    if (!window.currentTtsButton) return;
    const btn = window.currentTtsButton;
    const isSpeaking = window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused;
    const isPaused = window.speechSynthesis && window.speechSynthesis.paused;
    let tail = btn.querySelector('.tts-tail');
    if (!tail) { tail = document.createElement('span'); tail.className = 'tts-tail'; tail.style.display = 'inline-flex'; tail.style.alignItems = 'center'; tail.style.gap = '6px'; tail.style.marginLeft = '8px'; btn.appendChild(tail); }
    let pauseEl = tail.querySelector('.tts-pause-inbtn');
    if (!pauseEl) {
        pauseEl = document.createElement('span'); pauseEl.className = 'tts-pause-inbtn'; pauseEl.innerHTML = '<i class="fas fa-pause"></i>';
        pauseEl.style.display = 'inline-flex'; pauseEl.style.alignItems = 'center'; pauseEl.style.justifyContent = 'center'; pauseEl.style.width = '1rem'; pauseEl.style.height = '1rem'; pauseEl.style.color = '#ffffff'; pauseEl.style.opacity = '0.9'; pauseEl.style.cursor = 'pointer';
        pauseEl.addEventListener('click', function(e){ e.stopPropagation(); try { if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); } else if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); } } catch (err) {} updateSpeakButtonControls(); });
        tail.appendChild(pauseEl);
    }
    let repeatEl = tail.querySelector('.tts-repeat-inbtn');
    if (!repeatEl) {
        repeatEl = document.createElement('span'); repeatEl.className = 'tts-repeat-inbtn'; repeatEl.innerHTML = '<i class="fas fa-rotate-right"></i>';
        repeatEl.style.display = 'inline-flex'; repeatEl.style.alignItems = 'center'; repeatEl.style.justifyContent = 'center'; repeatEl.style.width = '1rem'; repeatEl.style.height = '1rem'; repeatEl.style.color = '#0ea5e9'; repeatEl.style.cursor = 'pointer';
        repeatEl.addEventListener('click', function(e){ e.stopPropagation(); if (window.currentTtsText) { try { window.speechSynthesis.cancel(); } catch (err) {} speakText(window.currentTtsText, btn); } });
        tail.appendChild(repeatEl);
    }
    const showControls = (isSpeaking || isPaused);
    pauseEl.style.visibility = showControls ? 'visible' : 'hidden';
    repeatEl.style.visibility = showControls ? 'visible' : 'hidden';
    const pauseIcon = pauseEl.querySelector('i');
    if (pauseIcon) pauseIcon.className = 'fas ' + (isPaused ? 'fa-play' : 'fa-pause');
    const iconEl = btn.querySelector('i');
    if (iconEl) { iconEl.className = 'fas fa-volume-up'; if (!iconEl.style.marginRight) iconEl.style.marginRight = '8px'; }
    if (!(isSpeaking || isPaused)) window.currentTtsButton = null;
}


