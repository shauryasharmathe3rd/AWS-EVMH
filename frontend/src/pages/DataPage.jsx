import React, { useState, useEffect } from 'react';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const DataPage = ({ lang = 'en' }) => {
  const [dataStatus, setDataStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/meta/data-status')
      .then((res) => res.json())
      .then((res) => {
        setDataStatus(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data status:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-espresso dark:text-cream">
      {/* Overview & Provenance Summary */}
      <div className="bg-cream dark:bg-espresso border border-latte p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-latte pb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold">
              {lang === 'hi' ? 'डेटा उत्पत्ति, स्रोत एवं आर्किटेक्चर (Data Provenance)' : 'Data Provenance & System Architecture'}
            </h2>
            <p className="text-xs opacity-80 mt-1">
              {lang === 'hi'
                ? 'तृप्त-धारा वास्तविक डेटा को सर्वोच्च प्राथमिकता देती है। प्रत्येक डेटा बिंदु अपनी प्रामाणिकता प्रदर्शित करता है।'
                : 'Tript-Dhara prioritizes REAL physical & civic data. Every record displays strict provenance.'}
            </p>
          </div>
          {dataStatus && (
            <div className="bg-latte/40 dark:bg-mocha/40 px-3 py-1.5 border border-latte text-xs font-bold">
              {lang === 'hi' ? 'वास्तविक / व्युत्पन्न कवरेज:' : 'Real / Derived Data Coverage:'}{' '}
              <span className="text-base font-bold">{dataStatus.coverage_real_derived_pct}%</span>
            </div>
          )}
        </div>

        {/* Provenance Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-2 border border-latte bg-latte/20 dark:bg-mocha/20 space-y-1">
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 bg-mocha text-cream dark:bg-latte dark:text-espresso font-bold text-[10px]">REAL</span>
            </div>
            <p className="text-[11px] opacity-80">
              {lang === 'hi' ? 'सत्यापित वास्तविक स्रोत (Open-Meteo, OSM, नागरिक रिपोर्ट)' : 'Real physical sources (Open-Meteo, OSM, Citizen Reports)'}
            </p>
          </div>
          <div className="p-2 border border-latte bg-latte/20 dark:bg-mocha/20 space-y-1">
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 border border-mocha dark:border-latte font-bold text-[10px]">DERIVED</span>
            </div>
            <p className="text-[11px] opacity-80">
              {lang === 'hi' ? 'वास्तविक इनपुट से गणितीय/भौगोलिक सूत्रों द्वारा संगणित' : 'Formulas calculated directly from REAL inputs (Heat risk, priority)'}
            </p>
          </div>
          <div className="p-2 border border-latte bg-latte/20 dark:bg-mocha/20 space-y-1">
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 border border-dashed border-espresso dark:border-cream font-bold text-[10px]">BENCHMARK</span>
            </div>
            <p className="text-[11px] opacity-80">
              {lang === 'hi' ? 'प्रकाशित अकादमिक डेटासेट (BattLeDIM Zenodo)' : 'Published scientific research datasets (BattLeDIM)'}
            </p>
          </div>
          <div className="p-2 border border-latte bg-latte/20 dark:bg-mocha/20 space-y-1">
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 bg-latte dark:bg-mocha border border-dotted border-espresso font-bold text-[10px]">SIMULATED</span>
            </div>
            <p className="text-[11px] opacity-80">
              {lang === 'hi' ? 'नियत-बीज (Fixed seed 42) डेमो परिदृश्य' : 'Fixed-seed (Seed 42) repeatable scenarios for jury demo'}
            </p>
          </div>
        </div>

        {/* Sources Table */}
        <div className="mt-6">
          <h3 className="text-sm font-bold mb-2">
            {lang === 'hi' ? 'डेटा स्रोत रजिस्ट्री एवं स्थिति:' : 'Active Data Feeds Registry & Health:'}
          </h3>
          <div className="overflow-x-auto border border-latte">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-latte dark:bg-mocha border-b border-latte">
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'स्रोत नाम' : 'Source'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'उत्पत्ति' : 'Provenance'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'रिकॉर्ड संख्या' : 'Records'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'लाइसेंस' : 'License'}</th>
                  <th className="p-2">{lang === 'hi' ? 'श्रेय / एट्रिब्यूशन' : 'Attribution'}</th>
                </tr>
              </thead>
              <tbody>
                {dataStatus?.data_sources?.map((s) => (
                  <tr key={s.id} className="border-b border-latte/40 hover:bg-latte/15 dark:hover:bg-mocha/15">
                    <td className="p-2 border-r border-latte/40 font-bold">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                          {s.name}
                        </a>
                      ) : (
                        s.name
                      )}
                    </td>
                    <td className="p-2 border-r border-latte/40">
                      <ProvenanceBadge origin={s.provenance} />
                    </td>
                    <td className="p-2 border-r border-latte/40 font-bold">
                      <span className="px-1 py-0.5 bg-latte dark:bg-mocha border border-espresso/20">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-2 border-r border-latte/40">{s.record_count}</td>
                    <td className="p-2 border-r border-latte/40">{s.license || 'Open'}</td>
                    <td className="p-2 text-[11px] opacity-80">{s.attribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AWS Open-Source & Container Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-cream dark:bg-espresso border border-latte p-5">
          <h3 className="text-base font-bold border-b border-latte pb-2 mb-3">
            {lang === 'hi' ? 'AWS ओपन-सोर्स टूल कार्यान्वयन' : 'AWS Open-Source Tool Integration'}
          </h3>
          <p className="text-xs leading-relaxed mb-3">
            {lang === 'hi'
              ? 'तृप्त-धारा AWS के आधिकारिक ओपन-सोर्स Strands Agents SDK का उपयोग करके आपातकालीन जल-गर्मी रिसाव प्राथमिकता रिपोर्ट को बहुभाषी ऑपरेटर ब्रीफिंग में परिवर्तित करती है।'
              : 'Tript-Dhara integrates the official AWS open-source Strands Agents SDK in the backend service to generate intelligent operator dispatch briefings from real-time spatial priority data.'}
          </p>
          <ul className="text-xs space-y-2 list-disc list-inside opacity-90">
            <li><strong>AWS Tool:</strong> Strands Agents SDK (Python)</li>
            <li><strong>Module Path:</strong> <code>backend/app/strands_service.py</code></li>
            <li><strong>Role:</strong> Autonomous synthesis of top incident vectors & heat warnings</li>
            <li><strong>Fallback Guarantee:</strong> Seamless multilingual template fallback when offline</li>
          </ul>
        </div>

        <div className="bg-cream dark:bg-espresso border border-latte p-5">
          <h3 className="text-base font-bold border-b border-latte pb-2 mb-3">
            {lang === 'hi' ? 'कंटेनर संरचना (Docker Compose)' : 'Containerized Architecture'}
          </h3>
          <p className="text-xs leading-relaxed mb-3">
            5 isolated microservice containers orchestrated via Docker Compose:
          </p>
          <ul className="text-xs space-y-1.5 opacity-90">
            <li><strong>1. Gateway:</strong> Nginx reverse proxy on edge network with rate limiting</li>
            <li><strong>2. Frontend:</strong> Multi-stage build served securely with Nginx</li>
            <li><strong>3. Backend:</strong> Lean FastAPI uvicorn application for high-speed API</li>
            <li><strong>4. Worker:</strong> Geospatial & ML daemon (GeoPandas, OSMnx, Scikit-Learn)</li>
            <li><strong>5. Database:</strong> PostGIS PostgreSQL spatial database on internal network</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
