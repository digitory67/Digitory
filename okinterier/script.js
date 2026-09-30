document.documentElement.classList.add('js');

const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const body = document.body;
const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress span');
const hero = document.querySelector('.hero');

const finishLoading = () => body.classList.add('loaded');
if (document.readyState === 'complete') {
  setTimeout(finishLoading, prefersReducedMotion ? 0 : 650);
} else {
  addEventListener('load', () => setTimeout(finishLoading, prefersReducedMotion ? 0 : 650), { once: true });
}

let scrollTicking = false;
const updateScrollEffects = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  header?.classList.toggle('is-scrolled', y > 34);
  if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (hero && !prefersReducedMotion && y < innerHeight * 1.2) {
    hero.style.setProperty('--hero-shift', `${Math.min(y * 0.13, 110)}px`);
  }
  scrollTicking = false;
};
addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollEffects);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollEffects();

const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const setMenu = (open) => {
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  mobileMenu?.setAttribute('aria-hidden', String(!open));
  mobileMenu?.classList.toggle('is-open', open);
  body.classList.toggle('menu-open', open);
};
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', event => {
  if (event.key === 'Escape') setMenu(false);
});

const revealItems = document.querySelectorAll('.reveal, .reveal-image');
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -45px' });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min((index % 4) * 55, 165)}ms`;
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

const counter = document.querySelector('[data-counter]');
if (counter) {
  const runCounter = () => {
    const goal = Number(counter.dataset.counter || 0);
    if (prefersReducedMotion) {
      counter.textContent = String(goal);
      return;
    }
    const start = performance.now();
    const draw = now => {
      const progressValue = Math.min((now - start) / 1200, 1);
      counter.textContent = String(Math.round(goal * (1 - Math.pow(1 - progressValue, 3))));
      if (progressValue < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  };
  const counterObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      runCounter();
      counterObserver.disconnect();
    }
  }, { threshold: .5 });
  counterObserver.observe(counter);
}

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const projectCards = [...document.querySelectorAll('.project-card')];
filterButtons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filterButtons.forEach(item => item.classList.toggle('is-active', item === button));
  projectCards.forEach((card, index) => {
    const show = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !show);
    if (show && !prefersReducedMotion) {
      card.animate([
        { opacity: 0, transform: 'translateY(18px) scale(.98)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 380, delay: index * 45, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
  });
}));

const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('figcaption');
let activeProject = 0;
const showProject = index => {
  activeProject = (index + projectCards.length) % projectCards.length;
  const card = projectCards[activeProject];
  if (lightboxImage) {
    lightboxImage.src = card.dataset.image || '';
    lightboxImage.alt = card.querySelector('img')?.alt || '';
  }
  if (lightboxCaption) lightboxCaption.textContent = card.dataset.title || '';
};
projectCards.forEach((card, index) => card.addEventListener('click', () => {
  activeProject = index;
  showProject(index);
  if (typeof lightbox?.showModal === 'function') {
    lightbox.showModal();
    body.classList.add('lightbox-open');
  }
}));
lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
lightbox?.querySelector('.lightbox-prev')?.addEventListener('click', () => showProject(activeProject - 1));
lightbox?.querySelector('.lightbox-next')?.addEventListener('click', () => showProject(activeProject + 1));
lightbox?.addEventListener('close', () => body.classList.remove('lightbox-open'));
lightbox?.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});
lightbox?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') showProject(activeProject - 1);
  if (event.key === 'ArrowRight') showProject(activeProject + 1);
});
let touchStartX = 0;
lightbox?.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
lightbox?.addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 55) showProject(activeProject + (distance < 0 ? 1 : -1));
}, { passive: true });

const form = document.querySelector('#contact-form');
form?.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('input', () => field.closest('.field')?.classList.remove('is-invalid'));
});
form?.addEventListener('submit', event => {
  event.preventDefault();
  const fields = [...form.querySelectorAll('[required]')];
  let firstInvalid = null;
  fields.forEach(field => {
    const valid = field.checkValidity() && field.value.trim().length > 0;
    field.closest('.field')?.classList.toggle('is-invalid', !valid);
    if (!valid && !firstInvalid) firstInvalid = field;
  });
  const status = form.querySelector('.form-status');
  if (firstInvalid) {
    if (status) status.textContent = 'Prosíme, doplňte všechna pole ve správném formátu.';
    firstInvalid.focus();
    return;
  }
  const data = new FormData(form);
  const name = data.get('name');
  const phone = data.get('phone');
  const email = data.get('email');
  const message = data.get('message');
  const subject = encodeURIComponent(`Poptávka z webu – ${name}`);
  const mailBody = encodeURIComponent(`Jméno: ${name}\nTelefon: ${phone}\nE-mail: ${email}\n\nPoptávka:\n${message}`);
  if (status) status.textContent = 'Otevíráme váš e-mail s připravenou poptávkou…';
  window.location.href = `mailto:pklan@seznam.cz?subject=${subject}&body=${mailBody}`;
});

const finePointer = matchMedia('(pointer: fine)').matches;
const cursor = document.querySelector('.cursor-dot');
if (finePointer && cursor) {
  addEventListener('pointermove', event => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.classList.add('is-visible');
  }, { passive: true });
  document.querySelectorAll('a, button, input, textarea').forEach(item => {
    item.addEventListener('pointerenter', () => cursor.classList.add('is-hovering'));
    item.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
  });
}

if (finePointer && !prefersReducedMotion) {
  document.querySelectorAll('.magnetic').forEach(item => {
    item.addEventListener('pointermove', event => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * .08}px, ${y * .14}px)`;
    });
    item.addEventListener('pointerleave', () => { item.style.transform = ''; });
  });
}
