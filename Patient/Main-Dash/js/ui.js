// UI functionality for 4Care Main Dashboard
// Handles user interface interactions and navigation

document.addEventListener('DOMContentLoaded', function() {
    console.log('UI.js loaded successfully');
    
    // Initialize all UI components
    initializeNavigation();
    initializeMobileMenu();
    initializeScrollEffects();
    initializeSearch();
    initializeBackToTop();
    initializeModals();
});

// Navigation functionality
function initializeNavigation() {
    const navbar = document.querySelector('.navbar, .nav-container, .navigation');
    
    if (navbar) {
        // Make navbar sticky on scroll
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.classList.add('sticky', 'scrolled');
            } else {
                navbar.classList.remove('sticky', 'scrolled');
            }
        });
    }
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Skip if targetId is empty, just '#', or invalid
            if (!targetId || targetId === '#' || targetId.length <= 1) {
                return;
            }
            
            try {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } catch (error) {
                console.warn('Invalid selector for smooth scrolling:', targetId);
            }
        });
    });
}

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle, .hamburger, .menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu, .nav-mobile, .mobile-nav');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            this.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mobileMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
}

// Scroll effects
function initializeScrollEffects() {
    // Fade in elements on scroll
    const fadeElements = document.querySelectorAll('.fade-in, .animate-on-scroll');
    
    if (fadeElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible', 'animated');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        fadeElements.forEach(element => {
            observer.observe(element);
        });
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-input, #search, input[type="search"]');
    const searchButton = document.querySelector('.search-button, .search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            if (query.length > 2) {
                performSearch(query);
            } else {
                clearSearchResults();
            }
        });
        
        // Handle Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.toLowerCase().trim();
                if (query.length > 0) {
                    performSearch(query);
                }
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            if (query.length > 0) {
                performSearch(query);
            }
        });
    }
}

// Search implementation
function performSearch(query) {
    // Simple text search in page content
    const searchableElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, .searchable');
    let results = [];
    
    searchableElements.forEach(element => {
        if (element.textContent.toLowerCase().includes(query)) {
            results.push(element);
        }
    });
    
    highlightSearchResults(results, query);
}

// Highlight search results
function highlightSearchResults(elements, query) {
    // Clear previous highlights
    clearSearchResults();
    
    elements.forEach(element => {
        element.classList.add('search-highlight');
        
        // Scroll to first result
        if (elements.indexOf(element) === 0) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    });
}

// Clear search results
function clearSearchResults() {
    const highlighted = document.querySelectorAll('.search-highlight');
    highlighted.forEach(element => {
        element.classList.remove('search-highlight');
    });
}

// Back to top button
function initializeBackToTop() {
    const backToTopButton = document.querySelector('.back-to-top, #backToTop');
    
    if (backToTopButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        // Scroll to top when clicked
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Modal functionality
function initializeModals() {
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal-close, .close-btn, [data-modal-close]');
    
    // Open modal
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSelector = this.getAttribute('data-modal-target');
            if (targetSelector && targetSelector.trim() !== '') {
                try {
                    const targetModal = document.querySelector(targetSelector);
                    if (targetModal) {
                        openModal(targetModal);
                    }
                } catch (error) {
                    console.warn('Invalid modal selector:', targetSelector);
                }
            }
        });
    });
    
    // Close modal
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal);
            }
        });
    });
    
    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal);
            }
        }
    });
}

// Open modal
function openModal(modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus first focusable element
    const focusableElement = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElement) {
        focusableElement.focus();
    }
}

// Close modal
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');
}

// Utility functions
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section, .tab-content, .page-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item, .tab-nav');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (sectionId && sectionId.trim() !== '') {
        try {
            const activeNavItem = document.querySelector(`[data-target="${sectionId}"], [href="#${sectionId}"]`);
            if (activeNavItem) {
                activeNavItem.classList.add('active');
            }
        } catch (error) {
            console.warn('Invalid section selector:', sectionId);
        }
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu, .nav-mobile');
    const menuToggle = document.querySelector('.mobile-menu-toggle, .hamburger');
    
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
    
    if (menuToggle) {
        menuToggle.classList.toggle('active');
    }
    
    document.body.classList.toggle('menu-open');
}

// Export functions for global use
window.showSection = showSection;
window.toggleMobileMenu = toggleMobileMenu;
window.openModal = openModal;
window.closeModal = closeModal;
