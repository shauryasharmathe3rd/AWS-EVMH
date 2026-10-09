import React, { useState, useEffect } from 'react';
import { ProvenanceBadge } from './ProvenanceBadge';

export const ImpactPanel = ({ lang = 'en' }) => {
  const [crewHours, setCrewHours] = useState(4.0);
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSimulation = async (hours) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/impact/simulate?repair_crew_hours=${hours}`);
      if (res.ok) {
        const data = await res.json();
        setImpactData(data);
      }
    } catch (err) {
      console.error("Impact simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation(crewHours);
  }, [crewHours]);

  return (
    <div className="bg-cream dark:bg-espresso text-espresso dark:text-cream border border-latte p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-latte gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold">
              {lang === 'hi' ? 'मरम्मत प्रभाव विश्लेषण (तुलना मॉडल)' : 'Before / After Repair Impact Panel'}
            </h3>
            <ProvenanceBadge origin="DERIVED" />
          </div>
          <p className="text-xs opacity-80">
            {lang === 'hi'
              ? 'शिकायत क्रम (पारंपरिक) बनाम तृप्त-धारा प्राथमिकता क्रम की तुलना'
              : 'Compare: "Fix in complaint order" vs "Fix in Tript-Dhara priority order" for top 5 incidents'}
          </p>
        </div>

        {/* Crew hours slider */}
        <div className="flex items-center space-x-3 bg-latte/30 dark:bg-mocha/30 px-3 py-1.5 border border-latte">
          <label className="text-xs font-bold whitespace-nowrap">
            {lang === 'hi' ? 'मरम्मत समय / रिसाव:' : 'Crew Repair Time:'} {crewHours}h
          </label>
          <input
            type="range"
            min="1"
            max="12"
            step="0.5"
            value={crewHours}
            onChange={(e) => setCrewHours(parseFloat(e.target.value))}
            className="w-24 cursor-pointer accent-mocha dark:accent-latte"
          />
        </div>
      </div>

      {impactData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {/* Key Metric 1: Liters Saved */}
          <div className="p-3 border border-latte bg-latte/20 dark:bg-mocha/20 flex flex-col justify-between">
            <span className="text-xs font-semibold">
              {lang === 'hi' ? 'अनुमानित जल बचत' : 'Potable Water Saved'}
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold tracking-tight">
                {impactData.liters_saved.toLocaleString()} L
              </span>
              <p className="text-[11px] opacity-75 mt-0.5">
                {lang === 'hi' ? 'शीर्ष 5 रिसावों के त्वरित निवारण से' : 'by prioritizing critical bursts first'}
              </p>
            </div>
            <div className="text-[10px] border-t border-latte/50 pt-1 flex justify-between">
              <span>Baseline: {impactData.baseline_liters_lost.toLocaleString()} L</span>
              <span>TD: {impactData.tript_dhara_liters_lost.toLocaleString()} L</span>
            </div>
          </div>

          {/* Key Metric 2: Vulnerable Pop Protected */}
          <div className="p-3 border border-latte bg-latte/20 dark:bg-mocha/20 flex flex-col justify-between">
            <span className="text-xs font-semibold">
              {lang === 'hi' ? 'संवेदनशील नागरिक सुरक्षा (24h)' : 'Vulnerable Protected (24h)'}
            </span>
            <div className="my-2">
              <span className="text-2xl font-bold tracking-tight">
                +{impactData.additional_vulnerable_protected.toLocaleString()}
              </span>
              <p className="text-[11px] opacity-75 mt-0.5">
                {lang === 'hi' ? 'अस्पताल व घनी आबादी वाले वार्डों में' : 'people near hospitals & high-risk wards'}
              </p>
            </div>
            <div className="text-[10px] border-t border-latte/50 pt-1 flex justify-between">
              <span>Base: {impactData.baseline_vulnerable_protected.toLocaleString()}</span>
              <span>TD: {impactData.tript_dhara_vulnerable_protected.toLocaleString()}</span>
            </div>
          </div>

          {/* Order Comparison Column 1: Baseline */}
          <div className="border border-latte p-2 text-xs">
            <span className="font-bold block border-b border-latte pb-1 mb-1">
              1. {lang === 'hi' ? 'शिकायत क्रम (पुराना तरीका)' : 'Complaint Order (Baseline)'}
            </span>
            <div className="space-y-1 overflow-y-auto max-h-24">
              {impactData.baseline_order.map((item, i) => (
                <div key={`b-${i}`} className="truncate text-[11px]">
                  #{i + 1} {item.title} ({item.leak_size_lpm} LPM)
                </div>
              ))}
            </div>
          </div>

          {/* Order Comparison Column 2: Tript-Dhara */}
          <div className="border border-mocha dark:border-latte p-2 text-xs bg-latte/40 dark:bg-mocha/40">
            <span className="font-bold block border-b border-mocha dark:border-latte pb-1 mb-1">
              2. {lang === 'hi' ? 'तृप्त-धारा प्राथमिकता क्रम' : 'Tript-Dhara Priority Order'}
            </span>
            <div className="space-y-1 overflow-y-auto max-h-24">
              {impactData.tript_dhara_order.map((item, i) => (
                <div key={`td-${i}`} className="truncate font-semibold text-[11px]">
                  #{i + 1} {item.title} (Score: {item.priority_score})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
