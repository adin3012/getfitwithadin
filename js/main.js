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
// ---------- Apply Now Modal ----------
const PRICING = {
  IN: { symbol: '₹', monthly: '8,000',  quarterly: '21,000', halfYearly: '38,000', annual: '71,000', flag: '🇮🇳 India' },
  US: { symbol: '$', monthly: '150',    quarterly: '375',    halfYearly: '600',    annual: '1,200',  flag: '🇺🇸 USA' },
  AU: { symbol: 'A$',monthly: '165',    quarterly: '435',    halfYearly: '790',    annual: '1,470',  flag: '🇦🇺 Australia' },
  AE: { symbol: 'AED',monthly: '600',   quarterly: '1,500',  halfYearly: '2,400',  annual: '4,800',  flag: '🇦🇪 UAE' },
};

// Inject modal into page once
(function injectApplyModal() {
  if (document.getElementById('applyModal')) return;
  const html = `
  <div class="apply-modal" id="applyModal">
    <div class="apply-modal-content">
      <button class="apply-modal-close" onclick="closeApplyModal()">✕</button>

      <!-- Step 1: WhatsApp or Form -->
      <div id="applyStep1">
        <h2>How would you like to apply?</h2>
        <p class="modal-sub">Choose your preferred way to get in touch.</p>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:28px;">
          <button class="btn btn-wa-full" onclick="applyViaWhatsApp()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Yes, message on WhatsApp
          </button>
          <button class="btn btn-outline" onclick="showApplyForm()" style="justify-content:center;">
            No, fill in the form instead
          </button>
        </div>
      </div>

      <!-- Step 2: Form -->
      <div id="applyStep2" style="display:none;">
        <h2>Start Your Transformation</h2>
        <p class="modal-sub">Fill in your details and I will get back to you within 24 hours.</p>
        <div id="contactForm">
          <div class="form-group">
            <label for="modalCountry">Your Country</label>
            <select id="modalCountry" onchange="updateModalPricing()">
              <option value="IN">🇮🇳 India</option>
              <option value="US">🇺🇸 USA</option>
              <option value="AU">🇦🇺 Australia</option>
              <option value="AE">🇦🇪 UAE</option>
            </select>
          </div>
          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" placeholder="e.g. Rahul Sharma" required />
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" placeholder="rahul@company.com" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="weight">Current Weight (kg)</label>
              <input type="number" id="weight" placeholder="e.g. 85" min="30" max="250" />
            </div>
            <div class="form-group">
              <label for="height">Height (cm)</label>
              <input type="number" id="height" placeholder="e.g. 175" min="100" max="250" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="age">Age</label>
              <input type="number" id="age" placeholder="e.g. 28" min="16" max="70" />
            </div>
            <div class="form-group">
              <label for="activity">Activity Level</label>
              <select id="activity">
                <option value="">Select level</option>
                <option value="sedentary">Sedentary (desk job, no exercise)</option>
                <option value="light">Lightly Active (1–2 days/week)</option>
                <option value="moderate">Moderately Active (3–4 days/week)</option>
                <option value="active">Very Active (5+ days/week)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="interest">Programme of Interest</label>
            <select id="interest">
              <option value="">Select a programme</option>
              <option value="monthly">Monthly — ₹8,000</option>
              <option value="quarterly">Quarterly — ₹21,000</option>
              <option value="half-yearly">Half Yearly — ₹38,000</option>
              <option value="annual">Annual — ₹71,000</option>
              <option value="just-curious">Not sure yet, just exploring</option>
            </select>
          </div>
          <div class="form-group">
            <label for="message">Your Goal</label>
            <textarea id="message" placeholder="What is your primary goal? Weight loss, muscle gain, body recomposition?"></textarea>
          </div>
          <button type="button" class="btn btn-primary" id="submitBtn" style="width:100%;justify-content:center;" onclick="handleFormSubmit()">
            Send My Details
          </button>
        </div>
        <div id="formSuccess" style="display:none;text-align:center;padding:40px 0;">
          <h3 style="margin-bottom:12px;">Message sent.</h3>
          <p style="color:var(--muted);font-size:0.9rem;">I will get back to you within 24 hours.</p>
        </div>
      </div>

    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('applyModal').addEventListener('click', e => {
    if (e.target === document.getElementById('applyModal')) closeApplyModal();
  });
})();

function openApplyModal() {
  const modal = document.getElementById('applyModal');
  if (!modal) return;
  // Reset to step 1
  document.getElementById('applyStep1').style.display = 'block';
  document.getElementById('applyStep2').style.display = 'none';
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (form) form.style.display = 'block';
  if (success) success.style.display = 'none';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showApplyForm() {
  document.getElementById('applyStep1').style.display = 'none';
  document.getElementById('applyStep2').style.display = 'block';
  updateModalPricing();
}

function applyViaWhatsApp() {
  closeApplyModal();
  window.open('https://wa.me/918638740815?text=Hi%20Adin%2C%20I%20want%20to%20start%20coaching', '_blank', 'noopener');
}

function updateModalPricing() {
  const select = document.getElementById('modalCountry');
  if (!select) return;
  const p = PRICING[select.value] || PRICING.IN;
  const interest = document.getElementById('interest');
  if (!interest) return;
  const current = interest.value;
  interest.innerHTML = `
    <option value="">Select a programme</option>
    <option value="monthly">Monthly — ${p.symbol}${p.monthly}</option>
    <option value="quarterly">Quarterly — ${p.symbol}${p.quarterly}</option>
    <option value="half-yearly">Half Yearly — ${p.symbol}${p.halfYearly}</option>
    <option value="annual">Annual — ${p.symbol}${p.annual}</option>
    <option value="just-curious">Not sure yet, just exploring</option>
  `;
  interest.value = current;
}

function closeApplyModal() {
  const modal = document.getElementById('applyModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

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
    closeApplyModal();
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
