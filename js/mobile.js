/* SIREN Mobile JavaScript */
/* Include this on all pages */

(function() {
    'use strict';

    // Only run on mobile
    const isMobile = () => window.innerWidth <= 768;

    // Current page detection
    const currentPath = window.location.pathname;
    const getActivePage = () => {
        if (currentPath.includes('/browse')) return 'browse';
        if (currentPath.includes('/watch')) return 'watch';
        if (currentPath.includes('/clips')) return 'clips';
        if (currentPath.includes('/search')) return 'search';
        if (currentPath.includes('/account')) return 'profile';
        if (currentPath === '/' || currentPath.includes('/index.html') || currentPath.endsWith('/')) return 'home';
        return 'home';
    };

    // Inject bottom navigation
    const injectMobileNav = () => {
        // Don't inject if already exists
        if (document.querySelector('.mobile-nav')) return;

        const activePage = getActivePage();
        
        const navHTML = `
            <nav class="mobile-nav" id="mobileNav">
                <!-- SVG Gradient Definition -->
                <svg width="0" height="0" style="position:absolute">
                    <defs>
                        <linearGradient id="nav-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#ef4444"/>
                            <stop offset="100%" style="stop-color:#f97316"/>
                        </linearGradient>
                    </defs>
                </svg>

                <a href="../index.html" class="mobile-nav-item ${activePage === 'home' ? 'active' : ''}" data-page="home">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>Home</span>
                </a>

                <a href="../browse/index.html" class="mobile-nav-item ${activePage === 'browse' ? 'active' : ''}" data-page="browse">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                        <line x1="7" y1="2" x2="7" y2="22"/>
                        <line x1="17" y1="2" x2="17" y2="22"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <line x1="2" y1="7" x2="7" y2="7"/>
                        <line x1="2" y1="17" x2="7" y2="17"/>
                        <line x1="17" y1="17" x2="22" y2="17"/>
                        <line x1="17" y1="7" x2="22" y2="7"/>
                    </svg>
                    <span>Browse</span>
                </a>

                <a href="../clips/index.html" class="mobile-nav-item ${activePage === 'clips' ? 'active' : ''}" data-page="clips">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <span>Clips</span>
                </a>

                <a href="../search/index.html" class="mobile-nav-item ${activePage === 'search' ? 'active' : ''}" data-page="search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>Search</span>
                </a>

                <a href="../account/index.html" class="mobile-nav-item ${activePage === 'profile' ? 'active' : ''}" data-page="profile">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Profile</span>
                </a>
            </nav>
        `;

        document.body.insertAdjacentHTML('beforeend', navHTML);
    };

    // Hide mobile nav on watch page when controls are hidden
    const handleWatchPage = () => {
        if (!currentPath.includes('/watch')) return;

        const mobileNav = document.getElementById('mobileNav');
        const controlsOverlay = document.getElementById('controlsOverlay');
        
        if (!mobileNav || !controlsOverlay) return;

        // Create mutation observer to watch for controls visibility
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isVisible = controlsOverlay.classList.contains('visible');
                    mobileNav.style.transform = isVisible ? 'translateY(0)' : 'translateY(100%)';
                    mobileNav.style.transition = 'transform 0.3s ease';
                }
            });
        });

        observer.observe(controlsOverlay, { attributes: true });

        // Initially hide if controls not visible
        if (!controlsOverlay.classList.contains('visible')) {
            mobileNav.style.transform = 'translateY(100%)';
        }
    };

    // Touch feedback effect
    const addTouchFeedback = () => {
        document.querySelectorAll('.touch-feedback').forEach(el => {
            el.addEventListener('touchstart', (e) => {
                const rect = el.getBoundingClientRect();
                const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
                el.style.setProperty('--touch-x', x + '%');
                el.style.setProperty('--touch-y', y + '%');
            });
        });
    };

    // Pull to refresh (optional, for future use)
    const initPullToRefresh = () => {
        // Can implement later if needed
    };

    // Swipe gestures for navigation (optional)
    const initSwipeGestures = () => {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 100;
            const diff = touchEndX - touchStartX;

            // Only trigger on edge swipes
            if (touchStartX < 30 && diff > swipeThreshold) {
                // Swipe right from left edge - go back
                if (window.history.length > 1) {
                    window.history.back();
                }
            }
        };
    };

    // Prevent overscroll/bounce on iOS
    const preventOverscroll = () => {
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('.allow-scroll')) return;
            
            const scrollable = e.target.closest('.scrollable, .row-scroll, .mobile-menu');
            if (!scrollable) return;

            const { scrollTop, scrollHeight, clientHeight } = scrollable;
            const atTop = scrollTop <= 0;
            const atBottom = scrollTop + clientHeight >= scrollHeight;

            if ((atTop && e.touches[0].clientY > e.touches[0].clientY) ||
                (atBottom && e.touches[0].clientY < e.touches[0].clientY)) {
                // Allow default behavior
            }
        }, { passive: true });
    };

    // Viewport height fix for mobile browsers
    const fixViewportHeight = () => {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    };

    // Hide address bar on scroll (mobile browsers)
    const hideAddressBar = () => {
        if (window.scrollY === 0) {
            window.scrollTo(0, 1);
        }
    };

    // Initialize everything
    const init = () => {
        injectMobileNav();
        fixViewportHeight();
        addTouchFeedback();
        initSwipeGestures();
        
        if (isMobile()) {
            handleWatchPage();
            // hideAddressBar();
        }

        // Re-check on resize
        window.addEventListener('resize', () => {
            if (isMobile()) {
                handleWatchPage();
            }
        });
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
