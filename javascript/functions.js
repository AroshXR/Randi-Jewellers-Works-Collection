document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, {
        threshold: 0.1 // Adjust this value to change when elements become visible
    });

    const hiddenItems = document.querySelectorAll('.hidden');
    hiddenItems.forEach((el) => observer.observe(el));
});