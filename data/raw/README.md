# Raw Data Directory for Tript-Dhara

Place optional local datasets in these folders:

1. `wards.geojson`: Optional GeoJSON representing municipal administrative wards. If not provided, the system fetches administrative boundaries from OpenStreetMap for the configured city or generates a labeled municipal ward partition.
2. `population/`: Optional WorldPop India 100m GeoTIFF clipped to city bbox. If not provided, `scripts/fetch_worldpop.py` downloads it or uses population estimates derived from OSM building footprints and census statistics.
3. `utility/`: Optional utility CSV containing flow, pressure, or historical leak records (`timestamp,zone_id,flow_m3h,pressure_bar,leak_flag`).
4. `battledim/`: Optional BattLeDIM benchmark dataset files for validation of leak detection algorithms.
