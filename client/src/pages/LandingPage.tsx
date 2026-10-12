import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Folder,
  FileText,
  Star,
  Zap,
  Shield,
  Keyboard,
  CheckCircle2,
  Lock,
  UploadCloud,
  Check,
  ChevronRight,
  Layers,
  Search,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { APP_URL } from '../api/client';

// Noteeye pastel swatch palette for interactive demo
const PASTEL_THEMES = [
  { id: 'yellow', name: 'Lemon', bg: '#FFF9DB', border: '#FDE68A', accent: '#D97706', tag: 'Ideas & Brainstorms' },
  { id: 'mint', name: 'Mint', bg: '#D3F9D8', border: '#A7F3D0', accent: '#059669', tag: 'Habits & Wellness' },
  { id: 'sky', name: 'Sky', bg: '#E7F5FF', border: '#BAE6FD', accent: '#0284C7', tag: 'Deep Research' },
  { id: 'rose', name: 'Rose', bg: '#FFF0F6', border: '#FBCFE8', accent: '#DB2777', tag: 'Personal Journal' },
  { id: 'lavender', name: 'Lavender', bg: '#F3F0FF', border: '#DDD6FE', accent: '#7C3AED', tag: 'Sprint Milestones' },
  { id: 'peach', name: 'Peach', bg: '#FFE8CC', border: '#FED7AA', accent: '#EA580C', tag: 'Action Items' },
];

export const LandingPage: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState(PASTEL_THEMES[0]);
  const [demoNoteTitle, setDemoNoteTitle] = useState('Product Launch Strategy');
  const [demoNoteBody, setDemoNoteBody] = useState(
    'Keep user interfaces humane and tactile. Focus on lightning-fast response times, 6 soothing pastel themes, and spatial hierarchy.'
  );

  const loginUrl = `${APP_URL}/login`;
  const registerUrl = `${APP_URL}/register`;
  const appWorkspaceUrl = `${APP_URL}/`;

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#1F1F1F] font-sans antialiased selection:bg-[#C2E7FF] selection:text-[#001D35]">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#F8FAFD]/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Version Pill */}
          <a
            href="#hero"
            className="flex items-center gap-3 group select-none transition-transform hover:scale-[1.02]"
          >
            <img
              src="/noteeye_logo.png"
              alt="Noteeye Logo"
              className="w-10 h-10 object-contain drop-shadow-xs"
            />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#1F1F1F]">
                Noteeye
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[#0B57D0] bg-[#E8F0FE] rounded-full border border-[#D2E3FC]">
                v2.0
              </span>
            </div>
          </a>

          {/* Centered Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#444746]">
            <a href="#features" className="hover:text-[#0B57D0] transition-colors">
              Features
            </a>
            <a href="#pastel-system" className="hover:text-[#0B57D0] transition-colors">
              Pastel Cards
            </a>
            <a href="#spatial-drive" className="hover:text-[#0B57D0] transition-colors">
              Spatial Drive
            </a>
            <a href="#shortcuts" className="hover:text-[#0B57D0] transition-colors">
              Shortcuts
            </a>
            <a href="#pricing" className="hover:text-[#0B57D0] transition-colors">
              Pricing
            </a>
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href={loginUrl}
              className="text-[14px] font-semibold text-[#444746] hover:text-[#1F1F1F] px-3.5 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              Sign in
            </a>
            <a
              href={registerUrl}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-white bg-[#0B57D0] hover:bg-[#0842A0] px-4.5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative pt-12 pb-20 overflow-hidden sm:pt-20 sm:pb-28">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40">
          <div className="absolute top-10 left-1/4 w-80 h-80 bg-[#C2E7FF] rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-[#FFF0F6] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Social Proof Review Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs mb-8">
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-block w-5 h-5 rounded-full bg-[#FFE8CC] border-2 border-white text-[10px] font-bold text-center leading-4">
                A
              </span>
              <span className="inline-block w-5 h-5 rounded-full bg-[#D3F9D8] border-2 border-white text-[10px] font-bold text-center leading-4">
                S
              </span>
              <span className="inline-block w-5 h-5 rounded-full bg-[#E7F5FF] border-2 border-white text-[10px] font-bold text-center leading-4">
                M
              </span>
            </div>
            <div className="flex items-center text-amber-500 text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-bold text-[#1F1F1F]">4.9</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-[#444746]">
              Loved by 2,500+ creators & thinkers
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#1F1F1F] tracking-tight leading-[1.12]">
            Organize Your Notes, <br className="hidden sm:inline" />
            Tasks, and Ideas
          </h1>

          {/* Value Proposition Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-[#444746] leading-relaxed">
            Organize all your notes, tasks, and ideas in one clean workspace. A lightweight,
            distraction-free digital canvas combining Google Drive spatial hierarchy with 6
            soothing pastel cards.
          </p>

          {/* Action CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <a
              href={registerUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-base font-semibold text-white bg-[#0B57D0] hover:bg-[#0842A0] rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Try For Free</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </a>
            <a
              href={appWorkspaceUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-[#1F1F1F] bg-white hover:bg-slate-50 border border-slate-300 rounded-full shadow-xs hover:border-slate-400 transition-all active:scale-95"
            >
              <span>Launch Workspace</span>
              <ExternalLink className="w-4 h-4 text-[#444746]" />
            </a>
          </div>

          <p className="mt-4 text-xs text-[#5E5E5E]">
            No credit card required · Instant cloud sync · Free tier available
          </p>

          {/* ─────────────────────────────────────────────────────────────
              HERO WORKSPACE CANVAS PREVIEW (Google Drive Island Mockup)
              ───────────────────────────────────────────────────────────── */}
          <div className="mt-14 relative rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden p-3 sm:p-6 text-left">
            {/* Mock Topbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <span className="text-xs font-semibold text-slate-400 ml-2">
                  app-noteeye.vercel.app / my-drive
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs text-slate-500">
                <Search className="w-3.5 h-3.5" />
                <span>Search notes (Ctrl + K)</span>
              </div>
            </div>

            {/* Folder Row */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Collections & Folders
                </span>
                <span className="text-xs text-[#0B57D0] font-medium">3 Folders</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[#FFE8CC] border border-[#FED7AA] shadow-xs flex flex-col justify-between h-24 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <Folder className="w-5 h-5 text-[#EA580C]" />
                    <span className="text-[11px] font-semibold text-[#EA580C]">8 notes</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 truncate">Movie Review</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F3F0FF] border border-[#DDD6FE] shadow-xs flex flex-col justify-between h-24 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <Folder className="w-5 h-5 text-[#7C3AED]" />
                    <span className="text-[11px] font-semibold text-[#7C3AED]">14 notes</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 truncate">Class Notes</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#E7F5FF] border border-[#BAE6FD] shadow-xs flex flex-col justify-between h-24 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <Folder className="w-5 h-5 text-[#0284C7]" />
                    <span className="text-[11px] font-semibold text-[#0284C7]">5 notes</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 truncate">Book Lists</span>
                </div>

                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0B57D0] bg-slate-50/60 flex flex-col items-center justify-center gap-1.5 h-24 text-slate-500 hover:text-[#0B57D0] cursor-pointer transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-semibold">New Folder</span>
                </div>
              </div>
            </div>

            {/* Note Cards Preview */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Notecards
                </span>
                <span className="text-xs text-slate-400">6 Colors available</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4.5 rounded-2xl bg-[#FFF9DB] border border-[#FDE68A] shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      Ideas
                    </span>
                    <span className="text-[11px] text-slate-400">Today</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                    Rustic Loaf Bread Method
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    Combine flour, water, yeast, and salt. Allow no-knead fermentation for 12 hours.
                  </p>
                </div>

                <div className="p-4.5 rounded-2xl bg-[#D3F9D8] border border-[#A7F3D0] shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Wellness
                    </span>
                    <span className="text-[11px] text-slate-400">Yesterday</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                    Morning Routine & Habits
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    Hydration first thing. 15-minute sunlight walk, followed by deep writing session.
                  </p>
                </div>

                <div className="p-4.5 rounded-2xl bg-[#FFF0F6] border border-[#FBCFE8] shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 bg-pink-100/80 px-2 py-0.5 rounded-md">
                      Personal
                    </span>
                    <span className="text-[11px] text-slate-400">Oct 11</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                    Travel Itinerary: Kyoto
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    Visit Arashiyama bamboo grove early. Evening stroll along Pontocho alley.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. CREDIBILITY & KEY METRICS STRIP
          ───────────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-200/80 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1F1F1F] tracking-tight">
                100%
              </div>
              <div className="mt-1 text-sm font-medium text-[#444746]">
                Free & Open Access
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0B57D0] tracking-tight">
                6
              </div>
              <div className="mt-1 text-sm font-medium text-[#444746]">
                Calm Pastel Themes
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1F1F1F] tracking-tight">
                &lt; 50ms
              </div>
              <div className="mt-1 text-sm font-medium text-[#444746]">
                Edge Cloud Latency
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1F1F1F] tracking-tight">
                2,500+
              </div>
              <div className="mt-1 text-sm font-medium text-[#444746]">
                Active Thinkers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. PILLAR 1: INTERACTIVE PASTEL CARD SYSTEM
          ───────────────────────────────────────────────────────────── */}
      <section id="pastel-system" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0B57D0] bg-[#E8F0FE] rounded-full">
              The Pastel Aesthetic
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-[#1F1F1F] tracking-tight">
              Master Your Knowledge with Tactile Pastel Notecards
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#444746]">
              Say goodbye to chaotic gray lists and blinding stark cards. Noteeye delivers 6
              harmonious pastel tones engineered to foster calm focus and instant visual recall.
            </p>
          </div>

          {/* Interactive Live Card Playground */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Palette Selector */}
              <div className="w-full md:w-1/3 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Pick a Card Color
                </span>
                {PASTEL_THEMES.map((theme) => {
                  const isSelected = selectedTheme.id === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#0B57D0] bg-[#F8FAFD] shadow-xs ring-2 ring-[#0B57D0]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded-full border shadow-2xs"
                          style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                        />
                        <span className="text-sm font-semibold text-slate-900">
                          {theme.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {theme.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Note Preview */}
              <div className="w-full md:w-2/3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Live Card Sandbox
                </span>
                <div
                  className="rounded-2xl p-6 border shadow-sm transition-colors duration-300 min-h-64 flex flex-col justify-between"
                  style={{
                    backgroundColor: selectedTheme.bg,
                    borderColor: selectedTheme.border,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${selectedTheme.accent}20`,
                          color: selectedTheme.accent,
                        }}
                      >
                        {selectedTheme.tag}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Just now</span>
                    </div>

                    <input
                      type="text"
                      value={demoNoteTitle}
                      onChange={(e) => setDemoNoteTitle(e.target.value)}
                      className="w-full font-bold text-lg text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0 mb-2"
                      placeholder="Note Title..."
                    />

                    <textarea
                      value={demoNoteBody}
                      onChange={(e) => setDemoNoteBody(e.target.value)}
                      rows={4}
                      className="w-full text-sm text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none leading-relaxed"
                      placeholder="Write your thought..."
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-900/10 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: selectedTheme.accent }} />
                      Color: {selectedTheme.name}
                    </span>
                    <a
                      href={registerUrl}
                      className="font-semibold hover:underline flex items-center gap-1"
                      style={{ color: selectedTheme.accent }}
                    >
                      Save note in app <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. PILLAR 2: SPATIAL DRIVE & HIERARCHY
          ───────────────────────────────────────────────────────────── */}
      <section id="spatial-drive" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0B57D0] bg-[#E8F0FE] rounded-full">
                Spatial Organization
              </span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-[#1F1F1F] tracking-tight leading-tight">
                Google Drive Hierarchy Meets Tactile Sticky Notes
              </h2>
              <p className="mt-6 text-base sm:text-lg text-[#444746] leading-relaxed">
                Folders shouldn&apos;t feel like endless nested mazes. In Noteeye, collections are
                spatial 3D cards that open instantly with smooth breadcrumb navigation.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1F1F]">Infinite Nested Folders</h3>
                    <p className="text-sm text-[#444746] mt-0.5">
                      Sub-folder hierarchies let you branch topics naturally while maintaining clear
                      breadcrumbs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1F1F]">Favorites & Recent Stream</h3>
                    <p className="text-sm text-[#444746] mt-0.5">
                      Star critical documents for one-click access and resume exactly where you left
                      off.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1F1F]">Safe Trash Recovery</h3>
                    <p className="text-sm text-[#444746] mt-0.5">
                      Accidentally deleted a note? Restore notes and folders with full metadata in one
                      click.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={registerUrl}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B57D0] hover:text-[#0842A0] group"
                >
                  <span>Explore spatial workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right Visual Graphic */}
            <div className="relative rounded-3xl bg-[#F8FAFD] border border-slate-200 p-6 sm:p-8 shadow-inner">
              <div className="space-y-4">
                {/* Simulated Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[#0B57D0] font-semibold">Home</span>
                  <span>/</span>
                  <span className="text-[#0B57D0] font-semibold">Research</span>
                  <span>/</span>
                  <span className="text-slate-800 font-bold">2026 Product Vision</span>
                </div>

                {/* Simulated Folder Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E7F5FF] text-[#0284C7] flex items-center justify-center">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Engineering Specs</h4>
                      <p className="text-xs text-slate-500">18 documents · Updated 2h ago</p>
                    </div>
                  </div>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>

                {/* Simulated Nested Notes */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-[#FFF9DB] border border-[#FDE68A] shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-700">API Architecture</span>
                    <p className="text-xs font-semibold text-slate-900 mt-1">REST + JWT Auth</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#D3F9D8] border border-[#A7F3D0] shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-700">Database</span>
                    <p className="text-xs font-semibold text-slate-900 mt-1">MongoDB Atlas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. PILLAR 3: SHORTCUTS & VELOCITY
          ───────────────────────────────────────────────────────────── */}
      <section id="shortcuts" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0B57D0] bg-[#E8F0FE] rounded-full">
              High-Velocity Shortcuts
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-[#1F1F1F] tracking-tight">
              Keep Your Hands on the Keyboard
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#444746]">
              Navigate and capture notes at lightning speed with built-in productivity shortcuts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#0B57D0] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <div className="inline-block px-2.5 py-1 bg-slate-100 rounded-md font-mono text-xs font-bold text-slate-700 mb-2">
                Ctrl + K
              </div>
              <h3 className="font-bold text-slate-900 text-base">Global Search</h3>
              <p className="text-xs text-[#444746] mt-1.5 leading-relaxed">
                Open instant fuzzy search across all your titles, folders, and note bodies.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#0B57D0] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <div className="inline-block px-2.5 py-1 bg-slate-100 rounded-md font-mono text-xs font-bold text-slate-700 mb-2">
                Ctrl + N
              </div>
              <h3 className="font-bold text-slate-900 text-base">Instant New Note</h3>
              <p className="text-xs text-[#444746] mt-1.5 leading-relaxed">
                Create and begin drafting a new notecard instantly from anywhere in the app.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#0B57D0] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center mb-4">
                <Folder className="w-5 h-5" />
              </div>
              <div className="inline-block px-2.5 py-1 bg-slate-100 rounded-md font-mono text-xs font-bold text-slate-700 mb-2">
                Ctrl + Shift + F
              </div>
              <h3 className="font-bold text-slate-900 text-base">Create Folder</h3>
              <p className="text-xs text-[#444746] mt-1.5 leading-relaxed">
                Spawn a new collection folder without leaving your current typing flow.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#0B57D0] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#0B57D0] flex items-center justify-center mb-4">
                <Keyboard className="w-5 h-5" />
              </div>
              <div className="inline-block px-2.5 py-1 bg-slate-100 rounded-md font-mono text-xs font-bold text-slate-700 mb-2">
                Esc / Back
              </div>
              <h3 className="font-bold text-slate-900 text-base">Rapid Dismiss</h3>
              <p className="text-xs text-[#444746] mt-1.5 leading-relaxed">
                Close modals, clear active search, or return up one folder tier smoothly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. EVERYTHING YOU NEED IN ONE APP (6 Pillars)
          ───────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0B57D0] bg-[#E8F0FE] rounded-full">
              Full Feature Matrix
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-[#1F1F1F] tracking-tight">
              Everything You Need in One Unified App
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#444746]">
              Organize, draft, and retrieve effortlessly without bloat or distraction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#F8FAFD] border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confidential & Isolated</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Multi-tenant data isolation backed by industry-standard JWT authentication. Your
                personal notes remain strictly yours.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#F8FAFD] border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Instant Edge Backup</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Seamless real-time synchronization backed by MongoDB Atlas and deployed on
                Vercel&apos;s global edge network.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#F8FAFD] border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Super-Fast Performance</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Zero lag navigation, instant search typing, and optimized lightweight React 19
                rendering with client caching.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#F8FAFD] border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Responsive Architecture</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Desktop 4-column command center, fluid tablet layout, and tactile mobile bottom
                navigation with morphing actions.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#F8FAFD] border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Word-Style Editor</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Support for headings, clean lists, multi-cell tables, block dividers, and
                distraction-free writing canvas.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#F8FAFD] border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zero Distractions</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                No intrusive popups, no AI hype gimmicks, no cluttered sidebars. Just clean, calm,
                focused thought organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. TESTIMONIALS
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F1F1F] tracking-tight">
              Trusted by Deep Thinkers & Writers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                &ldquo;Noteeye has completely transformed the way I organize complex research. The
                ability to color-code ideas into 6 pastel cards makes my brain feel calm and
                focused.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 pt-6 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#FFE8CC] text-[#EA580C] font-bold flex items-center justify-center text-sm">
                  JS
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Dr. Jesse S.</h4>
                  <p className="text-xs text-slate-500">Cognitive Researcher</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                &ldquo;The spatial collections feature has replaced 4 different tools for me. I can
                finally maintain structure without feeling overwhelmed by file clutter.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 pt-6 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#E7F5FF] text-[#0284C7] font-bold flex items-center justify-center text-sm">
                  GK
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Greg H. King</h4>
                  <p className="text-xs text-slate-500">Design Architect</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                &ldquo;Switching to Noteeye was the best decision for my workflow. Super-fast
                shortcuts (Ctrl+K, Ctrl+N) and instant sync have saved me hours each week.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 pt-6 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#D3F9D8] text-[#059669] font-bold flex items-center justify-center text-sm">
                  LF
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Leon H. Frick</h4>
                  <p className="text-xs text-slate-500">Author & Strategist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. TRANSPARENT PRICING
          ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0B57D0] bg-[#E8F0FE] rounded-full">
              Straightforward Pricing
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-[#1F1F1F] tracking-tight">
              Start Free, Scale as You Grow
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#444746]">
              No hidden fees. Free forever for individual note-takers.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-[#F8FAFD] rounded-3xl border border-slate-200/90 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Starter
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  Ideal for personal thoughts, checklists, and daily journal entries.
                </p>

                <div className="mt-6 space-y-3 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Create up to 50 notes</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>6 Curated pastel themes</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Full folder organization</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Keyboard shortcuts</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={registerUrl}
                  className="w-full inline-flex items-center justify-center py-3 text-sm font-semibold text-[#1F1F1F] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors"
                >
                  Get Started Free
                </a>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-white rounded-3xl border-2 border-[#0B57D0] shadow-xl p-8 flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0B57D0] text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0B57D0]">
                  Standard Pro
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$6</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  For active creators and researchers seeking limitless organization.
                </p>

                <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Unlimited notes & folders</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Multi-device edge synchronization</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Rich formatting & Word tables</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>30-Day Trash recovery</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={registerUrl}
                  className="w-full inline-flex items-center justify-center py-3 text-sm font-semibold text-white bg-[#0B57D0] hover:bg-[#0842A0] rounded-xl shadow-xs transition-colors"
                >
                  Upgrade to Pro
                </a>
              </div>
            </div>

            {/* Team Plan */}
            <div className="bg-[#F8FAFD] rounded-3xl border border-slate-200/90 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Team & Enterprise
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$18</span>
                  <span className="text-xs text-slate-500">/ user / month</span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  For teams needing shared collections and centralized workspace control.
                </p>

                <div className="mt-6 space-y-3 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Shared workspace collections</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>Team audit logs & recovery</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0B57D0]" />
                    <span>24/7 Priority support</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={registerUrl}
                  className="w-full inline-flex items-center justify-center py-3 text-sm font-semibold text-[#1F1F1F] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. FINAL CALL TO ACTION BANNER
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block p-4 rounded-3xl bg-[#FFF9DB] border border-[#FDE68A] shadow-md mb-8 rotate-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto text-amber-700">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <span className="text-xs font-bold text-amber-900 tracking-wider uppercase block mt-1">
              Your Space For Notes & Ideas
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1F1F1F] tracking-tight">
            Simple Notes. Powerful Flow.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-[#444746]">
            Write notes and documents seamlessly, organized, fast, and distraction free.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={registerUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-[#0B57D0] hover:bg-[#0842A0] rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Get Started in 30 Seconds</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </a>
            <a
              href={appWorkspaceUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-[#1F1F1F] bg-white hover:bg-slate-50 border border-slate-300 rounded-full shadow-xs transition-all active:scale-95"
            >
              <span>Explore Workspace</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          11. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/90 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/noteeye_logo.png"
                alt="Noteeye Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-bold text-[#1F1F1F]">Noteeye</span>
              <span className="text-xs text-slate-400 ml-2">
                Tactile Spatial Note-Taking
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#444746]">
              <a href="#hero" className="hover:text-[#0B57D0] transition-colors">
                Home
              </a>
              <a href="#features" className="hover:text-[#0B57D0] transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-[#0B57D0] transition-colors">
                Pricing
              </a>
              <a href={loginUrl} className="hover:text-[#0B57D0] transition-colors">
                Sign in
              </a>
              <a href={registerUrl} className="hover:text-[#0B57D0] transition-colors">
                Register
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} Noteeye Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Vercel Edge Global Network: Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
