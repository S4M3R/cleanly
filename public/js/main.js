// Reveal animations on scroll
const reveals = document.querySelectorAll('[data-reveal]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px'
});

reveals.forEach(el => observer.observe(el));

// Copy buttons
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add('copied');
      const svg = btn.querySelector('svg');
      const original = svg.innerHTML;
      svg.innerHTML = '<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" fill="none"/>';
      setTimeout(() => {
        btn.classList.remove('copied');
        svg.innerHTML = original;
      }, 2000);
    } catch (e) {
      // Fallback: select text
    }
  });
});
