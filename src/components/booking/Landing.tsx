"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import BookingWidget from "@/components/booking/BookingWidget";
import StickyBook from "@/components/booking/StickyBook";
import PayButton from "@/components/booking/PayButton";
import ResumeBanner from "@/components/booking/ResumeBanner";
import { OFFER, REGULAR_PRICE, URGENT_PRICE, inr } from "@/lib/booking/offer";


/** Fades an element up into view the first time it scrolls into the viewport. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Landing({ offer }: { offer: boolean }) {
  const price = inr(offer ? OFFER.price : REGULAR_PRICE), regular = inr(REGULAR_PRICE), urgent = inr(URGENT_PRICE);
  return (
    <>
      <ResumeBanner />

      {/* NAV — the old booking site's own header */}
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="brand">
            <img src="/logo.png" alt="The Divine Tarot" className="mark" />
            <span>
              The Divine Tarot
              <small>Premium Tarot Guidance</small>
            </span>
          </Link>

          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/reading">Reading</Link>
            <Link href="/courses">Course</Link>
            <Link href="/kundli-milan">Kundli Milan</Link>
            <Link href="/personal-reading" className="active">Personal Reading</Link>
          </div>

          <div className="nav-right">
            <Link href="/reading" className="nav-cta">
              <span className="nav-cta-long">Ask your question here</span>
              <span className="nav-cta-short">Ask now</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — 50/50 image + text, matching thedivinetarotonline.com's split layout */}
      <section className="hero-split">
        <div className="container hero-split-inner">
          <div className="hero-media">
            <div className="hero-media-glow"></div>
            <img
              src="/hero-bharti.jpg"
              alt="Bharti Singh — The Divine Tarot"
              className="hero-media-img"
            />
            {offer && (
              <a href="#book" className="diwali-flash" aria-label={`${OFFER.name}: personal reading at just ${price}, valid till ${OFFER.untilText}`}>
                <b>🪔 {OFFER.name} 🪔</b>
                <span>Get your Personal Reading <strong>@ Just Rs. {OFFER.price}/- Rs Only</strong></span>
                <small>Offer valid till {OFFER.untilText}</small>
              </a>
            )}
            <div className="hero-media-frame"></div>
          </div>

          <div className="hero-copy">
            <div className="eyebrow">The Divine Tarot</div>
            <p className="namaste">Namaste, main hu Bharti Singh</p>
            <h1>India&rsquo;s No.1 Psychic Tarot Reader</h1>
            <p className="sub">
              Expert in Tarot, Astro, Numero, Hoodoo, Runes, Dice, Coffee Cup,
              Psychic Ability, Face Analysis, Candle Wax Reading, Kundli Analysis,
              Kundli Milan &amp; a Manifestation Coach.
            </p>
            <div className="hero-price">
              <div className="hp-amount">
                {offer && <s className="old-price">{regular}</s>}
                <strong>{offer ? OFFER.price : REGULAR_PRICE} <small className="rs-only">Rs only</small></strong>
              </div>
              <ul className="hp-lines">
                {offer && <li className="offer-tag">🪔 {OFFER.name}</li>}
                {offer && <li>Offer Till {OFFER.untilText}</li>}
                <li>40 mins Voice Reading</li>
                <li>Appointment Within 7 - 10 Days</li>
              </ul>
            </div>
            <div className="hero-actions">
              <PayButton label={`Book Now — ${price}`} />
              <PayButton tier="urgent" className="btn ghost" label={`For Urgent Reading (within 48 Hours) = ${URGENT_PRICE}/- Rs only`} />
            </div>
            <div className="hero-stats">
              <div>
                <strong>7L+</strong>
                <span>Seekers Guided</span>
              </div>
              <div>
                <strong>40 Min</strong>
                <span>Voice Call Reading</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Confidential</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOOK + NOTES — inline side by side */}
      <section id="book">
        <div className="container">
          <Reveal>
            <div className="kicker">Book Now</div>
            <h2>Voice Call Reading</h2>
          </Reveal>

          <div className="tier-grid">
            <Reveal delay={80}>
              <div className={`price-card${offer ? " offer" : ""}`}>
                {offer && <div className="offer-ribbon">🪔 {OFFER.name} · Valid till {OFFER.untilText}</div>}
                <span className="badge">40 Minutes · Voice Call</span>
                <h3>Call Reading</h3>
                <div className="amount">
                  {offer && <s className="old-price">{regular}</s>}{price}<small>Tarot, Astro, Numero, Face Reading, Kundli Analysis &amp; Psychic</small>
                </div>

                <ul className="feature-list">
                  <li>Appointment payment ke 7–10 din ke andar (Slots between 12 PM – 9 PM IST)</li>
                  <li>Ask unlimited questions, up to 3 people including you</li>
                  <li>Payment ke baad form bharein — slot, Google Meet link aur schedule turant aapki email par aa jayega</li>
                  <li>No Refund Policy · No reschedule after slot time · 5-min wait only</li>
                </ul>

                <BookingWidget price={price} />
              </div>
            </Reveal>

            <Reveal delay={130}>
              <div className="price-card urgent">
                <span className="badge">⚡ Urgent · Within 48 Hours</span>
                <h3>Urgent Call Reading</h3>
                <div className="amount">
                  {urgent}<small>Same 40 min reading — Tarot, Astro, Numero, Face Reading, Kundli Analysis &amp; Psychic</small>
                </div>

                <ul className="feature-list">
                  <li>Appointment payment ke 48 ghante ke andar</li>
                  <li>Ask unlimited questions, up to 3 people including you</li>
                  <li>Payment ke baad form bharein — slot, Google Meet link aur schedule turant aapki email par aa jayega</li>
                  <li>No Refund Policy · No reschedule after slot time · 5-min wait only</li>
                </ul>

                <BookingWidget price={urgent} tier="urgent" />
              </div>
            </Reveal>
          </div>

          <div className="book-notes-grid single">

            <Reveal delay={180}>
              <div className="notes-card">
                <div className="notes-card-heading">Please Read Before Booking</div>
                <div className="notes">
                  <p>
                    We do not offer Tantra, Vashikaran, or free readings under any
                    circumstance. We don&rsquo;t cover legal matters, share market,
                    lottery, child&rsquo;s gender, or sexual questions.
                  </p>
                  <p>
                    <strong>No Refund Policy</strong> — payments are non-refundable.
                    Your details are kept strictly confidential, and this is a
                    judgment-free space.
                  </p>
                </div>

                <details className="tc">
                  <summary>Full Terms &amp; Conditions</summary>
                  <div className="tc-body">
                    <p>
                      We are certified and experienced in Astrology, Numerology,
                      Psychic Tarot Card Reading, Vedic Kundli Analysis, Candle Wax
                      Reading, Coffee Cup Reading, and other spiritual guidance
                      practices.
                    </p>
                    <p>We do not provide sugar-coated readings. Our purpose is to deliver honest messages as guided by the universe with complete sincerity.</p>
                    <p>We strictly DO NOT offer any services related to Tantra, Vashikaran, black magic, or any unethical practices. Please do not request such services.</p>
                    <p>We do not provide readings on: legal matters, court cases, share market, lottery, gambling, child gender prediction, or explicit/sexual questions.</p>
                    <p><strong>Appointment timing:</strong> slots run from 12 October to 30 November, every day from 12 PM to 9 PM IST (last slot 9 PM). A standard booking gets the earliest free slot 7–10 days after payment. No appointments are given on festival days (Dussehra, Karwa Chauth, Dhanteras to Bhai Dooj, Chhath Puja and Guru Nanak Jayanti). If you need the reading sooner, book the Urgent reading ({urgent}), which gets a slot within 48 hours of payment.</p>
                    {offer && <p><strong>{OFFER.name}:</strong> the {price} price applies to payments made till {OFFER.untilText} (IST). After that the regular price of {regular} applies. The Urgent reading is not part of the offer.</p>}
                    <p>Your call takes place on Google Meet at the slot assigned to you — the slot, link and schedule are emailed to you as soon as you submit the form after payment. Please join on time from a stable network; if repeated connection issues occur, the appointment may be cancelled.</p>
                    <p><strong>Late arrival:</strong> we wait a maximum of 5 minutes after your slot starts. If you have not joined the Google Meet by then, the appointment is treated as missed. Once your slot time is over, the appointment cannot be rescheduled, and no refund is given.</p>
                    <p>You may ask about up to 3 people in one reading, only those whose details you submit in the form.</p>
                    <p>All readings are for guidance purposes only. Please use your own judgment and decision-making.</p>
                    <p>When asking about another person&rsquo;s feelings, please understand that energies and emotions can change over time, as every individual has free will.</p>
                    <p>We do not offer FREE readings under any circumstances.</p>
                    <p><strong>No Refund Policy:</strong> once payment is made, it is non-refundable under any situation. Please make your payment only after reading all details carefully.</p>
                    <p>Your privacy is our priority. All information shared (name, photos, personal details) is kept strictly confidential.</p>
                    <p>This is a safe and judgment-free space. No matter your situation (including relationships, personal choices, or identity), you are respected and heard with compassion.</p>
                    <p>&ldquo;The Divine Tarot&rdquo; is a legally registered brand. Any unauthorized copying of content, name, or material may lead to legal action.</p>
                    <p>By paying on this page, you agree to share the information entered with The Divine Tarot (owner of this page) and Razorpay, in accordance with applicable laws.</p>
                  </div>
                </details>
              </div>
            </Reveal>
          </div>
        </div>
      </section>


      {/* FOOTER — the old booking site's own footer */}
      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <img src="/logo.png" alt="The Divine Tarot" className="mark" />
              <span>
                The Divine Tarot
                <small>Premium Tarot Guidance</small>
              </span>
            </Link>
            <p className="footer-tagline">Clarity for your path. Guidance for your soul.</p>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Quick Links</div>
            <ul className="footer-links">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/reading">Readings</Link></li>
              <li><Link href="/premium">Premium</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Connect With Us</div>
            <div className="social-row">
              <a href="https://instagram.com/thedivineetarot" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a>
              <a href="https://facebook.com/profile.php?id=61578567343068" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
              <a href="https://youtube.com/@TheDivineTarot" target="_blank" rel="noreferrer" aria-label="YouTube">▶</a>
              <a href="https://youtube.com/@thedivineetarot" target="_blank" rel="noreferrer" aria-label="YouTube (2nd Channel)">▶</a>
            </div>
            <Link href="/privacy" className="footer-privacy-link">Privacy</Link>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Get Daily Divine Insights</div>
            <NewsletterForm />
          </div>
        </div>

        <div className="trust-row">
          <span>🔒 Secure &amp; Private Readings</span>
          <span>♡ Trusted by 7L+ Seekers</span>
          <span>✦ Authentic Spiritual Guidance</span>
        </div>

        <div className="footer-bottom">
          <span>Designed by <a href="https://sitelytc.com/" target="_blank" rel="noreferrer">Sitelytc</a></span>
          <span className="footer-bottom-right">
            <Link href="/privacy">Privacy</Link> · © {new Date().getFullYear()} The Divine Tarot. All rights reserved.
          </span>
        </div>
      </footer>

      <StickyBook price={price} />
    </>
  );
}

/** The old footer form looked the same but did nothing; this one subscribes (same API as the main site). */
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  return (
    <form
      className="newsletter-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setState("busy");
        try {
          const res = await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), whatsapp: phone.replace(/[^\d+]/g, "") || undefined }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || data.message || "Something went wrong. Please try again.");
          setEmail("");
          setPhone("");
          setState("done");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
          setState("idle");
        }
      }}
    >
      <input type="email" placeholder="Your email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="tel" placeholder="WhatsApp number (optional)" aria-label="WhatsApp number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button type="submit" className="btn gold" style={{ width: "100%", justifyContent: "center" }} disabled={state === "busy"}>
        {state === "done" ? "Subscribed ✓" : "Subscribe"}
      </button>
      {error && <p role="alert" style={{ color: "#fca5a5", fontSize: 13, marginTop: 6 }}>{error}</p>}
    </form>
  );
}
