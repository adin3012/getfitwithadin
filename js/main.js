/* ============================================================
   main.js — Adin Ankur Saikia Personal Website
   ============================================================ */

// ---------- Mobile Menu ----------
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
  hamburger.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open');
    const isOpen = mobileMenu.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMobileMenu();
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
  IN: { symbol: '₹', monthly: '6,000',  quarterly: '15,000', halfYearly: '27,000', annual: '51,000', flag: '🇮🇳 India' },
  US: { symbol: '$', monthly: '110',    quarterly: '280',    halfYearly: '505',    annual: '955',    flag: '🇺🇸 USA' },
  AU: { symbol: 'A$',monthly: '125',    quarterly: '310',    halfYearly: '555',    annual: '1,050',  flag: '🇦🇺 Australia' },
  AE: { symbol: 'AED',monthly: '450',   quarterly: '1,125',  halfYearly: '2,025',  annual: '3,825',  flag: '🇦🇪 UAE' },
};

// ---------- Google Sheets Lead Capture ----------
// HOW TO SET UP:
// 1. Go to forms.google.com and create a new form
// 2. Add 5 Short Answer questions: Name, Email, WhatsApp, Interest, Source
// 3. Copy the form URL — the FORM_ID is the long string between /d/e/ and /viewform
// 4. To get entry IDs: open the form, right-click > Inspect, fill a field and look for "entry.XXXXXXX" in the network tab
//    OR use this shortcut: open the form URL + "?usp=pp_url&entry.FIELD_ID=test" to find each ID
// 5. Paste the IDs below and set LEADS_ENABLED = true

const LEADS_ENABLED = true;
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSeJ7AgQlp80vZ3bHDcOA604Iz0aTFwJcg8BYirZLkYY9EdK_A/formResponse';
const LEAD_FIELDS = {
  name:      'entry.2107149741',
  email:     'entry.526745828',
  whatsapp:  'entry.655107678',
  interest:  'entry.884049450',
  source:    'entry.653971467',
};

function submitLeadToSheets(data) {
  if (!LEADS_ENABLED) return;
  const body = new URLSearchParams();
  if (data.name)     body.append(LEAD_FIELDS.name,     data.name);
  if (data.email)    body.append(LEAD_FIELDS.email,    data.email);
  if (data.whatsapp) body.append(LEAD_FIELDS.whatsapp, data.whatsapp);
  if (data.interest) body.append(LEAD_FIELDS.interest, data.interest);
  if (data.source)   body.append(LEAD_FIELDS.source,   data.source);
  fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
}

// ---------- Entry Lead Gate (mandatory — cannot be skipped) ----------
(function injectLeadPopup() {
  if (localStorage.getItem('gfwa_lead_captured') === '1') return;
  if (document.getElementById('leadPopup')) return;

  const html = `
  <div class="apply-modal" id="leadPopup" style="display:flex;opacity:1;">
    <div class="apply-modal-content" style="max-width:460px;">
      <div id="leadPopupForm">
        <p style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;">Free Consultation</p>
        <h2 style="font-size:1.5rem;margin-bottom:8px;">Before you explore —</h2>
        <p class="modal-sub">Drop your details and I'll personally reach out to answer any questions.</p>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px;">
          <input type="text"  id="lpName"     placeholder="Your name *"        style="padding:13px 16px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.95rem;outline:none;font-family:inherit;" />
          <input type="email" id="lpEmail"    placeholder="Email address *"    style="padding:13px 16px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.95rem;outline:none;font-family:inherit;" />
          <input type="tel"   id="lpWhatsApp" placeholder="WhatsApp number *"  style="padding:13px 16px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:0.95rem;outline:none;font-family:inherit;" />
          <button id="lpSubmitBtn" onclick="handleLeadPopupSubmit()" class="btn btn-primary" style="justify-content:center;margin-top:4px;">Explore the Site →</button>
        </div>
      </div>
      <div id="leadPopupSuccess" style="display:none;text-align:center;padding:32px 0;">
        <div style="font-size:2rem;margin-bottom:12px;">👋</div>
        <h3 style="margin-bottom:8px;">Got it — I'll reach out soon.</h3>
        <p style="color:var(--muted);font-size:0.9rem;">Taking you in now...</p>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  // Lock scroll until submitted
  document.body.style.overflow = 'hidden';
})();

function handleLeadPopupSubmit() {
  const name     = (document.getElementById('lpName')?.value || '').trim();
  const email    = (document.getElementById('lpEmail')?.value || '').trim();
  const whatsapp = (document.getElementById('lpWhatsApp')?.value || '').trim();

  if (!name)    { document.getElementById('lpName').style.borderColor='var(--accent)'; document.getElementById('lpName').focus(); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('lpEmail').style.borderColor='var(--accent)'; document.getElementById('lpEmail').focus(); return; }
  if (!whatsapp){ document.getElementById('lpWhatsApp').style.borderColor='var(--accent)'; document.getElementById('lpWhatsApp').focus(); return; }

  const btn = document.getElementById('lpSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Just a sec...'; }

  submitLeadToSheets({ name, email, whatsapp, source: 'entry-popup' });
  localStorage.setItem('gfwa_lead_captured', '1');

  document.getElementById('leadPopupForm').style.display    = 'none';
  document.getElementById('leadPopupSuccess').style.display = 'block';

  setTimeout(() => closeLeadPopup(), 2500);
}

function closeLeadPopup() {
  const popup = document.getElementById('leadPopup');
  if (!popup) return;
  popup.style.opacity = '0';
  setTimeout(() => { popup.style.display = 'none'; document.body.style.overflow = ''; }, 300);
}


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
            Message on WhatsApp
          </button>
          <button class="btn btn-outline" onclick="window.open('https://calendly.com/adin3012','_blank','noopener');closeApplyModal();" style="justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Book a Free Call
          </button>
          <button class="btn btn-ghost" onclick="showApplyForm()" style="justify-content:center;font-size:0.9rem;">
            Fill in the form instead
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
            <input type="text" id="name" placeholder="e.g. John Smith" required maxlength="80" autocomplete="name" />
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" placeholder="john@example.com" required maxlength="120" autocomplete="email" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="weight">Current Weight (kg)</label>
              <input type="number" id="weight" placeholder="e.g. 85" min="30" max="300" required />
            </div>
            <div class="form-group">
              <label for="height">Height (cm)</label>
              <input type="number" id="height" placeholder="e.g. 175" min="100" max="250" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="age">Age</label>
              <input type="number" id="age" placeholder="e.g. 28" min="16" max="80" required />
            </div>
            <div class="form-group">
              <label for="activity">Activity Level</label>
              <select id="activity" required>
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
            <select id="interest" required>
              <option value="">Select a programme</option>
              <option value="monthly">Monthly — ₹6,000</option>
              <option value="quarterly">Quarterly — ₹15,000</option>
              <option value="half-yearly">Half Yearly — ₹27,000</option>
              <option value="annual">Annual — ₹51,000</option>
              <option value="just-curious">Not sure yet, just exploring</option>
            </select>
          </div>
          <div class="form-group">
            <label for="message">Your Goal</label>
            <textarea id="message" placeholder="What is your primary goal? Weight loss, muscle gain, body recomposition?" maxlength="1000" required></textarea>
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

function sanitize(str, maxLen) {
  if (!str) return '';
  return str.replace(/[<>"'`]/g, '').slice(0, maxLen).trim();
}

function handleFormSubmit() {
  const name     = sanitize(document.getElementById('name')?.value, 80);
  const email    = sanitize(document.getElementById('email')?.value, 120);
  const weight   = sanitize(document.getElementById('weight')?.value, 5);
  const height   = sanitize(document.getElementById('height')?.value, 5);
  const age      = sanitize(document.getElementById('age')?.value, 3);
  const activity = document.getElementById('activity')?.value || '';
  const interest = document.getElementById('interest')?.value || '';
  const message  = sanitize(document.getElementById('message')?.value, 1000);

  if (!name || !email || !weight || !height || !age || !activity || !interest || !message) {
    alert('Please fill in all fields before submitting.');
    return;
  }

  if (+weight < 30 || +weight > 300) { alert('Please enter a valid weight (30–300 kg).'); return; }
  if (+height < 100 || +height > 250) { alert('Please enter a valid height (100–250 cm).'); return; }
  if (+age < 16 || +age > 80) { alert('Please enter a valid age (16–80).'); return; }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  // Validate select values against allowed options
  const validActivity = ['sedentary','light','moderate','active'];
  const validInterest = ['monthly','quarterly','half-yearly','annual','just-curious'];
  if (!validActivity.includes(activity) || !validInterest.includes(interest)) {
    alert('Please select your activity level and programme of interest.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

  // Log lead to Google Sheets in parallel (fire and forget)
  submitLeadToSheets({ name, email, interest, source: 'apply-modal' });

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://getfitwithadin.com';
  fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, weight, height, age, activity, interest, message })
  })
  .then(res => {
    if (!res.ok) throw new Error('Server error');
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
  })
  .catch(() => {
    if (btn) { btn.disabled = false; btn.textContent = 'Send My Details'; }
    alert('Something went wrong. Please try again or contact me directly on WhatsApp.');
  });
}

// Allow Enter key on submit button only (not on form inputs, to avoid accidental early submission)
const submitBtn = document.getElementById('submitBtn');
if (submitBtn) {
  submitBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') submitBtn.click();
  });
}

// ---------- Testimonial touch-pause ----------
const testimonialsScroll = document.querySelector('.testimonials-scroll');
if (testimonialsScroll) {
  let isTouching = false;
  testimonialsScroll.addEventListener('touchstart', () => {
    isTouching = true;
    testimonialsScroll.style.animationPlayState = 'paused';
  }, { passive: true });
  testimonialsScroll.addEventListener('touchend', () => {
    isTouching = false;
    setTimeout(() => {
      if (!isTouching) testimonialsScroll.style.animationPlayState = 'running';
    }, 1000);
  }, { passive: true });
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
    closeMobileMenu();
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
document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('countrySelect')) updatePricing(); });

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
