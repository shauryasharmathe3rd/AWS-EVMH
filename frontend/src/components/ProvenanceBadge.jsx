import React from 'react';

export const ProvenanceBadge = ({ origin, timestamp, sourceName }) => {
  // Provenance styling:
  // REAL: solid filled badge
  // DERIVED: outlined badge
  // BENCHMARK: dashed outline
  // SIMULATED: diagonal-hatch badge with the word "SIMULATED"
  let badgeStyle = "inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-none ";

  if (origin === 'REAL') {
    badgeStyle += "bg-mocha text-cream dark:bg-latte dark:text-espresso border border-espresso dark:border-latte";
  } else if (origin === 'DERIVED') {
    badgeStyle += "bg-transparent text-espresso dark:text-cream border border-mocha dark:border-latte";
  } else if (origin === 'BENCHMARK') {
    badgeStyle += "bg-transparent text-espresso dark:text-cream border border-dashed border-espresso dark:border-cream";
  } else {
    badgeStyle += "bg-latte text-espresso dark:bg-mocha dark:text-cream border border-dotted border-espresso";
  }

  return (
    <span className={badgeStyle} title={`Provenance: ${origin}${sourceName ? ' - ' + sourceName : ''}`}>
      {origin === 'SIMULATED' ? '⚠️ SIMULATED' : origin}
      {timestamp && <span className="ml-1 opacity-80 text-[10px]">({timestamp})</span>}
    </span>
  );
};
