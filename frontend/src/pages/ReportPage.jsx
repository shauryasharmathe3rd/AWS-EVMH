import React, { useState } from 'react';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const ReportPage = ({ lang = 'en', onReportSuccess }) => {
  const [lat, setLat] = useState(28.63458);
  const [lon, setLon] = useState(77.44774);
  const [sizeClass, setSizeClass] = useState('steady');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(6)));
          setLon(parseFloat(pos.coords.longitude.toFixed(6)));
        },
        (err) => {
          console.warn("Geolocation denied/unavailable, keeping selected coords.");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('lat', lat);
    formData.append('lon', lon);
    formData.append('size_class', sizeClass);
    if (description) formData.append('description', description);
    if (photo) formData.append('photo', photo);

    // Client idempotency key for network resilience
    const idempotencyKey = `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to submit leak report.');
      }

      const resData = await res.json();
      setResult(resData);
      if (onReportSuccess) onReportSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-cream dark:bg-espresso text-espresso dark:text-cream border border-latte p-6">
      <div className="border-b border-latte pb-3 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">
            {lang === 'hi' ? 'जल रिसाव / पाइप टूटने की रिपोर्ट करें' : 'Citizen Leak Report (Anonymous)'}
          </h2>
          <p className="text-xs opacity-80 mt-1">
            {lang === 'hi'
              ? 'आपकी रिपोर्ट तत्काल तृप्त-धारा प्राथमिकता कतार में उच्च प्राथमिकता पर दर्ज होगी'
              : 'Anonymous submission directly creates a REAL leak incident in the priority dispatch queue.'}
          </p>
        </div>
        <ProvenanceBadge origin="REAL" />
      </div>

      {result ? (
        <div className="mt-6 p-4 border border-mocha dark:border-latte bg-latte/30 dark:bg-mocha/30 space-y-2">
          <h3 className="font-bold text-base">
            ✅ {lang === 'hi' ? 'रिपोर्ट सफलतापूर्वक दर्ज की गई!' : 'Leak Report Successfully Registered!'}
          </h3>
          <p className="text-xs">
            {lang === 'hi' ? 'रिपोर्ट आईडी:' : 'Report ID:'} <code>{result.report_id}</code>
          </p>
          <p className="text-xs">
            {lang === 'hi' ? 'गणना किया गया प्राथमिकता स्कोर:' : 'Calculated Priority Score:'} <strong>{result.priority_score}</strong>
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setResult(null);
                setDescription('');
                setPhoto(null);
              }}
              className="px-3 py-1.5 bg-mocha text-cream dark:bg-latte dark:text-espresso text-xs font-bold border border-espresso"
            >
              {lang === 'hi' ? 'एक और रिपोर्ट दर्ज करें' : 'Submit Another Report'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="p-3 border border-red-700 bg-red-100 text-red-900 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Coordinates & GPS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold">
                {lang === 'hi' ? 'स्थान निर्देशांक (अक्षांश / देशांतर):' : 'Location Coordinates (Lat / Lon):'}
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                className="text-xs px-2 py-0.5 bg-latte dark:bg-mocha border border-espresso/40"
              >
                📍 {lang === 'hi' ? 'वर्तमान GPS लें' : 'Use Current GPS'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="p-2 border border-latte bg-cream dark:bg-espresso text-xs"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="any"
                required
                value={lon}
                onChange={(e) => setLon(parseFloat(e.target.value))}
                className="p-2 border border-latte bg-cream dark:bg-espresso text-xs"
                placeholder="Longitude"
              />
            </div>
          </div>

          {/* Size class */}
          <div className="space-y-1">
            <label className="text-xs font-bold">
              {lang === 'hi' ? 'रिसाव का प्रकार / गंभीरता:' : 'Leak Severity / Flow Estimate:'}
            </label>
            <select
              value={sizeClass}
              onChange={(e) => setSizeClass(e.target.value)}
              className="w-full p-2 border border-latte bg-cream dark:bg-espresso text-xs"
            >
              <option value="drip">{lang === 'hi' ? 'हल्की बूंद-बूंद / टपकना (~5 लीटर/मिनट)' : 'Minor Drip / Seepage (~5 LPM)'}</option>
              <option value="steady">{lang === 'hi' ? 'मध्यम निरंतर प्रवाह (~40 लीटर/मिनट)' : 'Steady Flow / Joint Crack (~40 LPM)'}</option>
              <option value="burst">{lang === 'hi' ? 'बड़ा पाइप फटना / तीव्र जलधारा (~250 लीटर/मिनट)' : 'Major Main Burst / High Pressure (~250 LPM)'}</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold">
              {lang === 'hi' ? 'विवरण / स्थल विवरण:' : 'Description / Landmark Details:'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-latte bg-cream dark:bg-espresso text-xs"
              placeholder={lang === 'hi' ? 'उदा. अस्पताल के मुख्य गेट के पास सड़क पर जलभराव...' : 'e.g., Near District Civil Hospital gate, continuous clean water pooling...'}
            />
          </div>

          {/* Photo */}
          <div className="space-y-1">
            <label className="text-xs font-bold">
              {lang === 'hi' ? 'फोटो अपलोड (वैकल्पिक, EXIF मेटाडेटा स्वतः हटाया जाएगा):' : 'Photo Upload (Optional, EXIF stripped for privacy):'}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="w-full p-2 border border-latte bg-cream dark:bg-espresso text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-mocha text-cream dark:bg-latte dark:text-espresso font-bold text-sm border border-espresso hover:opacity-90 transition-opacity"
            >
              {submitting
                ? (lang === 'hi' ? 'जमा किया जा रहा है...' : 'Submitting Report...')
                : (lang === 'hi' ? 'रिसाव रिपोर्ट जमा करें' : 'Submit Leak Report')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
