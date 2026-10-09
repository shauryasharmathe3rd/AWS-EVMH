import React, { useState, useEffect } from 'react';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const ConditionsPage = ({ lang = 'en' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/conditions')
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load conditions:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-espresso dark:text-cream">Loading real meteorological telemetry...</div>;
  }

  const weatherList = data?.weather_hourly || [];
  const current = weatherList[0] || {};
  const riverList = data?.river_discharge || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Current Real Weather Card */}
      <div className="bg-cream dark:bg-espresso border border-latte p-5 text-espresso dark:text-cream">
        <div className="flex justify-between items-start border-b border-latte pb-3">
          <div>
            <h2 className="text-xl font-bold">
              {lang === 'hi' ? 'वास्तविक मौसमी स्थिति एवं 48-घंटे का पूर्वानुमान' : 'Live Real Weather & 48-Hour Forecast'}
            </h2>
            <p className="text-xs opacity-80">
              {lang === 'hi'
                ? 'ओपन-मेटियो मौसम पूर्वानुमान API से वास्तविक लाइव डेटा'
                : 'Direct hourly telemetry from Open-Meteo High Resolution Model'}
            </p>
          </div>
          <ProvenanceBadge origin="REAL" sourceName="Open-Meteo" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-3 border border-latte bg-latte/20 dark:bg-mocha/20">
            <span className="text-xs opacity-75">{lang === 'hi' ? 'तापमान:' : 'Temperature:'}</span>
            <div className="text-2xl font-bold">{current.temperature_c ?? '--'}°C</div>
            <span className="text-[11px] opacity-75">{lang === 'hi' ? 'महसूस:' : 'Feels like:'} {current.apparent_temperature_c ?? '--'}°C</span>
          </div>
          <div className="p-3 border border-latte bg-latte/20 dark:bg-mocha/20">
            <span className="text-xs opacity-75">{lang === 'hi' ? 'आर्द्रता:' : 'Relative Humidity:'}</span>
            <div className="text-2xl font-bold">{current.relative_humidity_pct ?? '--'}%</div>
          </div>
          <div className="p-3 border border-latte bg-latte/20 dark:bg-mocha/20">
            <span className="text-xs opacity-75">{lang === 'hi' ? 'वर्षा (24h):' : 'Precipitation:'}</span>
            <div className="text-2xl font-bold">{current.precipitation_mm ?? 0} mm</div>
          </div>
          <div className="p-3 border border-latte bg-latte/20 dark:bg-mocha/20">
            <span className="text-xs opacity-75">{lang === 'hi' ? 'मृदा नमी:' : 'Soil Moisture:'}</span>
            <div className="text-2xl font-bold">{current.soil_moisture_m3m3 ?? 0.2} m³/m³</div>
          </div>
        </div>

        {/* 24-Hour Forecast Timeline */}
        <div className="mt-6">
          <h4 className="text-sm font-bold mb-2">
            {lang === 'hi' ? 'आगामी 24 घंटे का तापमान व वाष्पोत्सर्जन (ET0) प्रोफाइल:' : '24-Hour Hourly Temperature & Evapotranspiration Profile:'}
          </h4>
          <div className="overflow-x-auto border border-latte">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-latte dark:bg-mocha border-b border-latte">
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'समय' : 'Time'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'तापमान' : 'Temp (°C)'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'महसूस' : 'Apparent (°C)'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'आर्द्रता' : 'Humidity (%)'}</th>
                  <th className="p-2 border-r border-latte">{lang === 'hi' ? 'वर्षा' : 'Rain (mm)'}</th>
                  <th className="p-2">{lang === 'hi' ? 'डेटा स्रोत' : 'Provenance'}</th>
                </tr>
              </thead>
              <tbody>
                {weatherList.slice(0, 16).map((w, idx) => (
                  <tr key={idx} className="border-b border-latte/40 hover:bg-latte/20 dark:hover:bg-mocha/20">
                    <td className="p-2 border-r border-latte/40">{new Date(w.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-2 border-r border-latte/40 font-bold">{w.temperature_c}°C</td>
                    <td className="p-2 border-r border-latte/40">{w.apparent_temperature_c}°C</td>
                    <td className="p-2 border-r border-latte/40">{w.relative_humidity_pct}%</td>
                    <td className="p-2 border-r border-latte/40">{w.precipitation_mm}</td>
                    <td className="p-2"><ProvenanceBadge origin={w.data_origin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* River Discharge & Flood Outlook Card */}
      <div className="bg-cream dark:bg-espresso border border-latte p-5 text-espresso dark:text-cream">
        <div className="flex justify-between items-start border-b border-latte pb-3">
          <div>
            <h3 className="text-lg font-bold">
              {lang === 'hi' ? 'नदी जल प्रवाह एवं बाढ़ जोखिम आउटलुक' : 'River Discharge & Flood Outlook'}
            </h3>
            <p className="text-xs opacity-80">
              {lang === 'hi'
                ? 'ओपन-मेटियो फ्लड API एवं कोपरनिकस EMS मॉडल टेलीमेट्री'
                : 'Copernicus Global Flood Awareness System (GloFAS) via Open-Meteo Flood API'}
            </p>
          </div>
          <ProvenanceBadge origin="REAL" sourceName="Open-Meteo Flood" />
        </div>

        <div className="mt-4 space-y-3">
          {riverList.map((r, i) => (
            <div key={i} className="p-3 border border-latte flex justify-between items-center bg-latte/15 dark:bg-mocha/15">
              <div>
                <h4 className="font-bold text-sm">{r.river_name}</h4>
                <p className="text-xs opacity-75">
                  {lang === 'hi' ? 'मापन समय:' : 'Recorded:'} {new Date(r.recorded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{r.discharge_m3s} m³/s</div>
                <span className="text-xs px-2 py-0.5 border border-latte bg-latte dark:bg-mocha font-semibold">
                  {lang === 'hi' ? 'जोखिम:' : 'Risk:'} {r.flood_risk_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Government Portals Linkout */}
      <div className="bg-cream dark:bg-espresso border border-latte p-4 text-espresso dark:text-cream flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm">
            {lang === 'hi' ? 'केंद्रीय भूजल बोर्ड (CGWB) एवं India-WRIS पोर्टल' : 'India-WRIS / Central Ground Water Board Telemetry'}
          </h4>
          <p className="text-xs opacity-75">
            {lang === 'hi'
              ? 'आधिकारिक राष्ट्रीय जल संसाधन सूचना प्रणाली डैशबोर्ड का अवलोकन करें'
              : 'Direct link-out to official national telemetry for groundwater aquifers & reservoirs'}
          </p>
        </div>
        <a
          href="https://indiawris.gov.in/wris/"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 text-xs bg-mocha text-cream dark:bg-latte dark:text-espresso border border-espresso font-bold"
        >
          {lang === 'hi' ? 'पोर्टल खोलें ↗' : 'Open Dashboard ↗'}
        </a>
      </div>
    </div>
  );
};
