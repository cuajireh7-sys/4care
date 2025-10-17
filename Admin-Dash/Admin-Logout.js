document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    const logoutModalOverlay = document.getElementById('logoutModalOverlay');
    const closeLogoutModalBtn = document.getElementById('closeLogoutModalBtn');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    // Show logout confirmation modal when logout button is clicked
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        logoutModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close logout modal function
    function closeLogoutModal() {
        logoutModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close modal event listeners
    closeLogoutModalBtn.addEventListener('click', closeLogoutModal);
    cancelLogout.addEventListener('click', closeLogoutModal);

    // Confirm logout action
    confirmLogout.addEventListener('click', () => {
        // Redirect to staff login page after logout
        console.log('Admin logged out, redirecting to staff login');
        window.location.href = '../Staff-Login/Staff-Login.html';
    });

    // Close modal if clicked outside the modal content
    logoutModalOverlay.addEventListener('click', (e) => {
        if (e.target === logoutModalOverlay) {
            closeLogoutModal();
        }
    });
});
