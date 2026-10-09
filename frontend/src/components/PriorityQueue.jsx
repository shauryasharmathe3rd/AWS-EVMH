import React from 'react';
import { ProvenanceBadge } from './ProvenanceBadge';

export const PriorityQueue = ({ leaks, selectedLeak, onSelectLeak, onUpdateStatus, allowStatusChange, lang = 'en' }) => {
  return (
    <div className="flex flex-col h-full bg-cream dark:bg-espresso text-espresso dark:text-cream border border-latte overflow-hidden">
      <div className="bg-latte dark:bg-mocha px-4 py-2 border-b border-latte flex justify-between items-center">
        <h3 className="text-base font-bold tracking-wide">
          {lang === 'hi' ? 'लीक प्राथमिकता कतार (रैंकिंग)' : 'Leak Priority Queue (Ranked)'}
        </h3>
        <span className="text-xs italic">
          {leaks.length} {lang === 'hi' ? 'सक्रिय घटनाएं' : 'open incidents'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {leaks.map((leak, idx) => {
          const isSelected = selectedLeak && selectedLeak.id === leak.id;
          return (
            <div
              key={leak.id}
              onClick={() => onSelectLeak(leak)}
              className={`p-3 border cursor-pointer transition-all ${
                isSelected
                  ? 'border-mocha dark:border-latte bg-latte/40 dark:bg-mocha/40'
                  : 'border-latte/70 hover:border-mocha dark:hover:border-latte bg-cream dark:bg-espresso'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-6 h-6 leading-6 text-center font-bold bg-mocha text-cream dark:bg-latte dark:text-espresso text-xs">
                    #{idx + 1}
                  </span>
                  <h4 className="font-bold text-sm leading-tight">{leak.title}</h4>
                </div>
                <ProvenanceBadge origin={leak.data_origin} />
              </div>

              <div className="mt-2 text-xs grid grid-cols-2 gap-1 border-t border-latte/40 pt-1">
                <div>
                  <span className="opacity-75">{lang === 'hi' ? 'वार्ड:' : 'Ward:'}</span> {leak.ward_name || 'Central'}
                </div>
                <div>
                  <span className="opacity-75">{lang === 'hi' ? 'रिसाव दर:' : 'Flow Rate:'}</span> <strong>{leak.leak_size_lpm} LPM</strong>
                </div>
                <div>
                  <span className="opacity-75">{lang === 'hi' ? 'प्रभावित आबादी:' : 'Affected Pop:'}</span> {leak.affected_population.toLocaleString()}
                </div>
                <div>
                  <span className="opacity-75">{lang === 'hi' ? 'स्थिति:' : 'Status:'}</span> <strong className="uppercase">{leak.status}</strong>
                </div>
              </div>

              {/* Priority Breakdown Bar */}
              <div className="mt-2 pt-2 border-t border-latte/50">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold">{lang === 'hi' ? 'प्राथमिकता स्कोर:' : 'Priority Score:'} {leak.priority_score}</span>
                  <span className="text-[10px] opacity-75">leak * ln(pop) * (1+v) * (1+h)</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                  <div className="bg-latte dark:bg-mocha py-0.5 border border-espresso/20" title="Leak Size Component">
                    Size: {leak.score_breakdown?.leak_size_part}
                  </div>
                  <div className="bg-latte dark:bg-mocha py-0.5 border border-espresso/20" title="Population Factor">
                    Pop: {leak.score_breakdown?.pop_part}
                  </div>
                  <div className="bg-latte dark:bg-mocha py-0.5 border border-espresso/20" title="Vulnerability Factor">
                    Vuln: {leak.score_breakdown?.vuln_part}
                  </div>
                  <div className="bg-latte dark:bg-mocha py-0.5 border border-espresso/20" title="Heat Risk Factor">
                    Heat: {leak.score_breakdown?.heat_part}
                  </div>
                </div>
              </div>

              {allowStatusChange && leak.status === 'open' && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(leak.id, 'repaired');
                    }}
                    className="px-2 py-1 text-xs bg-mocha text-cream dark:bg-latte dark:text-espresso border border-espresso hover:opacity-90"
                  >
                    {lang === 'hi' ? 'मरम्मत पूर्ण चिह्नित करें' : 'Mark Repaired'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
