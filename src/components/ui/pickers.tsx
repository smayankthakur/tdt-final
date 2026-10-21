'use client';

/**
 * Themed date, time and select pickers.
 *
 * The browser's own date/time/select popups can't be styled (Chrome shows a
 * grey-and-blue calendar, Windows a white list), so these replace them with
 * dark + gold popovers that match the site. Values use the same formats as the
 * native inputs: date "YYYY-MM-DD", time "HH:MM" (24 h), select = option value.
 *
 * Keyboard: Enter/Space/ArrowDown opens, Escape closes and returns focus,
 * arrow keys move inside the calendar, time columns and option list.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------- shared ---

const POPOVER =
  'absolute left-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-[#D4AF37]/35 bg-[#0E1220] p-3 text-white ' +
  'shadow-[0_18px_50px_rgba(0,0,0,0.65),0_0_0_1px_rgba(212,175,55,0.06)] animate-[pickerIn_.14s_ease-out]';
const CELL =
  'flex items-center justify-center rounded-lg text-sm transition-colors focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70';
const ON = 'bg-gradient-to-br from-[#FFD700] to-[#D4AF37] text-black font-semibold shadow-[0_0_12px_rgba(212,175,55,0.45)]';
const OFF = 'text-white/85 hover:bg-white/10';

function usePopover() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };
  // Keep the popover on screen: if it would run off the right edge (e.g. a
  // field in the right-hand column), align it to the field's right side.
  const fitRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.right > window.innerWidth - 8) {
      el.style.left = 'auto';
      el.style.right = '0';
    }
  }, []);
  return { open, setOpen, close, wrapRef, triggerRef, onTriggerKey, fitRef };
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={cn('h-4 w-4 shrink-0 text-[#D4AF37]/80 transition-transform', open && 'rotate-180')}>
    <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface TriggerProps {
  id?: string;
  className?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  placeholder?: string;
  disabled?: boolean;
}

function Trigger({
  pop, text, placeholder, popupId, className, id, ariaLabel, ariaLabelledBy, disabled, kind,
}: TriggerProps & { pop: ReturnType<typeof usePopover>; text: string; popupId: string; kind: 'dialog' | 'listbox' }) {
  return (
    <button
      ref={pop.triggerRef}
      id={id}
      type="button"
      disabled={disabled}
      aria-haspopup={kind}
      aria-expanded={pop.open}
      aria-controls={pop.open ? popupId : undefined}
      aria-label={ariaLabel ? `${ariaLabel}${text ? `: ${text}` : ''}` : undefined}
      aria-labelledby={ariaLabel ? undefined : ariaLabelledBy}
      onClick={() => pop.setOpen(!pop.open)}
      onKeyDown={pop.onTriggerKey}
      className={cn(className, 'flex items-center justify-between gap-2 text-left cursor-pointer disabled:opacity-50')}
    >
      <span className={cn('truncate', !text && 'text-white/55')}>{text || placeholder}</span>
      <Chevron open={pop.open} />
    </button>
  );
}

// ------------------------------------------------------------------ date ---

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON3 = MONTHS.map((m) => m.slice(0, 3));
const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseIso = (v?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};
const todayIso = () => {
  const t = new Date();
  return iso(t.getFullYear(), t.getMonth(), t.getDate());
};
export const formatDate = (v?: string) => {
  const p = parseIso(v);
  return p ? `${p.d} ${MON3[p.m]} ${p.y}` : '';
};

export interface DatePickerProps extends TriggerProps {
  value: string;
  onChange: (value: string) => void;
  /** Earliest / latest selectable day, "YYYY-MM-DD". */
  min?: string;
  max?: string;
  /** Month shown when nothing is selected yet (e.g. 1995 for dates of birth). */
  defaultView?: { year: number; month?: number };
  /** Years offered in the year grid (newest first). */
  yearRange?: [number, number];
}

export function DatePicker({
  value, onChange, min, max, defaultView, yearRange, placeholder = 'Select date', ...trigger
}: DatePickerProps) {
  const pop = usePopover();
  const popupId = useId();
  const sel = parseIso(value);
  const start = sel ?? (defaultView ? { y: defaultView.year, m: defaultView.month ?? 0, d: 1 } : parseIso(todayIso())!);
  const [view, setView] = useState({ y: start.y, m: start.m });
  const [mode, setMode] = useState<'days' | 'years'>('days');
  const [focusDay, setFocusDay] = useState(sel?.d ?? 1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Re-open on the selected month.
  useEffect(() => {
    if (!pop.open) return;
    const s = parseIso(value) ?? start;
    setView({ y: s.y, m: s.m });
    setFocusDay(parseIso(value)?.d ?? 1);
    setMode('days');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop.open]);

  const daysIn = new Date(view.y, view.m + 1, 0).getDate();
  const lead = new Date(view.y, view.m, 1).getDay();
  const allowed = (d: number) => {
    const v = iso(view.y, view.m, d);
    return (!min || v >= min) && (!max || v <= max);
  };

  // Keep keyboard focus on the focused day while navigating.
  useLayoutEffect(() => {
    if (!pop.open || mode !== 'days') return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [pop.open, mode, focusDay, view]);

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const t = v.y * 12 + v.m + delta;
      return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });
  };
  const moveFocus = (delta: number) => {
    const next = focusDay + delta;
    if (next < 1) {
      const prevLen = new Date(view.y, view.m, 0).getDate();
      shiftMonth(-1);
      setFocusDay(prevLen + next);
    } else if (next > daysIn) {
      shiftMonth(1);
      setFocusDay(next - daysIn);
    } else setFocusDay(next);
  };
  const onGridKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in map) {
      e.preventDefault();
      moveFocus(map[e.key]);
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      shiftMonth(e.key === 'PageUp' ? -1 : 1);
    }
  };
  const pick = (d: number) => {
    if (!allowed(d)) return;
    onChange(iso(view.y, view.m, d));
    pop.close(true);
  };

  const nowY = new Date().getFullYear();
  const [yFrom, yTo] = yearRange ?? [nowY - 100, nowY + 5];
  const years = useMemo(() => Array.from({ length: yTo - yFrom + 1 }, (_, i) => yTo - i), [yFrom, yTo]);
  const yearsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode === 'years') yearsRef.current?.querySelector<HTMLButtonElement>('[data-on="true"]')?.scrollIntoView({ block: 'center' });
  }, [mode]);

  const todayV = todayIso();

  return (
    <div ref={pop.wrapRef} className="relative w-full min-w-0">
      <Trigger pop={pop} text={formatDate(value)} placeholder={placeholder} popupId={popupId} kind="dialog" {...trigger} />
      {pop.open && (
        <div id={popupId} ref={pop.fitRef} role="dialog" aria-label="Choose date" className={cn(POPOVER, 'w-[min(19.5rem,calc(100vw-2.5rem))]')}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setMode(mode === 'days' ? 'years' : 'days')} aria-label="Choose month and year"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-heading text-[15px] text-[#FFD700] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70">
              {MONTHS[view.m]} {view.y}
              <Chevron open={mode === 'years'} />
            </button>
            {mode === 'days' && (
              <div className="flex gap-1">
                <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className={cn(CELL, OFF, 'h-8 w-8 text-lg')}>‹</button>
                <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className={cn(CELL, OFF, 'h-8 w-8 text-lg')}>›</button>
              </div>
            )}
          </div>

          {mode === 'years' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1">
                {MON3.map((m, i) => (
                  <button type="button" key={m} onClick={() => { setView({ ...view, m: i }); setMode('days'); }}
                    className={cn(CELL, 'h-9', i === view.m ? ON : OFF)}>{m}</button>
                ))}
              </div>
              <div ref={yearsRef} className="grid max-h-44 grid-cols-4 gap-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:#D4AF37_transparent] [scrollbar-width:thin]">
                {years.map((y) => (
                  <button type="button" key={y} data-on={y === view.y} onClick={() => setView({ ...view, y })}
                    className={cn(CELL, 'h-9', y === view.y ? ON : OFF)}>{y}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 pb-1">
                {WEEK.map((w) => <span key={w} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/70">{w}</span>)}
              </div>
              <div ref={gridRef} role="group" aria-label={`${MONTHS[view.m]} ${view.y}`} onKeyDown={onGridKey} className="grid grid-cols-7 gap-1">
                {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
                {Array.from({ length: daysIn }, (_, i) => i + 1).map((d) => {
                  const v = iso(view.y, view.m, d);
                  const isSel = v === value;
                  const ok = allowed(d);
                  return (
                    <button type="button" key={d} data-day={d} disabled={!ok} tabIndex={d === focusDay ? 0 : -1}
                      aria-pressed={isSel} aria-label={`${d} ${MONTHS[view.m]} ${view.y}`}
                      onClick={() => pick(d)} onFocus={() => setFocusDay(d)}
                      className={cn(CELL, 'h-9', isSel ? ON : OFF, !isSel && v === todayV && 'ring-1 ring-inset ring-[#D4AF37]/60',
                        !ok && 'cursor-not-allowed opacity-25 hover:bg-transparent')}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-sm">
            <button type="button" onClick={() => { onChange(''); pop.close(true); }} className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/5 hover:text-white">Clear</button>
            {(!max || todayV <= max) && (!min || todayV >= min) ? (
              <button type="button" onClick={() => { onChange(todayV); pop.close(true); }} className="rounded-lg px-2 py-1 text-[#FFD700] hover:bg-white/5">Today</button>
            ) : <span />}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ time ---

export const formatTime = (v?: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(v || '');
  if (!m) return '';
  const h = +m[1];
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function TimeCol({ listRef, label, items, on, render, pick, onDone }: {
  listRef: (el: HTMLDivElement | null) => void; label: string; items: number[]; on: number;
  render: (v: number) => ReactNode; pick: (v: number) => void; onDone: () => void;
}) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const box = e.currentTarget;
    const i = items.indexOf(on);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      pick(items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]);
      requestAnimationFrame(() => {
        const el = box.querySelector<HTMLElement>('[data-on="true"]');
        el?.focus();
        el?.scrollIntoView({ block: 'nearest' });
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onDone();
    }
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/70">{label}</span>
      <div ref={listRef} role="listbox" aria-label={label} onKeyDown={onKey}
        className="flex max-h-48 flex-col gap-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:#D4AF37_transparent] [scrollbar-width:thin]">
        {items.map((v) => (
          <button type="button" role="option" aria-selected={v === on} key={v} data-on={v === on} tabIndex={v === on ? 0 : -1}
            onClick={() => pick(v)} className={cn(CELL, 'h-9 shrink-0', v === on ? ON : OFF)}>
            {render(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface TimePickerProps extends TriggerProps {
  value: string;
  onChange: (value: string) => void;
  /** Minute step in the list (1 for birth times, 15/30 for schedules). */
  minuteStep?: number;
}

export function TimePicker({ value, onChange, minuteStep = 1, placeholder = 'Select time', ...trigger }: TimePickerProps) {
  const pop = usePopover();
  const popupId = useId();
  const m = /^(\d{2}):(\d{2})$/.exec(value || '');
  const h24 = m ? +m[1] : 12;
  const min = m ? +m[2] : 0;
  const h12 = ((h24 + 11) % 12) + 1;
  const pm = h24 >= 12;
  const set = (hh12: number, mm: number, isPm: boolean) => onChange(`${pad((hh12 % 12) + (isPm ? 12 : 0))}:${pad(mm)}`);

  const minutes = useMemo(() => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep), [minuteStep]);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  useLayoutEffect(() => {
    if (!pop.open) return;
    colRefs.current.forEach((c) => c?.querySelector<HTMLElement>('[data-on="true"]')?.scrollIntoView({ block: 'center' }));
    colRefs.current[0]?.querySelector<HTMLElement>('[data-on="true"]')?.focus();
  }, [pop.open]);

  return (
    <div ref={pop.wrapRef} className="relative w-full min-w-0">
      <Trigger pop={pop} text={formatTime(value)} placeholder={placeholder} popupId={popupId} kind="dialog" {...trigger} />
      {pop.open && (
        <div id={popupId} ref={pop.fitRef} role="dialog" aria-label="Choose time" className={cn(POPOVER, 'w-[min(17rem,calc(100vw-2.5rem))]')}>
          <div className="mb-2 text-center font-heading text-[15px] text-[#FFD700]">{formatTime(value) || '12:00 PM'}</div>
          <div className="flex gap-2">
            <TimeCol listRef={(el) => { colRefs.current[0] = el; }} label="Hour" items={HOURS} on={h12} render={String} pick={(v) => set(v, min, pm)} onDone={() => pop.close(true)} />
            <TimeCol listRef={(el) => { colRefs.current[1] = el; }} label="Min" items={minutes} on={minutes.includes(min) ? min : minutes[0]} render={pad} pick={(v) => set(h12, v, pm)} onDone={() => pop.close(true)} />
            <TimeCol listRef={(el) => { colRefs.current[2] = el; }} label="AM/PM" items={[0, 1]} on={pm ? 1 : 0} render={(v) => (v ? 'PM' : 'AM')} pick={(v) => set(h12, min, v === 1)} onDone={() => pop.close(true)} />
          </div>
          <div className="mt-2 flex justify-end border-t border-white/10 pt-2">
            <button type="button" onClick={() => { if (!value) set(h12, min, pm); pop.close(true); }}
              className="rounded-lg bg-gradient-to-r from-[#FFD700] to-[#D4AF37] px-4 py-1.5 text-sm font-semibold text-black">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- select ---

export interface SelectOption { value: string; label: string }

export interface SelectProps extends TriggerProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Hidden input for forms that read FormData. */
  name?: string;
  /** Accessible name of the option list (e.g. the field's label). */
  listLabel?: string;
}

export function Select({ value, onChange, options, name, listLabel, placeholder = 'Select…', ...trigger }: SelectProps) {
  const pop = usePopover();
  const popupId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const current = options.find((o) => o.value === value);

  // Layout effect: focus moves to the list before the next key press is handled.
  useLayoutEffect(() => {
    if (!pop.open) return;
    const i = Math.max(0, options.findIndex((o) => o.value === value));
    setActive(i);
    listRef.current?.focus();
    listRef.current?.children[i]?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop.open]);

  const choose = (i: number) => {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    pop.close(true);
  };
  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(options.length - 1, Math.max(0, active + (e.key === 'ArrowDown' ? 1 : -1)));
      setActive(n);
      listRef.current?.children[n]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Tab') {
      pop.close();
    } else if (e.key.length === 1) {
      const k = e.key.toLowerCase();
      const n = options.findIndex((o, i) => i > active && o.label.toLowerCase().startsWith(k));
      const f = n >= 0 ? n : options.findIndex((o) => o.label.toLowerCase().startsWith(k));
      if (f >= 0) {
        setActive(f);
        listRef.current?.children[f]?.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div ref={pop.wrapRef} className="relative w-full min-w-0">
      {name && <input type="hidden" name={name} value={value} />}
      <Trigger pop={pop} text={current?.label ?? ''} placeholder={placeholder} popupId={popupId} kind="listbox" {...trigger} />
      {pop.open && (
        <ul id={popupId} ref={(el) => { listRef.current = el; pop.fitRef(el); }} role="listbox" aria-label={listLabel || trigger.ariaLabel || placeholder} tabIndex={0} onKeyDown={onListKey}
          aria-activedescendant={`${popupId}-${active}`}
          className={cn(POPOVER, 'right-0 max-h-64 overflow-y-auto overscroll-contain p-1.5 focus:outline-none [scrollbar-color:#D4AF37_transparent] [scrollbar-width:thin]')}>
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li key={o.value} id={`${popupId}-${i}`} role="option" aria-selected={isSel}
                onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
                className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px]',
                  isSel ? 'text-[#FFD700] font-medium' : 'text-white/85', i === active && 'bg-white/[0.07]')}>
                <span className="truncate">{o.label}</span>
                {isSel && (
                  <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0 text-[#FFD700]">
                    <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
