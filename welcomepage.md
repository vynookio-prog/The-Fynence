<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fynence. — AI Trading Journal & Psychology Intelligence</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            display: ['"Space Grotesk"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            primary: '#00F2C2',
            'primary-dark': '#059669',
            surface: {
              DEFAULT: '#080B0E',
              subtle: '#0D1117',
              card: 'rgba(16, 21, 28, 0.7)',
              border: 'rgba(255, 255, 255, 0.08)',
              highlight: 'rgba(0, 242, 194, 0.15)',
            }
          },
          animation: {
            'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'float-slow': 'float 6s ease-in-out infinite',
            'float-delay': 'float 6s ease-in-out 3s infinite',
          },
          keyframes: {
            float: {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-10px)' },
            }
          }
        }
      }
    }
  </script>

  <style>
    body {
      background-color: #080B0E;
      color: #E2E8F0;
      overflow-x: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Ambient noise and glow effects */
    .bg-ambient-radial {
      background: radial-gradient(circle at 50% 0%, rgba(0, 242, 194, 0.12) 0%, rgba(5, 150, 105, 0.03) 40%, rgba(8, 11, 14, 0) 70%);
    }

    .glass-vision {
      background: rgba(13, 17, 23, 0.72);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 18px 36px -18px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12);
    }

    .glass-card {
      background: rgba(16, 21, 28, 0.55);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .glass-card:hover {
      border-color: rgba(0, 242, 194, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(0, 242, 194, 0.06);
    }

    .text-gradient {
      background: linear-gradient(135deg, #FFFFFF 30%, #94A3B8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .text-gradient-cyan {
      background: linear-gradient(135deg, #00F2C2 20%, #10B981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .grid-pattern {
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    }
  </style>
</head>

<body class="relative selection:bg-[#00F2C2]/20 selection:text-[#00F2C2]">

  <!-- Global Subtle Background Effects -->
  <div class="fixed inset-0 grid-pattern pointer-events-none z-0"></div>
  <div class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-ambient-radial pointer-events-none z-0"></div>

  <!-- NAVIGATION HEADER -->
  <header class="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#080B0E]/80 border-b border-white/[0.06]">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      
      <!-- Brand Logo & Lockup -->
      <a href="#" class="flex items-center gap-3.5 group">
        <!-- Monogram Logo Icon (SVG) -->
        <div class="w-10 h-10 rounded-xl bg-[#0B0F12] border border-white/10 p-1.5 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(0,242,194,0.15)] group-hover:border-[#00F2C2]/40 transition-all">
          <div class="absolute inset-0 bg-gradient-to-br from-[#00F2C2]/10 to-transparent"></div>
          <svg viewBox="0 0 100 100" class="w-full h-full relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 28 C16 14 30 6 48 6 L88 6 C94 6 96 11 91 16 C83 23 68 31 44 33 C24 35 15 30 12 28 Z" fill="#FFFFFF"/>
            <path d="M8 58 C12 43 26 35 44 35 L76 35 C82 35 84 40 79 44 C72 50 58 58 36 60 C20 62 12 59 8 58 Z" fill="#E2E8F0"/>
            <path d="M14 70 C24 74 34 84 32 94 C24 92 18 84 14 78 Z" fill="url(#cyanFlame)"/>
            <defs>
              <linearGradient id="cyanFlame" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#047857"/>
                <stop offset="40%" stop-color="#10B981"/>
                <stop offset="100%" stop-color="#00F2C2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Typography Brand Name -->
        <div class="flex items-center">
          <span class="font-display text-2xl font-extrabold tracking-tight text-white">Fynence<span class="text-[#00F2C2]">.</span></span>
          <span class="ml-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider bg-[#00F2C2]/10 text-[#00F2C2] border border-[#00F2C2]/30">AI v2.4</span>
        </div>
      </a>

      <!-- Desktop Links -->
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        <a href="#features" class="hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" class="hover:text-white transition-colors">How It Works</a>
        <a href="#psychology" class="hover:text-white transition-colors">AI Psychology</a>
        <a href="#metrics" class="hover:text-white transition-colors">Insights</a>
        <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
      </nav>

      <!-- Action Buttons -->
      <div class="flex items-center gap-4">
        <a href="#" class="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</a>
        <a href="#start" class="relative group px-5 py-2.5 rounded-full text-sm font-semibold text-[#080B0E] bg-gradient-to-r from-[#00F2C2] to-[#10B981] shadow-[0_0_24px_rgba(0,242,194,0.35)] hover:shadow-[0_0_35px_rgba(0,242,194,0.5)] transition-all">
          Get Started
          <span class="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      </div>

    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
    <div class="max-w-7xl mx-auto px-6 relative z-10">
      
      <!-- Headline & Introduction -->
      <div class="max-w-3xl mb-14 text-left">
        
        <!-- Category Badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-6">
          <span class="w-2 h-2 rounded-full bg-[#00F2C2] animate-pulse"></span>
          <span class="text-xs font-mono uppercase tracking-widest text-[#00F2C2]">Neuro-Algorithmic Cognition Desk</span>
        </div>

        <h1 class="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          Trade smarter.<br>
          <span class="text-gradient-cyan">Understand yourself.</span>
        </h1>

        <p class="text-lg sm:text-xl text-slate-400 font-normal leading-relaxed mb-8 max-w-2xl">
          Fynence turns raw execution feeds into actionable psychological intelligence. Pinpoint impulsive drift, quantify emotional drawdown down to the cent, and enforce institutional composure.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-wrap items-center gap-4 mb-10">
          <a href="#start" class="px-7 py-3.5 rounded-xl font-semibold text-[#080B0E] bg-[#00F2C2] hover:bg-[#00e0b3] shadow-[0_4px_25px_rgba(0,242,194,0.3)] hover:shadow-[0_6px_35px_rgba(0,242,194,0.45)] transition-all flex items-center gap-2">
            Get Started Free
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
          <a href="#mockup" class="px-7 py-3.5 rounded-xl font-semibold text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 backdrop-blur-md transition-all">
            Explore Fynence
          </a>
        </div>

        <!-- Trust Badges -->
        <div class="flex flex-wrap items-center gap-6 pt-4 border-t border-white/[0.06] text-xs text-slate-400 font-mono">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-[#00F2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>AI-Powered Cognitive Audits</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-[#00F2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>Zero-Latency Automated Sync</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-[#00F2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>Engineered for Prop & Discretionary Traders</span>
          </div>
        </div>

      </div>

      <!-- HERO INTERACTIVE DASHBOARD MOCKUP -->
      <div id="mockup" class="relative w-full rounded-3xl p-[1px] bg-gradient-to-b from-white/15 via-[#00F2C2]/20 to-transparent shadow-[0_30px_100px_rgba(0,0,0,0.85)] backdrop-blur-3xl">
        <div class="rounded-3xl glass-vision p-6 sm:p-8 relative overflow-hidden">
          
          <!-- Radial Backdrop Glow -->
          <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00F2C2]/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Mockup Top Control Bar -->
          <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
            <div class="flex items-center gap-3">
              <div class="flex gap-2">
                <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span class="text-xs font-mono text-slate-400 tracking-wider uppercase pl-2 border-l border-white/10">Fynence Trading Terminal</span>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F2C2]/10 border border-[#00F2C2]/25 text-[#00F2C2] text-xs font-mono">
                <span class="w-2 h-2 rounded-full bg-[#00F2C2] animate-pulse"></span>
                LIVE DESK AUDIT ACTIVE
              </div>
              <span class="text-xs font-mono text-slate-400">SESSION: LONDON/NY OVERLAP</span>
            </div>
          </div>

          <!-- Key Metrics Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 relative z-10">
            <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Net Realized PnL</span>
              <div class="text-2xl sm:text-3xl font-bold font-mono text-[#00F2C2]">+$24,180.50</div>
              <span class="text-xs text-emerald-400 mt-1 inline-block font-mono">↑ +34.2% MTD Gain</span>
            </div>
            <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Profit Factor</span>
              <div class="text-2xl sm:text-3xl font-bold font-mono text-white">1.85</div>
              <span class="text-xs text-slate-400 mt-1 inline-block font-mono">+1.55 Baseline Goal</span>
            </div>
            <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Execution Win Rate</span>
              <div class="text-2xl sm:text-3xl font-bold font-mono text-white">74.2%</div>
              <span class="text-xs text-[#00F2C2] mt-1 inline-block font-mono">54W • 19L Verified</span>
            </div>
            <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Avg Win / Loss</span>
              <div class="text-2xl sm:text-3xl font-bold font-mono text-white">2.14x</div>
              <span class="text-xs text-slate-400 mt-1 inline-block font-mono">+$612 / -$286 Exp</span>
            </div>
          </div>

          <!-- PnL Chart & Psychology Audit Split -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            
            <!-- Execution Curve Chart Card -->
            <div class="lg:col-span-2 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h4 class="text-sm font-semibold text-white">Cumulative Execution Equity Curve</h4>
                  <p class="text-xs text-slate-400">Micro-second tick fills cross-referenced with trader cognitive state</p>
                </div>
                <span class="text-xs font-mono px-2.5 py-1 rounded bg-[#00F2C2]/10 text-[#00F2C2] border border-[#00F2C2]/20">CUMULATIVE</span>
              </div>

              <!-- Interactive Chart SVG -->
              <div class="w-full h-48 py-2">
                <svg viewBox="0 0 600 160" class="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#00F2C2" stop-opacity="0.3"/>
                      <stop offset="60%" stop-color="#00F2C2"/>
                      <stop offset="100%" stop-color="#10B981"/>
                    </linearGradient>
                    <linearGradient id="curveArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#00F2C2" stop-opacity="0.2"/>
                      <stop offset="100%" stop-color="#00F2C2" stop-opacity="0.0"/>
                    </linearGradient>
                  </defs>
                  
                  <!-- Gridlines -->
                  <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                  <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                  <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                  
                  <!-- Filled Area -->
                  <path d="M 10 135 Q 120 125 180 110 T 320 95 T 440 45 T 590 20 L 590 150 L 10 150 Z" fill="url(#curveArea)"/>
                  
                  <!-- Main Curve Path -->
                  <path d="M 10 135 Q 120 125 180 110 T 320 95 T 440 45 T 590 20" fill="none" stroke="url(#curveGradient)" stroke-width="3.5" stroke-linecap="round"/>
                  
                  <!-- Emotional Tilt Marker -->
                  <circle cx="320" cy="95" r="5" fill="#EF4444"/>
                  <line x1="320" y1="95" x2="320" y2="135" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="2"/>
                  <text x="330" y="90" fill="#F87171" font-size="11" font-family="monospace">Revenge Entry (-$672)</text>

                  <!-- Final ATH Node -->
                  <circle cx="590" cy="20" r="6" fill="#00F2C2" stroke="#080B0E" stroke-width="2"/>
                </svg>
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-white/[0.04] text-xs font-mono text-slate-500">
                <span>08:00 OPEN</span>
                <span>10:00 MACRO RELEASE</span>
                <span>12:30 SPREAD SPIKE</span>
                <span class="text-[#00F2C2]">16:00 SETTLE (ATH)</span>
              </div>
            </div>

            <!-- Psychology Leakage Breakdown Card -->
            <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Psychology Audit</span>
                  <span class="text-xs font-bold font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">-$2,876.00 LEAK</span>
                </div>

                <div class="space-y-3.5">
                  <div class="p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-slate-300">Holding Losers Past SL</span>
                      <span class="font-mono text-red-400 font-semibold">-$1,832.00</span>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div class="h-full bg-red-500 rounded-full" style="width: 65%"></div>
                    </div>
                  </div>

                  <div class="p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-slate-300">Revenge Re-entries</span>
                      <span class="font-mono text-red-400 font-semibold">-$672.00</span>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div class="h-full bg-orange-500 rounded-full" style="width: 25%"></div>
                    </div>
                  </div>

                  <div class="p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-slate-300">Cutting Winners Pre-TP</span>
                      <span class="font-mono text-amber-400 font-semibold">-$372.00</span>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div class="h-full bg-amber-400 rounded-full" style="width: 15%"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Discipline Score Gauge -->
              <div class="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-black/40 to-[#00F2C2]/5 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span class="text-[11px] font-mono text-slate-400 uppercase block">Discipline Index</span>
                  <span class="text-xs font-semibold text-[#00F2C2]">Tier-1 Institutional Composure</span>
                </div>
                <div class="text-right">
                  <span class="text-3xl font-bold font-mono text-white">87<span class="text-sm text-slate-500">/100</span></span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  </section>

  <!-- SECTION 2 — PRODUCT PHILOSOPHY & COGNITION MAPPING -->
  <section id="psychology" class="py-24 border-t border-white/[0.06] relative">
    <div class="max-w-7xl mx-auto px-6">
      
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono uppercase tracking-widest text-[#00F2C2] mb-4">
          Behavioral Cognitive Mapping
        </div>
        <h2 class="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          Every trade tells a story.<br>
          <span class="text-gradient-cyan">Fynence helps you understand it.</span>
        </h2>
        <p class="text-slate-400 text-lg leading-relaxed">
          Your legacy trading journal logs what happened. Fynence uncovers why it happened — cross-referencing execution fills with reaction latency and macroeconomic shifts.
        </p>
      </div>

      <!-- Feature Tags -->
      <div class="flex flex-wrap justify-center gap-3 mb-16">
        <span class="px-4 py-1.5 rounded-full bg-[#00F2C2]/10 border border-[#00F2C2]/30 text-[#00F2C2] text-xs font-mono">Discipline Matrix</span>
        <span class="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono">Psychological Tax</span>
        <span class="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono">Risk Anomalies</span>
        <span class="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono">Performance Streaks</span>
        <span class="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono">Trading Habit Loops</span>
      </div>

      <!-- Behavioral Audit Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="glass-card p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-mono text-red-400 uppercase tracking-wider">CRITICAL TRAP • -$14,548.30</span>
            <span class="w-2 h-2 rounded-full bg-red-400"></span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Revenge Re-entries</h3>
          <p class="text-slate-400 text-sm leading-relaxed mb-4">
            After taking an initial loss on NASDAQ futures, you re-enter within 22 minutes on 84% larger position sizes. 9 of the last 11 re-entries resulted in doubled drawdowns.
          </p>
          <div class="text-xs font-mono text-[#00F2C2] flex items-center gap-1.5">
            <span>RULE PRESCRIBED: 45 MIN TIME-LOCK</span>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-mono text-amber-400 uppercase tracking-wider">MODERATE DRIFT • -$2,919.00</span>
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Greed-Driven Gains Surrender</h3>
          <p class="text-slate-400 text-sm leading-relaxed mb-4">
            Days starting with +$1,500 before 10:00 AM EST consistently convert into red sessions by overtrading liquid lunch ranges.
          </p>
          <div class="text-xs font-mono text-[#00F2C2] flex items-center gap-1.5">
            <span>TRIGGER: AUTO-LOCK AFTER +2R TARGET</span>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-mono text-emerald-400 uppercase tracking-wider">REDUCIBLE LEAK • -$2,335.63</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Chasing Break-Outs</h3>
          <p class="text-slate-400 text-sm leading-relaxed mb-4">
            Entering market-orders after 3 green 5m candles result in an adverse excursion average of 18 pips before stop-out.
          </p>
          <div class="text-xs font-mono text-[#00F2C2] flex items-center gap-1.5">
            <span>LIMIT ORDERS ENFORCEMENT READY</span>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- SECTION 3 — HOW IT WORKS -->
  <section id="how-it-works" class="py-24 border-t border-white/[0.06] bg-[#0A0D10]/50">
    <div class="max-w-7xl mx-auto px-6">
      
      <div class="text-center max-w-2xl mx-auto mb-16">
        <span class="text-xs font-mono uppercase tracking-widest text-[#00F2C2] block mb-3">HOW IT WORKS</span>
        <h2 class="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
          From a filled order to <span class="text-gradient-cyan">a habit you can fix.</span>
        </h2>
        <p class="text-slate-400 text-base sm:text-lg">
          Fynence transforms raw fills into an automated feedback loop that strengthens your execution edge with zero friction.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Step 1 -->
        <div class="glass-card p-8 rounded-2xl relative">
          <div class="text-4xl font-mono font-bold text-white/20 mb-6">01</div>
          <h3 class="text-xl font-bold text-white mb-3">Connect Your Broker</h3>
          <p class="text-slate-400 text-sm leading-relaxed mb-6">
            Link your broker account via read-only API or drag-and-drop CSV exports. Every ticket, fill price, commission, and execution timestamp syncs in under 2 seconds.
          </p>
          <div class="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-[#00F2C2]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#00F2C2]"></span>
            <span>MetaTrader 4/5, TradeLocker, NinjaTrader</span>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="glass-card p-8 rounded-2xl relative">
          <div class="text-4xl font-mono font-bold text-[#00F2C2]/40 mb-6">02</div>
          <h3 class="text-xl font-bold text-white mb-3">Reflect While Fresh</h3>
          <p class="text-slate-400 text-sm leading-relaxed mb-6">
            Prompted reflections immediately following trade close. Record emotional states (Calm, Edgy, Euphoric) and state setup conviction while memory is unclouded by hindsight.
          </p>
          <div class="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-[#00F2C2]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#00F2C2]"></span>
            <span>Micro-Journaling • Invalidation Tags</span>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="glass-card p-8 rounded-2xl relative">
          <div class="text-4xl font-mono font-bold text-emerald-400/40 mb-6">03</div>
          <h3 class="text-xl font-bold text-white mb-3">Get Algorithmic Audits</h3>
          <p class="text-slate-400 text-sm leading-relaxed mb-6">
            Fynence continuously runs multi-session behavioral regressions, highlighting setup efficacy, psychological tax metrics, and pre-session vulnerability warnings.
          </p>
          <div class="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-[#00F2C2]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#00F2C2]"></span>
            <span>Tailored Pre-Market Action Plan</span>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- SECTION 4 — SIX PILLARS OF ANALYTICAL SUPREMACY -->
  <section id="features" class="py-24 border-t border-white/[0.06]">
    <div class="max-w-7xl mx-auto px-6">
      
      <div class="text-center max-w-2xl mx-auto mb-16">
        <span class="text-xs font-mono uppercase tracking-widest text-[#00F2C2] block mb-3">INSTITUTIONAL DESK SPECIFICATIONS</span>
        <h2 class="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
          Six pillars of analytical supremacy.
        </h2>
        <p class="text-slate-400 text-base sm:text-lg">
          Crafted specifically for algorithmic traders, discretionary prop executors, and family desks demanding ruthless operational clarity.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- Pillar 1 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-xs font-mono text-[#00F2C2] mb-3">01 // PSYCHOLOGY</div>
          <h3 class="text-lg font-bold text-white mb-2">AI Trading Psychology</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            A comprehensive neuro-cognitive profile generated directly from your broker ticket stream. Detects frustration, overconfidence, revenge loops, and sizing tilts.
          </p>
        </div>

        <!-- Pillar 2 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-xs font-mono text-[#00F2C2] mb-3">02 // EXECUTION</div>
          <h3 class="text-lg font-bold text-white mb-2">Algorithmic Trading Journal</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Automated execution captures paired with dynamic multi-timeframe chart snapshots at the exact second of fill. Say goodbye to manual journal maintenance forever.
          </p>
        </div>

        <!-- Pillar 3 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-xs font-mono text-[#00F2C2] mb-3">03 // ANALYTICS</div>
          <h3 class="text-lg font-bold text-white mb-2">Performance Analytics</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Monte Carlo distributions, Sharpe/Sortino ratios, MAE/MFE scatterplots, and hold-time correlation matrices designed to satisfy institutional capital allocators.
          </p>
        </div>

        <!-- Pillar 4 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-xs font-mono text-[#00F2C2] mb-3">04 // RISK</div>
          <h3 class="text-lg font-bold text-white mb-2">Dynamic Risk Management</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Pre-flight checks, position sizing governors based on real-time ATR, and emergency desk cooling triggers configured to safeguard prop-challenge evaluations.
          </p>
        </div>

        <!-- Pillar 5 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-xs font-mono text-[#00F2C2] mb-3">05 // ALPHA</div>
          <h3 class="text-lg font-bold text-white mb-2">Execution Insights & Edge</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Compare model performance across session opens, news catalysts, and spread expansions to definitively identify which setups earn money and which only churn broker commission.
          </p>
        </div>

        <!-- Pillar 6 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="text-xs font-mono text-[#00F2C2] mb-3">06 // REPORTING</div>
          <h3 class="text-lg font-bold text-white mb-2">Institutional Briefs & Reports</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Receive automated pre-market macro digests and end-of-week PDF tearsheets engineered for prop firm audits, investor transparency, or private performance retrospectives.
          </p>
        </div>

      </div>

    </div>
  </section>

  <!-- FINAL CTA SECTION -->
  <section id="start" class="py-24 border-t border-white/[0.06] relative overflow-hidden">
    <div class="max-w-5xl mx-auto px-6 relative z-10 text-center">
      
      <div class="p-10 sm:p-16 rounded-3xl glass-vision border border-white/10 relative overflow-hidden shadow-[0_20px_80px_rgba(0,242,194,0.15)]">
        
        <!-- Background Ambient Glow -->
        <div class="absolute inset-0 bg-gradient-to-b from-[#00F2C2]/10 via-transparent to-transparent pointer-events-none"></div>

        <span class="inline-block text-xs font-mono uppercase tracking-widest text-[#00F2C2] px-3 py-1 rounded-full bg-[#00F2C2]/10 border border-[#00F2C2]/30 mb-6">
          START TRADING WITH COMPLETE CLARITY
        </span>

        <h2 class="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Your next level starts with<br>
          <span class="text-gradient-cyan">understanding your last trade.</span>
        </h2>

        <p class="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Build a rigorous execution process founded on your own data, unadulterated behavior, and mathematical risk management.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#" class="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-[#080B0E] bg-gradient-to-r from-[#00F2C2] to-[#10B981] shadow-[0_0_30px_rgba(0,242,194,0.4)] hover:shadow-[0_0_45px_rgba(0,242,194,0.6)] transition-all flex items-center justify-center gap-2">
            Get Started Free
            <span class="text-lg">→</span>
          </a>
        </div>

        <p class="text-xs font-mono text-slate-500 mt-6">
          ✓ No credit card required &nbsp;•&nbsp; ✓ Instant MT4/MT5 sync &nbsp;•&nbsp; ✓ 14-day full prop trial
        </p>

      </div>

    </div>
  </section>

  <!-- FOOTER -->
  <footer class="py-16 border-t border-white/[0.06] bg-[#050709] text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-6">
      
      <div class="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
        
        <!-- Brand Summary -->
        <div class="md:col-span-2">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-7 h-7 rounded-lg bg-[#0B0F12] border border-white/10 p-1 flex items-center justify-center">
              <svg viewBox="0 0 100 100" class="w-full h-full" fill="none">
                <path d="M12 28 C16 14 30 6 48 6 L88 6 C94 6 96 11 91 16 C83 23 68 31 44 33 C24 35 15 30 12 28 Z" fill="#FFFFFF"/>
                <path d="M8 58 C12 43 26 35 44 35 L76 35 C82 35 84 40 79 44 C72 50 58 58 36 60 C20 62 12 59 8 58 Z" fill="#E2E8F0"/>
                <path d="M14 70 C24 74 34 84 32 94 C24 92 18 84 14 78 Z" fill="#00F2C2"/>
              </svg>
            </div>
            <span class="font-display text-xl font-bold text-white">Fynence<span class="text-[#00F2C2]">.</span></span>
          </div>
          <p class="text-slate-400 leading-relaxed max-w-sm">
            High-conviction algorithmic journal and cognitive risk intelligence. Engineered for systematic market participants seeking institutional composure.
          </p>
          <div class="mt-4 font-mono text-[11px] text-[#00F2C2] flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#00F2C2] animate-ping"></span>
            SYSTEM COGNITION ENGINE ACTIVE
          </div>
        </div>

        <!-- Links Column 1 -->
        <div>
          <h5 class="text-white font-semibold mb-3 font-mono uppercase tracking-wider text-[11px]">Product</h5>
          <ul class="space-y-2">
            <li><a href="#" class="hover:text-white transition-colors">AI Desk Audit</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Cognitive Tax Metric</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Execution Bias Matrix</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Discipline Dial</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Live Telemetry</a></li>
          </ul>
        </div>

        <!-- Links Column 2 -->
        <div>
          <h5 class="text-white font-semibold mb-3 font-mono uppercase tracking-wider text-[11px]">Resources</h5>
          <ul class="space-y-2">
            <li><a href="#" class="hover:text-white transition-colors">Quant Methodology</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Neuro-Finance Papers</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Risk Models</a></li>
            <li><a href="#" class="hover:text-white transition-colors">API Documentation</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Terminal Guide</a></li>
          </ul>
        </div>

        <!-- Links Column 3 -->
        <div>
          <h5 class="text-white font-semibold mb-3 font-mono uppercase tracking-wider text-[11px]">Company</h5>
          <ul class="space-y-2">
            <li><a href="#" class="hover:text-white transition-colors">Institutional Desk</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Security Posture</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Changelog</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>

      </div>

      <div class="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
        <div>© 2026 FYNENCE QUANT LABS INC. ALL RIGHTS RESERVED.</div>
        <div class="flex items-center gap-6">
          <a href="#" class="hover:text-white transition-colors">PRIVACY ENCLOSURE</a>
          <a href="#" class="hover:text-white transition-colors">EXECUTION TERMS</a>
          <a href="#" class="hover:text-white transition-colors">REGULATORY COMPLIANCE</a>
        </div>
      </div>

    </div>
  </footer>

</body>
</html>
