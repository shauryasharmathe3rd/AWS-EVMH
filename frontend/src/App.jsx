import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  CloudSun,
  Database,
  Droplets,
  FilePlus2,
  Languages,
  LayoutDashboard,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { WardMap } from './components/WardMap';
import { PriorityQueue } from './components/PriorityQueue';
import { ImpactPanel } from './components/ImpactPanel';
import { ConditionsPage } from './pages/ConditionsPage';
import { ReportPage } from './pages/ReportPage';
import { DataPage } from './pages/DataPage';
import { ProvenanceBadge } from './components/ProvenanceBadge';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [showHowToRead, setShowHowToRead] = useState(true);

  // Data states
  const [meta, setMeta] = useState(null);
  const [wards, setWards] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [leaks, setLeaks] = useState([]);
  const [selectedLeak, setSelectedLeak] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [briefingOpen, setBriefingOpen] = useState(false);

  // Initialize theme from storage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('td_theme');
      if (savedTheme) {
        setDarkMode(savedTheme === 'dark');
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
      }
      const savedLang = localStorage.getItem('td_lang');
      if (savedLang) setLang(savedLang);
    } catch (e) {
      console.warn('Storage access restricted:', e);
    }
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      localStorage.setItem('td_theme', next ? 'dark' : 'light');
    } catch (e) {}
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    try {
      localStorage.setItem('td_lang', next);
    } catch (e) {}
  };

  // Fetch core data
  const fetchData = async () => {
    try {
      const [metaRes, wardsRes, facRes, leaksRes, briefRes] = await Promise.all([
        fetch('/api/v1/meta'),
        fetch('/api/v1/wards'),
        fetch('/api/v1/facilities'),
        fetch('/api/v1/leaks'),
        fetch('/api/v1/briefing')
      ]);

      if (metaRes.ok) setMeta(await metaRes.json());
      if (wardsRes.ok) setWards(await wardsRes.json());
      if (facRes.ok) setFacilities(await facRes.json());
      if (leaksRes.ok) setLeaks(await leaksRes.json());
      if (briefRes.ok) setBriefing(await briefRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (leakId, newStatus) => {
    try {
      const res = await fetch(`/api/v1/leaks/${leakId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/v1/demo/reset', { method: 'POST' });
      if (res.ok) {
        alert(lang === 'hi' ? 'डेमो स्थिति सफलतापूर्वक रीसेट की गई।' : 'Demo state reset successfully.');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to reset demo:', err);
    }
  };

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, en: 'Dashboard & Dispatch', hi: 'डैशबोर्ड (मानचित्र एवं कतार)' },
    { id: 'conditions', icon: CloudSun, en: 'Real Conditions', hi: 'वास्तविक मौसमी स्थिति' },
    { id: 'report', icon: FilePlus2, en: 'Report Leak', hi: 'रिसाव रिपोर्ट करें' },
    { id: 'data', icon: Database, en: 'Data & About', hi: 'डेटा उत्पत्ति एवं आर्किटेक्चर' },
  ];

  return (
    <div className={`app-shell min-h-screen flex flex-col ${darkMode ? 'dark bg-espresso text-cream' : 'bg-cream text-espresso'}`}>
      {/* Top Header */}
      <header className="app-header flex flex-wrap justify-between items-center gap-3">
        <div className="brand-lockup">
          <span className="brand-mark"><Droplets size={23} strokeWidth={2.2} /></span>
          <div>
            <h1 className="brand-title">
              {lang === 'hi' ? 'तृप्त-धारा (Tript-Dhara)' : 'Tript-Dhara'}
            </h1>
            <p className="brand-subtitle">
              {lang === 'hi'
                ? 'जल-गर्मी सुदृढ़ता एवं रिसाव प्राथमिकता प्रणाली (Ghaziabad NCR)'
                : 'Heat-Water Resilience & Smart Leak Prioritization'}
            </p>
          </div>
        </div>

        {/* Header Right Badges & Controls */}
        <div className="header-controls flex items-center flex-wrap gap-2 text-xs">
          <div className="hidden sm:inline-block">
            <ProvenanceBadge origin="REAL" timestamp="Live Telemetry" />
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={handleResetDemo}
            className="primary-control inline-flex items-center gap-2"
            title="Reset to repeatable fixed-seed demo state"
          >
            <RotateCcw size={15} /> {lang === 'hi' ? 'डेमो रीसेट' : 'Reset Demo'}
          </button>

          {/* Strands Briefing Modal Toggle */}
          <button
            onClick={() => setBriefingOpen(!briefingOpen)}
            className="primary-control inline-flex items-center gap-2"
          >
            <Sparkles size={15} /> {lang === 'hi' ? 'ऑपरेटर ब्रीफिंग' : 'Operator Briefing'}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5"
          >
            <Languages size={15} />
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5"
            title="Toggle Light / Dark Mode"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="app-nav" aria-label={lang === 'hi' ? 'मुख्य नेविगेशन' : 'Main navigation'}>
        {tabs.map(({ id, icon: Icon, en, hi }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={activeTab === id ? 'active-tab' : ''}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon size={16} strokeWidth={2} />
            {lang === 'hi' ? hi : en}
          </button>
        ))}
      </nav>

      {/* "How to Read this" Banner on first visit */}
      {showHowToRead && activeTab === 'dashboard' && (
        <div className="how-to-banner flex justify-between items-center text-xs">
          <div className="flex items-start gap-2">
            <Activity size={17} className="mt-0.5 shrink-0 text-mocha" />
            <span><strong>{lang === 'hi' ? 'डैशबोर्ड कैसे पढ़ें:' : 'How to read this system:'}</strong>{' '}
            {lang === 'hi'
              ? 'मानचित्र पर रंग वार्ड का वास्तविक हीट रिस्क (लू का खतरा) दर्शाते हैं। दाईं ओर दी गई कतार गणना किए गए प्राथमिकता स्कोर के आधार पर रिसावों को क्रमबद्ध करती है।'
              : 'Ward colors indicate real IMD-aligned Heat Risk. Leaks are dynamically prioritized by rate, population, vulnerability & heatwave severity.'}</span>
          </div>
          <button
            onClick={() => setShowHowToRead(false)}
            className="text-xs underline font-bold ml-2 cursor-pointer"
          >
            ✕ {lang === 'hi' ? 'बंद करें' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="app-main flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          className="page-transition"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Top Row: Map (Left) + Priority Queue (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: '520px' }}>
              <div className="dashboard-map-panel lg:col-span-7 h-[420px] lg:h-auto">
                <WardMap
                  wardsGeoJson={wards}
                  facilities={facilities}
                  leaks={leaks}
                  selectedLeak={selectedLeak}
                  onSelectLeak={(l) => setSelectedLeak(l)}
                  darkMode={darkMode}
                />
              </div>
              <div className="lg:col-span-5 h-[420px] lg:h-auto">
                <PriorityQueue
                  leaks={leaks}
                  selectedLeak={selectedLeak}
                  onSelectLeak={(l) => setSelectedLeak(l)}
                  onUpdateStatus={handleUpdateStatus}
                  allowStatusChange={meta?.feature_flags?.allow_public_status_changes}
                  lang={lang}
                />
              </div>
            </div>

            {/* Bottom Row: Before/After Impact Comparison Panel */}
            <ImpactPanel lang={lang} />
          </div>
        )}

        {activeTab === 'conditions' && <ConditionsPage lang={lang} />}
        {activeTab === 'report' && <ReportPage lang={lang} onReportSuccess={fetchData} />}
        {activeTab === 'data' && <DataPage lang={lang} />}
        </motion.div>
        </AnimatePresence>
      </main>

      {/* Operator Briefing Modal (Strands Agents SDK) */}
      {briefingOpen && briefing && (
        <motion.div
          className="fixed inset-0 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel max-w-2xl w-full p-6 text-espresso dark:text-cream shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start border-b border-latte pb-3">
              <div>
                <h3 className="text-lg font-bold">
                  <Sparkles size={18} className="inline text-mocha" /> {lang === 'hi' ? 'ऑपरेटर फील्ड ब्रीफिंग (AWS Strands Agents SDK)' : 'Operator Field Briefing (AWS Strands Agents SDK)'}
                </h3>
                <p className="text-xs opacity-75">
                  Generated by: <code>{briefing.provider}</code> ({briefing.model_id})
                </p>
              </div>
              <button
                onClick={() => setBriefingOpen(false)}
                className="rounded-lg border border-latte p-2 hover:bg-latte dark:hover:bg-mocha"
              >
                <X size={17} />
              </button>
            </div>

            <div className="my-4 p-4 border border-latte bg-latte/20 dark:bg-mocha/20 text-xs whitespace-pre-line leading-relaxed font-serif">
              {lang === 'hi' ? briefing.briefing_hi : briefing.briefing_en}
            </div>

            <div className="flex justify-between items-center text-[11px] opacity-75 pt-2 border-t border-latte">
              <span>{briefing.is_fallback ? 'Mode: Multilingual Template Engine' : 'Mode: Live Strands Agent'}</span>
              <button
                onClick={() => setBriefingOpen(false)}
                className="px-3 py-1 bg-mocha text-cream dark:bg-latte dark:text-espresso font-bold border border-espresso"
              >
                {lang === 'hi' ? 'स्वीकार करें' : 'Close Briefing'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="app-footer text-xs text-center flex flex-col sm:flex-row justify-between items-center gap-1">
        <span>Tript-Dhara MVP &copy; 2026 | AWS Environmental Hacks Track 02: Heat & Water</span>
        <span>Ghaziabad Municipal Resilience Telemetry</span>
      </footer>
    </div>
  );
}
