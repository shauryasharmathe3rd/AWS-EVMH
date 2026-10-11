import React from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';

export const WardMap = ({ wardsGeoJson, facilities, leaks, selectedLeak, onSelectLeak, darkMode }) => {
  const getWardStyle = (feature) => {
    const risk = feature.properties.heat_risk_class || 'Low';
    let fillColor = '#F5ECDC';

    if (!darkMode) {
      if (risk === 'Extreme') fillColor = '#2E1F14';
      else if (risk === 'High') fillColor = '#8B5E3C';
      else if (risk === 'Moderate') fillColor = '#D9C3A0';
      else fillColor = '#F5ECDC';
    } else {
      if (risk === 'Extreme') fillColor = '#F5ECDC';
      else if (risk === 'High') fillColor = '#D9C3A0';
      else if (risk === 'Moderate') fillColor = '#8B5E3C';
      else fillColor = '#2E1F14';
    }

    return {
      fillColor: fillColor,
      weight: 2,
      opacity: 1,
      color: darkMode ? '#D9C3A0' : '#2E1F14',
      fillOpacity: 0.65,
    };
  };

  const onEachWard = (ward, layer) => {
    layer.bindPopup(`
      <div style="font-family: Inter, system-ui, sans-serif; padding: 4px;">
        <h4 style="font-weight: bold; margin: 0 0 4px 0; font-size: 15px;">${ward.properties.ward_name} (${ward.properties.ward_number})</h4>
        <p style="margin: 2px 0;"><strong>Population:</strong> ${ward.properties.population?.toLocaleString()}</p>
        <p style="margin: 2px 0;"><strong>Heat Risk Class:</strong> ${ward.properties.heat_risk_class} (${ward.properties.heat_risk_score})</p>
        <p style="margin: 2px 0;"><strong>Vulnerability Score:</strong> ${ward.properties.vulnerability_score}</p>
        <p style="margin: 2px 0; font-size: 11px;"><em>Origin: ${ward.properties.data_origin}</em></p>
      </div>
    `);
  };

  const getFacilityColor = (type) => {
    if (type === 'hospital' || type === 'clinic') return '#A94F38';
    if (type === 'drinking_water' || type === 'water_tower') return '#2E1F14';
    return '#D9C3A0';
  };

  return (
    <div className={`h-full w-full relative ${darkMode ? 'dark-mode-map' : 'light-mode-map'}`}>
      <MapContainer
        center={[28.6345839, 77.4477459]}
        zoom={12}
        style={{ height: '100%', width: '100%', backgroundColor: darkMode ? '#2E1F14' : '#F5ECDC' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Wards GeoJSON Polygons */}
        {wardsGeoJson && wardsGeoJson.features && (
          <GeoJSON
            key={darkMode ? 'dark-wards' : 'light-wards'}
            data={wardsGeoJson}
            style={getWardStyle}
            onEachFeature={onEachWard}
          />
        )}

        {/* Facilities Points */}
        {facilities.map((fac) => (
          <CircleMarker
            key={`fac-${fac.id}`}
            center={[fac.lat, fac.lon]}
            radius={5}
            pathOptions={{
              fillColor: darkMode ? '#F5ECDC' : getFacilityColor(fac.facility_type),
              color: darkMode ? '#D9C3A0' : '#2E1F14',
              weight: 1.5,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <strong style={{ fontSize: '14px' }}>{fac.name}</strong>
                <p style={{ margin: '2px 0', fontSize: '12px' }}>Type: {fac.facility_type}</p>
                <span style={{ fontSize: '10px' }}>REAL (OSM)</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Leaks Sized by LPM */}
        {leaks.map((leak) => {
          const isSelected = selectedLeak && selectedLeak.id === leak.id;
          const radius = Math.max(6, Math.min(18, Math.sqrt(leak.leak_size_lpm) * 1.5));
          return (
            <CircleMarker
              key={`leak-${leak.id}`}
              center={[leak.lat, leak.lon]}
              radius={radius}
              pathOptions={{
                fillColor: leak.data_origin === 'REAL' ? '#A94F38' : '#D9C3A0',
                color: isSelected ? '#8B5E3C' : (darkMode ? '#F5ECDC' : '#2E1F14'),
                weight: isSelected ? 3 : 1.5,
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => onSelectLeak(leak),
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{leak.title}</h4>
                  <p style={{ margin: '2px 0' }}><strong>Priority Score:</strong> {leak.priority_score}</p>
                  <p style={{ margin: '2px 0' }}><strong>Estimated Rate:</strong> {leak.leak_size_lpm} LPM ({leak.size_class})</p>
                  <p style={{ margin: '2px 0' }}><strong>Status:</strong> {leak.status}</p>
                  <p style={{ margin: '2px 0', fontSize: '11px' }}><em>Origin: {leak.data_origin}</em></p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
