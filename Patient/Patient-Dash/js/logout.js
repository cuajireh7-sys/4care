// Logout confirmation flow

document.addEventListener('DOMContentLoaded', () => {
    const logoutConfirmationModal = document.getElementById('logoutConfirmationModal');
    const logoutBtnDesktop = document.getElementById('logoutBtnDesktop');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    const confirmLogoutYes = document.getElementById('confirmLogoutYes');
    const confirmLogoutNo = document.getElementById('confirmLogoutNo');

    function showLogoutConfirmation() { if (logoutConfirmationModal) logoutConfirmationModal.classList.add('active'); }
    function hideLogoutConfirmation() { if (logoutConfirmationModal) logoutConfirmationModal.classList.remove('active'); }

    if (logoutBtnDesktop) logoutBtnDesktop.addEventListener('click', (e) => { e.preventDefault(); showLogoutConfirmation(); });
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', (e) => { e.preventDefault(); showLogoutConfirmation(); toggleMobileMenu(); });
    if (confirmLogoutYes) confirmLogoutYes.addEventListener('click', () => { window.location.href = '../Main-Dash/4Care-Main.html'; });
    if (confirmLogoutNo) confirmLogoutNo.addEventListener('click', hideLogoutConfirmation);
});


