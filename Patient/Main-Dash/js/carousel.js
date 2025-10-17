// Carousel functionality for 4Care Main Dashboard
// Handles the hero image slider on the landing page

document.addEventListener('DOMContentLoaded', function() {
    // Look for the actual carousel elements in the HTML
    const carousel = document.querySelector('.carousel-container');
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    // Also check for services carousel
    const servicesCarousel = document.querySelector('.services-carousel-wrapper');
    const servicesInner = document.querySelector('.services-carousel-inner');
    
    if (!carousel && !servicesCarousel) {
        console.log('Carousel elements not found, skipping carousel initialization');
        return;
    }
    
    console.log('Carousel elements found:', {
        carousel: !!carousel,
        slides: slides.length,
        indicators: indicators.length,
        servicesCarousel: !!servicesCarousel
    });

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;

    // Initialize carousel
    function initCarousel() {
        if (slides.length === 0) {
            console.log('No slides found, carousel will be static');
            return;
        }
        
        // Show first slide
        showSlide(0);
        
        // Only start auto-slide if there are multiple slides
        if (slides.length > 1) {
            startAutoSlide();
        }
        
        // Add click handlers to indicators if they exist
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                goToSlide(index);
            });
        });
        
        // Pause auto-slide on hover (only if carousel exists)
        if (carousel) {
            carousel.addEventListener('mouseenter', stopAutoSlide);
            carousel.addEventListener('mouseleave', () => {
                if (slides.length > 1) startAutoSlide();
            });
        }
        
        // Initialize services carousel if it exists
        if (servicesCarousel && servicesInner) {
            initServicesCarousel();
        }
    }

    // Show specific slide
    function showSlide(index) {
        // Hide all slides
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
            slide.style.transform = 'translateX(100%)';
        });
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.remove('active');
        });
        
        // Show current slide
        if (slides[index]) {
            slides[index].classList.add('active');
            slides[index].style.opacity = '1';
            slides[index].style.transform = 'translateX(0)';
        }
        
        // Update indicator
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }
        
        currentSlide = index;
    }

    // Go to specific slide
    function goToSlide(index) {
        if (index >= 0 && index < totalSlides) {
            showSlide(index);
            // Restart auto-slide timer
            stopAutoSlide();
            startAutoSlide();
        }
    }

    // Go to next slide
    function nextSlide() {
        const next = (currentSlide + 1) % totalSlides;
        showSlide(next);
    }

    // Go to previous slide
    function prevSlide() {
        const prev = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(prev);
    }

    // Start auto-slide
    function startAutoSlide() {
        stopAutoSlide(); // Clear any existing interval
        autoSlideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    // Stop auto-slide
    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });

    // Services carousel functionality
    function initServicesCarousel() {
        console.log('Initializing services carousel');
        
        const serviceItems = servicesInner.querySelectorAll('.service-item, .service-card');
        const pagination = document.getElementById('services-pagination');
        
        if (serviceItems.length > 0) {
            console.log(`Found ${serviceItems.length} service items`);
            
            // Create pagination dots if pagination container exists
            if (pagination) {
                serviceItems.forEach((item, index) => {
                    const dot = document.createElement('div');
                    dot.className = 'pagination-dot';
                    if (index === 0) dot.classList.add('active');
                    dot.addEventListener('click', () => scrollToService(index));
                    pagination.appendChild(dot);
                });
            }
        }
    }
    
    function scrollToService(index) {
        const serviceItems = servicesInner.querySelectorAll('.service-item, .service-card');
        if (serviceItems[index]) {
            serviceItems[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
            
            // Update pagination
            const dots = document.querySelectorAll('.pagination-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
    }

    // Initialize the carousel
    initCarousel();
    
    // Expose functions globally if needed
    window.carousel = {
        next: nextSlide,
        prev: prevSlide,
        goTo: goToSlide,
        start: startAutoSlide,
        stop: stopAutoSlide,
        scrollToService: scrollToService
    };
});
