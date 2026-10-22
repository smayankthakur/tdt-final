'use client';

import { useEffect } from 'react';
import { LEARN_COURSES } from './learnHtml';

/**
 * The old learn page's script, scoped to its wrapper: mobile menu, twinkling
 * stars, scroll reveal, course-detail modal and the footer newsletter form
 * (which now really subscribes, through /api/subscribe).
 */
export default function LearnScripts({ openSlugOnLoad }: { openSlugOnLoad?: boolean }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.learn-site');
    if (!root) return;
    const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    const offs: Array<() => void> = [];
    const on = (el: EventTarget | null, ev: string, fn: EventListener) => {
      if (!el) return;
      el.addEventListener(ev, fn);
      offs.push(() => el.removeEventListener(ev, fn));
    };

    // menu
    const btn = $('#menuBtn');
    const mob = $('#mobileNav');
    on(btn, 'click', () => mob?.classList.toggle('open'));
    mob?.querySelectorAll('a').forEach((a) => on(a, 'click', () => mob.classList.remove('open')));
    const yr = $('#yr');
    if (yr) yr.textContent = String(new Date().getFullYear());

    // stars
    const box = $('#stars');
    if (box && !box.childElementCount) {
      const n = window.innerWidth < 680 ? 26 : 48;
      let html = '';
      for (let i = 0; i < n; i++) {
        const x = Math.random() * 100, y = Math.random() * 100;
        const d = (2 + Math.random() * 4).toFixed(2), delay = (Math.random() * 4).toFixed(2);
        const s = (2 + Math.random() * 2).toFixed(1);
        html += `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-duration:${d}s;animation-delay:${delay}s"></i>`;
      }
      box.innerHTML = html;
    }

    // reveal
    const items = root.querySelectorAll<HTMLElement>('.reveal');
    let io: IntersectionObserver | null = null;
    if (!('IntersectionObserver' in window)) items.forEach((el) => el.classList.add('in'));
    else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            if (el.closest('.grid') && el.parentElement) {
              const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
              el.style.animationDelay = sibs.indexOf(el) * 0.12 + 's';
            }
            el.classList.add('in');
            io?.unobserve(el);
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
      );
      items.forEach((el) => io!.observe(el));
    }
    const revealAll = window.setTimeout(() => root.querySelectorAll('.reveal:not(.in)').forEach((el) => el.classList.add('in')), 1600);

    // course modal
    const overlay = $('#courseModal');
    const dialog = $('#cmDialog');
    let lastFocus: HTMLElement | null = null;
    const lock = (yes: boolean) => {
      document.body.style.overflow = yes ? 'hidden' : '';
    };
    const fill = (el: Element | null, arr: string[]) => {
      if (el) el.replaceChildren(...arr.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
    };
    const openCourse = (key: string | null) => {
      const c = key ? LEARN_COURSES[key] : undefined;
      if (!c || !overlay || !dialog) return;
      dialog.style.setProperty('--accent', c.accent);
      $('#cmBadge')!.textContent = c.badge;
      $('#cmTitle')!.textContent = c.title;
      $('#cmPrice')!.textContent = c.price;
      const img = $<HTMLImageElement>('#cmImg')!;
      img.src = c.img;
      img.alt = c.title;
      fill($('#cmLearn'), c.learn);
      fill($('#cmNeed'), c.need);
      const pay = $<HTMLAnchorElement>('#cmPay')!;
      pay.href = c.pay;
      pay.textContent = 'Enrol Now ✨';
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      lock(true);
      dialog.scrollTop = 0;
      lastFocus = document.activeElement as HTMLElement | null;
      $('#modalClose')?.focus();
      window.history.replaceState(null, '', `/courses/${c.slug}`);
    };
    const closeCourse = () => {
      if (!overlay) return;
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      lock(false);
      lastFocus?.focus?.();
      if (window.location.pathname !== '/courses') window.history.replaceState(null, '', '/courses');
    };
    root.querySelectorAll('.btn-details').forEach((b) =>
      on(b, 'click', () => openCourse((b.closest('.card') as HTMLElement | null)?.dataset.key ?? null))
    );
    on($('#modalClose'), 'click', closeCourse);
    on($('#cmCancel'), 'click', closeCourse);
    on(overlay, 'click', (e) => {
      if (e.target === overlay) closeCourse();
    });
    on(document, 'keydown', (e) => {
      const ke = e as KeyboardEvent;
      if (!overlay?.classList.contains('open')) return;
      if (ke.key === 'Escape') closeCourse();
      // keep Tab inside the open pop-up
      if (ke.key === 'Tab' && dialog) {
        const f = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (ke.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          ke.preventDefault();
          last.focus();
        } else if (!ke.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          ke.preventDefault();
          first.focus();
        }
      }
    });
    if (openSlugOnLoad && overlay?.classList.contains('open')) {
      lock(true);
      $('#modalClose')?.focus();
    }

    // newsletter (the old page only showed a thank-you; now it subscribes)
    const form = $<HTMLFormElement>('form.news');
    on(form, 'submit', async (e) => {
      e.preventDefault();
      const input = form!.querySelector('input');
      const email = (input?.value || '').trim();
      const button = form!.querySelector('button');
      if (button) button.disabled = true;
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong. Please try again.');
        form!.reset();
        window.alert('Thank you for subscribing to The Divine Tarot ✨');
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        if (button) button.disabled = false;
      }
    });

    return () => {
      offs.forEach((f) => f());
      io?.disconnect();
      window.clearTimeout(revealAll);
      lock(false);
    };
  }, [openSlugOnLoad]);

  return null;
}
