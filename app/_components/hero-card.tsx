"use client"

/* ─────────────────────────────────────────────
 * Hero Tarot Card
 *
 * Front: Ornamental SVG card with three-part hero text
 *        that reveals sequentially. Static left-edge lift
 *        with gold glow hints the card is flippable.
 * Back:  Tagline, features, Enter CTA, copyright.
 * Flip:  Click anywhere on the card.
 * Hint:  "Turn over" text with bouncing arrow appears
 *        below the card after 5s — only if user hasn't
 *        flipped yet. Once flipped, hint never returns.
 *
 * Responsive: card fills ~75% of viewport height on
 *             desktop, smaller on mobile. Always 2:3
 *             aspect ratio.
 * ───────────────────────────────────────────── */

import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { ArrowRight01Icon, TaskAdd01Icon } from "hugeicons-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SVG_W = 320;
const SVG_H = 480;

export default function HeroCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [textRevealed, setTextRevealed] = useState(0);
  const hasEverFlippedRef = useRef(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sequential text reveal on mount
  useEffect(() => {
    const timers = [
      setTimeout(() => setTextRevealed(1), 600),
      setTimeout(() => setTextRevealed(2), 1400),
      setTimeout(() => setTextRevealed(3), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Show hint after 5s — but only if user has never flipped
  useEffect(() => {
    if (hasEverFlippedRef.current) return;
    hintTimerRef.current = setTimeout(() => {
      if (!hasEverFlippedRef.current) setShowHint(true);
    }, 5000);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [isFlipped]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
    // Once flipped, permanently kill the hint
    if (!hasEverFlippedRef.current) {
      hasEverFlippedRef.current = true;
      setShowHint(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Card container */}
      <div
        className="relative cursor-pointer select-none hero-card-size hero-card-container"
        onClick={handleFlip}
      >
        {/* Lift + glow wrapper — tilts on hover, flattens when flipped */}
        <div
          className={`w-full h-full hero-card-tilt ${isFlipped ? "hero-card-tilt--flat" : ""}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Flip inner container */}
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* ── FRONT FACE ── */}
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* Gold glow on left edge */}
              <div className="absolute inset-0 rounded-2xl hero-card-glow pointer-events-none" />

              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-full drop-shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Card body */}
                <rect
                  x={0} y={0}
                  width={SVG_W} height={SVG_H}
                  rx={16}
                  fill="var(--card)"
                  stroke="var(--gold)"
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                />

                {/* Outer frame */}
                <rect
                  x={10} y={10}
                  width={SVG_W - 20} height={SVG_H - 20}
                  rx={10}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth={0.5}
                  strokeOpacity={0.2}
                />

                {/* Inner fill */}
                <rect
                  x={16} y={16}
                  width={SVG_W - 32} height={SVG_H - 32}
                  rx={6}
                  fill="var(--gold)"
                  fillOpacity={0.05}
                  stroke="none"
                />

                {/* Cross lines */}
                <line x1={SVG_W / 2} y1={28} x2={SVG_W / 2} y2={SVG_H - 28} stroke="var(--gold)" strokeWidth={0.4} strokeOpacity={0.1} />
                <line x1={28} y1={SVG_H / 2} x2={SVG_W - 28} y2={SVG_H / 2} stroke="var(--gold)" strokeWidth={0.4} strokeOpacity={0.1} />

                {/* Diagonal fractures */}
                <line x1={28} y1={28} x2={SVG_W - 28} y2={SVG_H - 28} stroke="var(--gold)" strokeWidth={0.3} strokeOpacity={0.07} />
                <line x1={SVG_W - 28} y1={28} x2={28} y2={SVG_H - 28} stroke="var(--gold)" strokeWidth={0.3} strokeOpacity={0.07} />

                {/* Central diamond */}
                <polygon
                  points={`${SVG_W / 2},${SVG_H / 2 - 40} ${SVG_W / 2 + 28},${SVG_H / 2} ${SVG_W / 2},${SVG_H / 2 + 40} ${SVG_W / 2 - 28},${SVG_H / 2}`}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth={0.75}
                  strokeOpacity={0.15}
                />

                {/* Inner diamond */}
                <polygon
                  points={`${SVG_W / 2},${SVG_H / 2 - 22} ${SVG_W / 2 + 15},${SVG_H / 2} ${SVG_W / 2},${SVG_H / 2 + 22} ${SVG_W / 2 - 15},${SVG_H / 2}`}
                  fill="var(--gold)"
                  fillOpacity={0.06}
                  stroke="none"
                />

                {/* Corner diamonds */}
                {[
                  { x: 28, y: 28 },
                  { x: SVG_W - 28, y: 28 },
                  { x: 28, y: SVG_H - 28 },
                  { x: SVG_W - 28, y: SVG_H - 28 },
                ].map((pos, i) => (
                  <polygon
                    key={i}
                    points={`${pos.x},${pos.y - 6} ${pos.x + 5},${pos.y} ${pos.x},${pos.y + 6} ${pos.x - 5},${pos.y}`}
                    fill="var(--gold)"
                    fillOpacity={0.18}
                    stroke="none"
                  />
                ))}
              </svg>

              {/* Text overlays — positioned over the SVG */}
              <div className="absolute inset-0 flex flex-col justify-between p-[12%] pointer-events-none">
                {/* Top-left: "There is gold" */}
                <div className="text-left">
                  <p
                    className={`font-display text-[clamp(1.25rem,3.5vw,2.5rem)] font-bold tracking-tight leading-tight transition-all duration-700 ease-out ${
                      textRevealed >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
                  >
                    There is <span className="text-gold-gradient">gold</span>
                  </p>
                </div>

                {/* Center: "to be mined" */}
                <div className="text-center">
                  <p
                    className={`font-display text-[clamp(1.25rem,3.5vw,2.5rem)] font-bold tracking-tight leading-tight transition-all duration-700 ease-out ${
                      textRevealed >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
                  >
                    to be <span className="text-gold-gradient">mined</span>
                  </p>
                </div>

                {/* Bottom-right: "within your mind" */}
                <div className="text-right">
                  <p
                    className={`font-display text-[clamp(1.25rem,3.5vw,2.5rem)] font-bold tracking-tight leading-tight transition-all duration-700 ease-out ${
                      textRevealed >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
                  >
                    in your <span className="text-gold-gradient">mind</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── BACK FACE ── */}
            <div
              className="absolute inset-0 rounded-2xl border border-gold/30 bg-card overflow-hidden drop-shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="flex flex-col h-full p-[8%]">
                {/* Hero statement */}
                <div className="mb-[5%]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rotate-45 bg-gold" />
                    <span className="font-display font-bold tracking-tight text-[clamp(0.75rem,1.5vw,1rem)] text-foreground/80">
                      Tarot Vault
                    </span>
                  </div>
                  <p className="font-display font-bold text-[clamp(1rem,2.2vw,1.6rem)] leading-snug tracking-tight">
                    Your digital vault for the cultivation of insight through{" "}
                    <span className="text-gold-gradient">Tarot</span>.
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1 flex flex-col justify-center space-y-[6%]">
                  {[
                    {
                      title: "Design spreads",
                      body: "Arrange card positions however you want. Celtic Cross, three-card pull, or something entirely your own.",
                    },
                    {
                      title: "Record readings",
                      body: "Capture every draw, every question, every first impression. Your complete practice, always at hand.",
                    },
                    {
                      title: "Interpret with depth",
                      body: "Reflect on your readings with notes, annotations, and AI-assisted interpretation. Meaning reveals itself over time.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="border-l border-gold/20 pl-[5%]">
                      <h3 className="font-display text-[clamp(0.75rem,1.5vw,1rem)] font-bold tracking-tight mb-1">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-[clamp(0.65rem,1.2vw,0.85rem)] leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA buttons — inline: Enter (2/3) + Sign in (1/3) */}
                <div className="mt-[6%] space-y-3">
                  <div className="flex gap-2 pointer-events-auto">
                    <SignUpButton mode="modal">
                      <Button
                        size="lg"
                        className="flex-[2] border border-gold/50 bg-transparent text-gold hover:bg-gold/10 hover:border-gold font-semibold rounded-lg transition-all duration-300 text-[clamp(0.8rem,1.4vw,1rem)] h-[clamp(2.25rem,4vw,3rem)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TaskAdd01Icon />
                        Join the waitlist
                        {/* <ArrowRight01Icon className="ml-2 w-4 h-4" strokeWidth={2} /> */}
                      </Button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="flex-[1] text-muted-foreground hover:text-foreground font-medium rounded-lg transition-all duration-300 text-[clamp(0.7rem,1.2vw,0.9rem)] h-[clamp(2.25rem,4vw,3rem)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Sign in
                      </Button>
                    </SignInButton>
                  </div>
                  <p className="text-[clamp(0.45rem,0.8vw,0.6rem)] text-center text-muted-foreground/30">
                    &copy; 2026 Tarot Vault
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Flip hint — below the card ── */}
      <div
        className={`flex flex-col items-center gap-1 transition-opacity duration-1000 ${
          showHint && !isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Bouncing arrow pointing up at the card */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-hint-bounce text-muted-foreground/40"
        >
          <path
            d="M8 12V4M8 4L4 8M8 4L12 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground/40">
          turn over
        </span>
      </div>
    </div>
  );
}