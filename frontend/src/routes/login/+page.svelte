<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { authStore } from '$lib/stores'
  import { get } from 'svelte/store'

  const indicators = [
    'RSI — 14',
    'ADX — 14',
    'MACD — 12/26/9',
    'SuperTrend — 10/3',
    'HMA — 9',
    'Bollinger Bands — 20',
    'ATR — 10',
    'SMA — 50',
    'WMA — 9',
  ]

  const marqueeItems = [...indicators, ...indicators]

  onMount(() => {
    const auth = get(authStore)
    if (auth.isAuthenticated) {
      goto('/dashboard')
    }
  })
</script>

<!-- HERO -->
<section class="hero">
  <div class="hero__glow"></div>
  <div class="hero__grid"></div>
  <div class="hero__content">
    <div class="hero__badge">AI-Powered Forex Signals</div>
    <h1 class="hero__title">
      Trade smarter.<br />
      <span class="hero__title-accent">Not harder.</span>
    </h1>
    <p class="hero__subtitle">
      Yukti analyzes INR currency pairs using advanced quant models
      and AI validation — giving you clear BUY, SELL, or NO TRADE signals
      in real time.
    </p>
    <div class="hero__actions">
      <a href="/register" class="btn-primary">Get Started</a>
      <a href="/login" class="btn-secondary">Sign In</a>
    </div>
  </div>
</section>

<!-- MARQUEE -->
<div class="marquee-section">
  <p class="marquee-label">Powered by these indicators</p>
  <div class="marquee-wrapper">
    <div class="marquee-fade marquee-fade--left"></div>
    <div class="marquee-fade marquee-fade--right"></div>
    <div class="marquee-track">
      {#each marqueeItems as item}
        <div class="marquee-item">
          <span class="marquee-dot">◆</span>
          {item}
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- FEATURES -->
<section class="features">
  <div class="features__header">
    <h2>Everything you need to trade with confidence</h2>
    <p>From live market data to AI-validated signals — Yukti gives you a complete edge.</p>
  </div>
  <div class="features__grid">
    <div class="feature-card">
      <div class="feature-card__icon">📈</div>
      <h3>Quant Signals</h3>
      <p>RSI, ADX, MACD, SuperTrend, HMA — all combined into one unified score. Clear BUY / SELL / NO TRADE.</p>
    </div>
    <div class="feature-card">
      <div class="feature-card__icon">🤖</div>
      <h3>AI Validation</h3>
      <p>Gemini AI independently analyzes every signal — agrees or disagrees with clear reasoning.</p>
    </div>
    <div class="feature-card">
      <div class="feature-card__icon">⚡</div>
      <h3>Live Data</h3>
      <p>Real-time candles via WebSocket — USD/INR, EUR/INR, GBP/INR, JPY/INR across multiple timeframes.</p>
    </div>
    <div class="feature-card">
      <div class="feature-card__icon">🧪</div>
      <h3>Backtesting</h3>
      <p>Run historical simulations — see win rate, P&L, max drawdown, and equity curve before you trade.</p>
    </div>
  </div>
</section>

<!-- STEPS -->
<section class="steps">
  <div class="steps__header">
    <h2>Your trading edge in 3 steps</h2>
  </div>
  <div class="steps__list">
    <div class="step">
      <div class="step__number">01</div>
      <h3>Select Your Pair</h3>
      <p>Choose from USD/INR, EUR/INR, GBP/INR or JPY/INR across 1h, 4h, or 1day intervals.</p>
    </div>
    <div class="step__divider"></div>
    <div class="step">
      <div class="step__number">02</div>
      <h3>Get Your Signal</h3>
      <p>Quant engine calculates a unified score. AI validates it independently. You get one clear signal.</p>
    </div>
    <div class="step__divider"></div>
    <div class="step">
      <div class="step__number">03</div>
      <h3>Trade With Confidence</h3>
      <p>Stop loss and take profit levels calculated automatically. Risk managed for every trade.</p>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="cta__glow"></div>
  <h2>Ready to trade smarter?</h2>
  <p>Join Yukti and get AI-powered forex signals today.</p>
  <a href="/register" class="btn-primary">Get Started Free</a>
</section>

<!-- FOOTER -->
<footer class="footer">
  <div class="footer__left">
    <span class="footer__logo">Yukti<span class="footer__dot">.</span></span>
    <p>AI-powered forex signals for INR pairs.</p>
  </div>
  <div class="footer__right">
    <a href="/login">Sign In</a>
    <a href="/register">Register</a>
  </div>
</footer>

<style>
  /* ═══════════════════════════════════════
     HERO
     ═══════════════════════════════════════ */
  .hero {
    position: relative;
    min-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px 10px;
    overflow: hidden;
    margin-top:-80px;
  }

  .hero__glow {
    position: absolute;
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 600px;
    background: radial-gradient(
      ellipse at center,
      rgba(124, 106, 255, 0.25) 0%,
      rgba(124, 106, 255, 0.05) 50%,
      transparent 70%
    );
    pointer-events: none;
  }

  .hero__grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  .hero__content {
    position: relative;
    z-index: 1;
    max-width: 720px;
  }

  .hero__badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(124, 106, 255, 0.15);
    border: 1px solid rgba(124, 106, 255, 0.3);
    border-radius: 100px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #a89fff;
    margin-bottom: 28px;
    letter-spacing: 0.5px;
  }

  .hero__title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 800;
    line-height: 1.1;
    color: #f0f0f0;
    margin-bottom: 24px;
    letter-spacing: -1px;
  }

  .hero__title-accent {
    background: linear-gradient(135deg, #7c6aff, #a89fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero__subtitle {
    font-size: 1.1rem;
    color: #a0a0a0;
    line-height: 1.7;
    max-width: 560px;
    margin: 0 auto 40px;
  }

  .hero__actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* ═══════════════════════════════════════
     BUTTONS
     ═══════════════════════════════════════ */
  .btn-primary {
    display: inline-block;
    padding: 14px 32px;
    background: #7c6aff;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.15s ease, transform 0.15s ease;
  }

  .btn-primary:hover {
    background: #6b58f0;
    transform: translateY(-2px);
    color: white;
  }

  .btn-secondary {
    display: inline-block;
    padding: 14px 32px;
    background: transparent;
    color: #f0f0f0;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 10px;
    border: 1px solid #2e2e2e;
    text-decoration: none;
    transition: border-color 0.15s ease,
                background 0.15s ease,
                transform 0.15s ease;
  }

  .btn-secondary:hover {
    border-color: #7c6aff;
    background: rgba(124, 106, 255, 0.08);
    transform: translateY(-2px);
    color: #f0f0f0;
  }

  /* ═══════════════════════════════════════
     MARQUEE
     ═══════════════════════════════════════ */
  .marquee-section {
    padding: 60px 0;
    text-align: center;
    margin-top: -150px;
    
  }

  .marquee-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #606060;
    margin-bottom: 32px;
  }

  .marquee-wrapper {
    position: relative;
    padding: 20px 0;
    border-top: 1px solid #2e2e2e;
    border-bottom: 1px solid #2e2e2e;
    overflow: hidden;
  }

  .marquee-fade {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 150px;
    z-index: 2;
    pointer-events: none;
  }

  .marquee-fade--left {
    left: 0;
    background: linear-gradient(to right, #0f0f0f, transparent);
  }

  .marquee-fade--right {
    right: 0;
    background: linear-gradient(to left, #0f0f0f, transparent);
  }

  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee 20s linear infinite;
  }

  .marquee-track:hover {
    animation-play-state: paused;
  }

  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  .marquee-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 40px;
    font-size: 1rem;
    font-weight: 600;
    color: #a0a0a0;
    white-space: nowrap;
    letter-spacing: 0.3px;
  }

  .marquee-item:hover {
    color: #f0f0f0;
  }

  .marquee-dot {
    color: #7c6aff;
    font-size: 0.4rem;
  }

  /* ═══════════════════════════════════════
     FEATURES
     ═══════════════════════════════════════ */
  .features {
    padding: 100px 24px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .features__header {
    text-align: center;
    margin-bottom: 64px;
  }

  .features__header h2 {
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    font-weight: 700;
    color: #f0f0f0;
    margin-bottom: 16px;
  }

  .features__header p {
    color: #a0a0a0;
    font-size: 1rem;
    max-width: 480px;
    margin: 0 auto;
  }

  .features__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  @media (max-width: 640px) {
    .features__grid {
      grid-template-columns: 1fr;
    }
  }

  .feature-card {
    background: #1a1a1a;
    border: 1px solid #2e2e2e;
    border-radius: 16px;
    padding: 32px;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .feature-card:hover {
    border-color: rgba(124, 106, 255, 0.4);
    transform: translateY(-4px);
  }

  .feature-card__icon {
    font-size: 2rem;
    margin-bottom: 20px;
  }

  .feature-card h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #f0f0f0;
    margin-bottom: 12px;
  }

  .feature-card p {
    font-size: 0.9rem;
    color: #606060;
    line-height: 1.7;
  }

  /* ═══════════════════════════════════════
     STEPS
     ═══════════════════════════════════════ */
  .steps {
    padding: 80px 24px;
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }

  .steps__header {
    margin-bottom: 64px;
  }

  .steps__header h2 {
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    font-weight: 700;
    color: #f0f0f0;
  }

  .steps__list {
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  @media (max-width: 640px) {
    .steps__list {
      flex-direction: column;
      align-items: center;
    }
    .step__divider {
      width: 1px;
      height: 40px;
      background: #2e2e2e;
      margin: 0 auto;
    }
  }

  .step {
    flex: 1;
    padding: 0 24px;
  }

  .step__number {
    font-size: 3rem;
    font-weight: 800;
    color: rgba(124, 106, 255, 0.2);
    line-height: 1;
    margin-bottom: 16px;
  }

  .step h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #f0f0f0;
    margin-bottom: 12px;
  }

  .step p {
    font-size: 0.875rem;
    color: #606060;
    line-height: 1.7;
  }

  .step__divider {
    width: 60px;
    height: 1px;
    background: #2e2e2e;
    margin-top: 40px;
    flex-shrink: 0;
  }

  /* ═══════════════════════════════════════
     CTA
     ═══════════════════════════════════════ */
  .cta {
    position: relative;
    text-align: center;
    padding: 100px 24px;
    overflow: hidden;
  }

  .cta__glow {
    position: absolute;
    bottom: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(
      ellipse at center,
      rgba(124, 106, 255, 0.2) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  .cta h2 {
    position: relative;
    font-size: clamp(1.8rem, 3vw, 2.8rem);
    font-weight: 700;
    color: #f0f0f0;
    margin-bottom: 16px;
  }

  .cta p {
    position: relative;
    color: #a0a0a0;
    margin-bottom: 40px;
    font-size: 1rem;
  }

  .cta .btn-primary {
    position: relative;
  }

  /* ═══════════════════════════════════════
     FOOTER
     ═══════════════════════════════════════ */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32px 48px;
    border-top: 1px solid #2e2e2e;
  }

  @media (max-width: 640px) {
    .footer {
      flex-direction: column;
      gap: 24px;
      text-align: center;
      padding: 32px 24px;
    }
  }

  .footer__logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f0f0f0;
  }

  .footer__dot {
    color: #7c6aff;
  }

  .footer__left p {
    font-size: 0.8rem;
    color: #606060;
    margin-top: 4px;
  }

  .footer__right {
    display: flex;
    gap: 24px;
  }

  .footer__right a {
    font-size: 0.875rem;
    color: #606060;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .footer__right a:hover {
    color: #f0f0f0;
  }
</style>