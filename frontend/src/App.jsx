import React, { useState, useEffect } from 'react';
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

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-espresso text-cream' : 'bg-cream text-espresso'}`}>
      {/* Top Header */}
      <header className="bg-latte dark:bg-mocha px-4 py-3 border-b border-latte flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {lang === 'hi' ? 'तृप्त-धारा (Tript-Dhara)' : 'Tript-Dhara'}
            </h1>
            <p className="text-xs italic opacity-90">
              {lang === 'hi'
                ? 'जल-गर्मी सुदृढ़ता एवं रिसाव प्राथमिकता प्रणाली (Ghaziabad NCR)'
                : 'Heat-Water Resilience & Smart Leak Prioritization'}
            </p>
          </div>
        </div>

        {/* Header Right Badges & Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="hidden sm:inline-block">
            <ProvenanceBadge origin="REAL" timestamp="Live Telemetry" />
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={handleResetDemo}
            className="px-2.5 py-1 bg-mocha text-cream dark:bg-latte dark:text-espresso border border-espresso font-bold hover:opacity-90"
            title="Reset to repeatable fixed-seed demo state"
          >
            🔄 {lang === 'hi' ? 'डेमो रीसेट' : 'Reset Demo'}
          </button>

          {/* Strands Briefing Modal Toggle */}
          <button
            onClick={() => setBriefingOpen(!briefingOpen)}
            className="px-2.5 py-1 bg-mocha text-cream dark:bg-latte dark:text-espresso border border-espresso font-bold hover:opacity-90"
          >
            ⚡ {lang === 'hi' ? 'ऑपरेटर ब्रीफिंग' : 'Operator Briefing'}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="px-2 py-1 bg-cream dark:bg-espresso text-espresso dark:text-cream border border-espresso font-bold"
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="px-2 py-1 bg-cream dark:bg-espresso text-espresso dark:text-cream border border-espresso font-bold"
            title="Toggle Light / Dark Mode"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-cream dark:bg-espresso border-b border-latte px-4 py-1.5 flex space-x-2 text-sm font-bold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1 border ${
            activeTab === 'dashboard'
              ? 'bg-mocha text-cream dark:bg-latte dark:text-espresso border-espresso'
              : 'border-transparent hover:border-latte'
          }`}
        >
          {lang === 'hi' ? 'डैशबोर्ड (मानचित्र एवं कतार)' : 'Dashboard & Dispatch'}
        </button>
        <button
          onClick={() => setActiveTab('conditions')}
          className={`px-3 py-1 border ${
            activeTab === 'conditions'
              ? 'bg-mocha text-cream dark:bg-latte dark:text-espresso border-espresso'
              : 'border-transparent hover:border-latte'
          }`}
        >
          {lang === 'hi' ? 'वास्तविक मौसमी स्थिति' : 'Real Conditions'}
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-3 py-1 border ${
            activeTab === 'report'
              ? 'bg-mocha text-cream dark:bg-latte dark:text-espresso border-espresso'
              : 'border-transparent hover:border-latte'
          }`}
        >
          {lang === 'hi' ? 'रिसाव रिपोर्ट करें' : 'Report Leak'}
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-3 py-1 border ${
            activeTab === 'data'
              ? 'bg-mocha text-cream dark:bg-latte dark:text-espresso border-espresso'
              : 'border-transparent hover:border-latte'
          }`}
        >
          {lang === 'hi' ? 'डेटा उत्पत्ति एवं आर्किटेक्चर' : 'Data & About'}
        </button>
      </nav>

      {/* "How to Read this" Banner on first visit */}
      {showHowToRead && activeTab === 'dashboard' && (
        <div className="bg-latte/30 dark:bg-mocha/30 border-b border-latte px-4 py-2 flex justify-between items-center text-xs">
          <div>
            <strong>💡 {lang === 'hi' ? 'डैशबोर्ड कैसे पढ़ें:' : 'How to read this system:'}</strong>{' '}
            {lang === 'hi'
              ? 'मानचित्र पर रंग वार्ड का वास्तविक हीट रिस्क (लू का खतरा) दर्शाते हैं। दाईं ओर दी गई कतार गणना किए गए प्राथमिकता स्कोर के आधार पर रिसावों को क्रमबद्ध करती है।'
              : 'Ward colors indicate real IMD-aligned Heat Risk. Leaks are dynamically prioritized by rate, population, vulnerability & heatwave severity.'}
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
      <main className="flex-1 p-3 md:p-4 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Top Row: Map (Left) + Priority Queue (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: '520px' }}>
              <div className="lg:col-span-7 border border-latte h-[420px] lg:h-auto">
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
      </main>

      {/* Operator Briefing Modal (Strands Agents SDK) */}
      {briefingOpen && briefing && (
        <div className="fixed inset-0 bg-espresso/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-cream dark:bg-espresso border-2 border-latte max-w-2xl w-full p-6 text-espresso dark:text-cream shadow-2xl">
            <div className="flex justify-between items-start border-b border-latte pb-3">
              <div>
                <h3 className="text-lg font-bold">
                  ⚡ {lang === 'hi' ? 'ऑपरेटर फील्ड ब्रीफिंग (AWS Strands Agents SDK)' : 'Operator Field Briefing (AWS Strands Agents SDK)'}
                </h3>
                <p className="text-xs opacity-75">
                  Generated by: <code>{briefing.provider}</code> ({briefing.model_id})
                </p>
              </div>
              <button
                onClick={() => setBriefingOpen(false)}
                className="text-lg font-bold px-2 border border-latte hover:bg-latte dark:hover:bg-mocha"
              >
                ✕
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
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-latte dark:bg-mocha px-4 py-2 border-t border-latte text-xs text-center flex flex-col sm:flex-row justify-between items-center gap-1">
        <span>Tript-Dhara MVP &copy; 2026 | AWS Environmental Hacks Track 02: Heat & Water</span>
        <span>Ghaziabad Municipal Resilience Telemetry</span>
      </footer>
    </div>
  );
}
