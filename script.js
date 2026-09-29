/* ==========================================================
   Personal CV - Bashar Ayman Elazony
   Design of Web-Based Systems, Assignment 2 (Interactive CV)
   ----------------------------------------------------------
   Six JavaScript features, each in its own section below:
     1. Welcome message               (Option 5)
     2. Dark / light mode toggle      (Option 3)
     3. Show / hide sections          (Option 2)
     4. Interactive experience details (Option 6)
     5. Dynamic skills list           (Option 4)
     6. Contact form with validation  (Option 1)

   All code runs after the DOM has parsed, because this file is
   loaded with the `defer` attribute on the <script> tag.
   ========================================================== */

/* ---------------------------------------------------------
   1. Welcome message (a toast that appears once per visit)
   --------------------------------------------------------- */
(function welcomeMessage() {
  const toast = document.getElementById('welcome-toast');
  const textEl = document.getElementById('welcome-toast-text');
  const closeBtn = document.getElementById('welcome-toast-close');
  if (!toast || !textEl || !closeBtn) return;

  // A friendly greeting that changes with the time of day.
  const hour = new Date().getHours();
  let greeting = 'Welcome to my portfolio page!';
  if (hour < 12) {
    greeting = 'Good morning! Welcome to my portfolio page.';
  } else if (hour < 18) {
    greeting = 'Good afternoon! Welcome to my portfolio page.';
  } else {
    greeting = 'Good evening! Welcome to my portfolio page.';
  }
  textEl.textContent = greeting;

  function showToast() {
    toast.hidden = false;
    // Wait a frame so the browser registers the starting state
    // before the "visible" class runs the transition.
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
  }

  function hideToast() {
    toast.classList.remove('toast--visible');
    // Remove from the accessibility tree once the fade-out finishes.
    window.setTimeout(() => { toast.hidden = true; }, 300);
  }

  showToast();
  const autoHide = window.setTimeout(hideToast, 6000);

  closeBtn.addEventListener('click', () => {
    window.clearTimeout(autoHide);
    hideToast();
  });
})();

/* ---------------------------------------------------------
   2. Dark / light mode toggle
   --------------------------------------------------------- */
(function themeToggle() {
  const STORAGE_KEY = 'cv-theme';
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  if (!button) return;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  // On first visit, follow the browser/OS setting; after that,
  // remember whatever the visitor chose with the button.
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });
})();

/* ---------------------------------------------------------
   Shared helper: toggle a collapsible element open/closed
   and flip the label + aria-expanded state on its button.
   Used by both the section show/hide feature and the
   per-role "show details" buttons below.
   --------------------------------------------------------- */
function setupCollapseToggle(button, { showLabel, hideLabel }) {
  const targetId = button.getAttribute('data-target');
  const target = document.getElementById(targetId);
  if (!target) return;

  button.addEventListener('click', () => {
    const isCollapsed = target.classList.toggle('is-collapsed');
    button.setAttribute('aria-expanded', String(!isCollapsed));
    button.textContent = isCollapsed ? showLabel : hideLabel;
  });
}

/* ---------------------------------------------------------
   3. Show / hide whole sections (Skills, Achievements)
   --------------------------------------------------------- */
(function sectionToggles() {
  document.querySelectorAll('.card > h2 > .toggle-btn').forEach((button) => {
    setupCollapseToggle(button, { showLabel: 'Show section', hideLabel: 'Hide section' });
  });
})();

/* ---------------------------------------------------------
   4. Interactive experience details (per-role show/hide)
   --------------------------------------------------------- */
(function experienceDetails() {
  document.querySelectorAll('.toggle-btn--details').forEach((button) => {
    setupCollapseToggle(button, { showLabel: 'Show details', hideLabel: 'Hide details' });
  });
})();

/* ---------------------------------------------------------
   5. Dynamic skills list
   --------------------------------------------------------- */
(function dynamicSkills() {
  const form = document.getElementById('add-skill-form');
  const input = document.getElementById('new-skill-input');
  const list = document.getElementById('custom-skills-list');
  const emptyNotice = document.getElementById('custom-skills-empty');
  const feedback = document.getElementById('skill-feedback');
  if (!form || !input || !list || !feedback) return;

  // Skills already on the page, so we don't add an obvious duplicate.
  function getExistingSkills() {
    return Array.from(document.querySelectorAll('.tags li'))
      .map((li) => li.textContent.trim().toLowerCase())
      .filter(Boolean);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!value) {
      feedback.textContent = 'Type a skill before adding it.';
      feedback.className = 'form-feedback is-error';
      input.focus();
      return;
    }

    if (getExistingSkills().includes(value.toLowerCase())) {
      feedback.textContent = `"${value}" is already on the list.`;
      feedback.className = 'form-feedback is-error';
      input.select();
      return;
    }

    // Hide the "No custom skills added yet" placeholder the first time.
    if (emptyNotice) emptyNotice.hidden = true;

    const li = document.createElement('li');
    li.textContent = value;
    li.classList.add('tag--new');
    list.appendChild(li);

    feedback.textContent = `"${value}" was added to your skills.`;
    feedback.className = 'form-feedback is-success';

    form.reset();
    input.focus();
  });
})();

/* ---------------------------------------------------------
   6. Contact form with validation
   --------------------------------------------------------- */
(function contactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput = document.getElementById('cf-name');
  const emailInput = document.getElementById('cf-email');
  const messageInput = document.getElementById('cf-message');
  const status = document.getElementById('contact-form-status');

  // A practical (not exhaustive) email pattern: something@something.something
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fields = [
    {
      input: nameInput,
      errorEl: document.getElementById('cf-name-error'),
      validate: (value) => (value.trim() ? '' : 'Please enter your name.'),
    },
    {
      input: emailInput,
      errorEl: document.getElementById('cf-email-error'),
      validate: (value) => {
        if (!value.trim()) return 'Please enter your email address.';
        if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address, like name@example.com.';
        return '';
      },
    },
    {
      input: messageInput,
      errorEl: document.getElementById('cf-message-error'),
      validate: (value) => (value.trim() ? '' : 'Please write a short message.'),
    },
  ];

  function showFieldError(field, message) {
    const wrapper = field.input.closest('.form-field');
    field.errorEl.textContent = message;
    wrapper.classList.toggle('is-invalid', Boolean(message));
  }

  // Validate a single field as the visitor leaves it, so errors
  // are caught early rather than only on submit.
  fields.forEach((field) => {
    field.input.addEventListener('blur', () => {
      showFieldError(field, field.validate(field.input.value));
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let firstInvalid = null;
    let isValid = true;

    fields.forEach((field) => {
      const message = field.validate(field.input.value);
      showFieldError(field, message);
      if (message) {
        isValid = false;
        if (!firstInvalid) firstInvalid = field.input;
      }
    });

    if (!isValid) {
      status.textContent = 'Please fix the highlighted fields.';
      status.className = 'form-status is-error';
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // This page is hosted as static files with no backend, so the
    // message can't be sent from JavaScript alone. Instead, once the
    // details pass validation, open the visitor's own email app with
    // the message pre-filled so they can review and send it.
    const subject = `Portfolio message from ${nameInput.value.trim()}`;
    const body = `${messageInput.value.trim()}\n\n— ${nameInput.value.trim()} (${emailInput.value.trim()})`;
    const mailtoUrl =
      'mailto:bashar_elazony@aucegypt.edu' +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    status.textContent = 'Thanks! Opening your email app so you can send the message.';
    status.className = 'form-status is-success';
    window.location.href = mailtoUrl;

    form.reset();
    fields.forEach((field) => showFieldError(field, ''));
  });
})();
