// UI: section switching and mobile menu

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
}

function toggleMobileMenu() {
    const mobileNavMenu = document.getElementById('mobileNavMenu');
    if (mobileNavMenu) mobileNavMenu.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    showSection('homeSection');
});


