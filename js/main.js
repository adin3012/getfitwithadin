/* ============================================================
   main.js — Adin Ankur Saikia Personal Website
   ============================================================ */

// ---------- Mobile Menu ----------
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open');
    const isOpen = mobileMenu.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
      hamburger.setAttribute('aria-label', 'Open menu');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
    }
  });
}

// ---------- Scroll Fade-In Animation ----------
const observerOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Animate cards and sections on scroll
const animateTargets = document.querySelectorAll(
  '.identity-card, .life-card, .usp-card, .result-card, .for-who-card, ' +
  '.step-card, .pricing-card, .what-you-get-grid .get-item, ' +
  '.cert-card, .timeline-item, .contact-method'
);

animateTargets.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity 0.5s ease ${(i % 4) * 0.08}s, transform 0.5s ease ${(i % 4) * 0.08}s`;
  observer.observe(el);
});

// ---------- Active Nav Link ----------
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
  const href = link.getAttribute('href');
  if (href && href.split('#')[0] === currentPage) {
    link.classList.add('active');
  }
});

// ---------- Smooth scroll for anchor links ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---------- Contact Form ----------
function handleFormSubmit() {
  const name     = document.getElementById('name')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const weight   = document.getElementById('weight')?.value.trim();
  const height   = document.getElementById('height')?.value.trim();
  const age      = document.getElementById('age')?.value.trim();
  const activity = document.getElementById('activity')?.value;
  const interest = document.getElementById('interest')?.value;
  const message  = document.getElementById('message')?.value.trim();

  if (!name || !email) {
    alert('Please enter your name and email address.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  // Save to server
  fetch('https://getfitwithadin.onrender.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, weight, height, age, activity, interest, message })
  }).catch(() => {});

  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (form) form.style.display = 'none';
  if (success) success.style.display = 'block';
}

// Allow Enter key on submit button only (not on form inputs, to avoid accidental early submission)
const submitBtn = document.getElementById('submitBtn');
if (submitBtn) {
  submitBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') submitBtn.click();
  });
}

// ---------- Navbar scroll style ----------
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (!nav) return;
  if (window.scrollY > 40) {
    nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

// ---------- Number counter animation ----------
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target + (el.dataset.suffix || '');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start) + (el.dataset.suffix || '');
    }
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      if (!isNaN(target)) animateCounter(el, target);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ---------- Transformation Modal ----------
function openTransformModal() {
  const modal = document.getElementById('transformModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeTransformModal() {
  const modal = document.getElementById('transformModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeTransformModal();
  }
});

// ---------- FAQ Accordion ----------
function toggleFaq(element) {
  const faqItem = element.closest('.faq-item');
  const isActive = faqItem.classList.contains('active');
  
  // Close all FAQs
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Open clicked one if it wasn't active
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ---------- Video Play ----------
function toggleVideo() {
  const video = document.getElementById('journeyVideo');
  if (!video) return;
  const btn = video.nextElementSibling;
  
  if (video.paused) {
    video.play();
    btn.classList.add('hidden');
  } else {
    video.pause();
    btn.classList.remove('hidden');
  }
}

// ---------- Dynamic Pricing ----------
function updatePricing() {
  const select = document.getElementById('countrySelect');
  if (!select) return;
  const selectedOption = select.options[select.selectedIndex];
  const symbol = selectedOption.dataset.symbol;
  
  const prices = document.querySelectorAll('.pricing-card .price[data-plan]');
  
  prices.forEach(priceEl => {
    const plan = priceEl.dataset.plan;
    const price = selectedOption.dataset[plan];
    
    let formattedPrice;
    if (symbol === '₹') {
      formattedPrice = `${symbol}${parseInt(price).toLocaleString('en-IN')}`;
    } else {
      formattedPrice = `${symbol}${parseInt(price).toLocaleString()}`;
    }
    
    priceEl.textContent = formattedPrice;
  });
}
