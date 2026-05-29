document.addEventListener("DOMContentLoaded", () => {
    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const adjustNavbar = () => {
            const isDesktop = window.innerWidth > 768;
            if (window.scrollY > 50) {
                if (isDesktop) navbar.style.padding = '15px 80px';
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
            } else {
                if (isDesktop) navbar.style.padding = '25px 80px';
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        };
        window.addEventListener('scroll', adjustNavbar);
        window.addEventListener('resize', adjustNavbar);
        adjustNavbar();
    }

    // Dynamic Copyright Year
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Mobile Hamburger Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Intersection Observer Helper
    const observeElements = () => {
        if (!('IntersectionObserver' in window)) {
            // Fallback: immediately show all hidden items
            document.querySelectorAll('.hidden').forEach((el) => {
                el.classList.add('show');
                el.classList.remove('hidden');
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        });

        const hiddenItems = document.querySelectorAll('.hidden');
        hiddenItems.forEach((el) => observer.observe(el));
    };

    // Initial observer for hardcoded elements
    observeElements();

    // Fallback images in case Supabase database is unreachable (offline/firewall)
    const FALLBACK_IMAGES = [
        // Gold works (g1.jpg to g22.jpg, g23.png)
        ...Array.from({ length: 22 }, (_, i) => ({
            id: `g${i + 1}`,
            url: `img/iloveimg-watermarked/g${i + 1}.jpg`,
            category: 'gold',
            title: '',
            description: '',
            isfeatured: false
        })),
        {
            id: 'g23',
            url: 'img/iloveimg-watermarked/g23.png',
            category: 'gold',
            title: '',
            description: '',
            isfeatured: false
        },
        // Silver works (s0.jpg to s10.jpg)
        ...Array.from({ length: 11 }, (_, i) => ({
            id: `s${i}`,
            url: `img/iloveimg-watermarked/s${i}.jpg`,
            category: 'silver',
            title: '',
            description: '',
            isfeatured: false
        })),
        // Large works (m4.jpg to m10.jpg)
        ...[4, 5, 6, 7, 8, 9, 10].map(num => ({
            id: `m${num}`,
            url: `img/iloveimg-watermarked/m${num}.jpg`,
            category: 'large',
            title: '',
            description: '',
            isfeatured: false
        })),
        // Featured works
        {
            id: 'featured-1',
            url: 'img/iloveimg-watermarked/m1.png',
            category: 'large',
            title: 'The Golden Cobra',
            description: 'This Golden Cobra was created for Mayurapathi Kovil Wallawatta associated with Nithyakalyani Jewellery.',
            isfeatured: true
        },
        {
            id: 'featured-2',
            url: 'img/iloveimg-watermarked/m3.png',
            category: 'large',
            title: 'Royal Gold & Diamond Handbag',
            description: "This Gold + diamond hand bag was created for one of king brunei's wives associated with Mouwad KSA.",
            isfeatured: true
        }
    ];

    // Fetch Images dynamically
    const galleryContainer = document.getElementById('dynamic-gallery');
    if (!galleryContainer) return;

    // Helper to render the gallery UI
    const renderGallery = (images) => {
        // Group images
        const goldWorks = images.filter(img => img.category === 'gold' && !img.isfeatured);
        const silverWorks = images.filter(img => img.category === 'silver' && !img.isfeatured);
        const largeWorks = images.filter(img => img.category === 'large' && !img.isfeatured);
        const featuredWorks = images.filter(img => img.isfeatured);

        let html = '';

        // Featured Works (if any)
        if (featuredWorks.length > 0) {
            html += `
            <div class="gallery-category">
                <h3>Featured Works</h3>
                <div class="featured-works">
            `;
            featuredWorks.forEach((feat, index) => {
                const reverseClass = index % 2 !== 0 ? 'reverse' : '';
                let imageHtml = `<a href="${feat.url}" data-lightbox="featured-${feat.id}"><img src="${feat.url}" alt="${feat.title}"></a>`;
                
                let imagesClass = 'single-img';
                
                // Support dynamic extra images (specifically mapping m2.png as an extra image for the m1.png Golden Cobra)
                let extraImagesList = [];
                if (feat.url.includes('m1.png')) {
                    if (feat.url.startsWith('http')) {
                        extraImagesList = ['https://edwtsxkpiyqqrtkqqanf.supabase.co/storage/v1/object/public/gallery/m2.png'];
                    } else {
                        extraImagesList = ['img/iloveimg-watermarked/m2.png'];
                    }
                }

                if (extraImagesList.length > 0) {
                    imagesClass = 'double-img';
                    extraImagesList.forEach(extra => {
                        imageHtml += `<a href="${extra}" data-lightbox="featured-${feat.id}"><img src="${extra}" alt="${feat.title} extra"></a>`;
                    });
                }

                html += `
                    <div class="featured-item ${reverseClass} hidden">
                        <div class="featured-images ${imagesClass}">
                            ${imageHtml}
                        </div>
                        <div class="featured-text">
                            <h4 class="featured-title">${feat.title}</h4>
                            <p class="featured-desc">${feat.description}</p>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
        }

        // Helper to build grid
        const buildCategory = (title, categoryImages, bannerUrl = null) => {
            if (categoryImages.length === 0) return '';
            let catHtml = `
                <div class="gallery-category">
            `;
            
            if (bannerUrl) {
                catHtml += `
                    <div class="category-banner hidden">
                        <img src="${bannerUrl}" alt="${title} Banner">
                    </div>
                `;
            }

            catHtml += `
                    <h3 class="other-works-title">${title}</h3>
                    <div class="gallery-grid">
            `;
            categoryImages.forEach(img => {
                catHtml += `<a href="${img.url}" data-lightbox="${img.category}"><img src="${img.url}" alt="${title}"></a>`;
            });
            catHtml += `</div></div>`;
            return catHtml;
        };

        html += buildCategory('Gold Works', goldWorks, 'img/banners/gold banner.png');
        html += buildCategory('Silver Works', silverWorks, 'img/banners/silver banner.png');
        html += buildCategory('Large Scale Works', largeWorks);

        galleryContainer.innerHTML = html;

        // Observe the newly added dynamic elements
        observeElements();

        // Reveal the gallery section smoothly
        const gallerySection = document.getElementById('gallery');
        if (gallerySection) {
            gallerySection.classList.add('show');
            gallerySection.classList.remove('hidden');
        }
    };

    if (typeof supabaseClient === 'undefined') {
        console.warn("Supabase client is not defined. Falling back to local watermarked images.");
        renderGallery(FALLBACK_IMAGES);
        return;
    }

    supabaseClient
        .from('images')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data: images, error }) => {
            if (error) {
                console.error("Supabase fetch error, falling back to local images:", error);
                renderGallery(FALLBACK_IMAGES);
                return;
            }
            renderGallery(images);
        })
        .catch(err => {
            console.error("Failed to fetch gallery images, falling back to local images:", err);
            renderGallery(FALLBACK_IMAGES);
        });

    // Floating Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});