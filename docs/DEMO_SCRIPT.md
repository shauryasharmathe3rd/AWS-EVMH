# 3-Minute Demonstration Shot List & Script
**Project:** Tript-Dhara (AWS Environmental Hacks Track 02: Heat and Water)

---

### [00:00 - 00:20] Act 1: The Problem & The Core Question
- **Visual:** Open Dashboard (`http://localhost:8080`) in clean light mode.
- **Narrator (20s):** "During extreme heatwaves, water utilities face dozens of pipe bursts simultaneously. The status quo is fixing leaks in the order complaints arrive. But what if a major pipe is flooding an empty lot while a hospital ward is running dry? Tript-Dhara is an open municipal intelligence platform that answers one critical question: *Which leak must we fix first to save lives and save water?*"

---

### [00:20 - 01:10] Act 2: Real Data & Municipal Heat Map
- **Visual:** Pan across the Leaflet Map. Click on a ward polygon to display the popup showing real temperature risk and population density. Highlight hospital and water tower icons.
- **Narrator (50s):** "Everything you see is powered by REAL open data. Wards are classified into 4 heat risk levels aligned with Indian Meteorological Department criteria, computed live from Open-Meteo's hourly forecast and historical climatology. The map overlays critical healthcare and social infrastructure queried directly from OpenStreetMap. Every single card and metric carries a visible data provenance badge: Real, Derived, or Benchmark."

---

### [01:10 - 01:50] Act 3: Dynamic Priority Queue & Formula Breakdown
- **Visual:** Select the top incident in the Priority Queue (#1: Major Pipeline Fracture near District Hospital). Point to the 4-part score breakdown bar.
- **Narrator (40s):** "Our dynamic ranking engine scores every leak using a transparent formula: `Leak Size × ln(1 + Affected Population) × (1 + Vulnerability) × (1 + Heat Risk)`. A burst near a dense settlement or hospital during a 42°C heatwave is automatically propelled to the top of the queue."

---

### [01:50 - 02:30] Act 4: Before vs After Impact Panel & Slider
- **Visual:** Scroll down to the Impact Panel. Adjust the 'Crew Repair Time' slider from 4 hours to 6 hours.
- **Narrator (40s):** "Here is the concrete impact. By comparing traditional complaint order against Tript-Dhara dispatch order for the top 5 incidents, the system demonstrates over 45,000 liters of treated drinking water saved and an extra 4,000+ vulnerable citizens protected within the first critical 24 hours."

---

### [02:30 - 02:45] Act 5: Citizen Leak Report & Offline Resilience
- **Visual:** Navigate to 'Report Leak' tab. Click 'Use Current GPS', select 'Major Main Burst', and submit. Show that it instantly creates a REAL ranked leak.
- **Narrator (15s):** "Citizens can anonymously report leaks with GPS and photos. Submissions use Idempotency keys to prevent duplicates under poor network conditions, and immediately rank as REAL incidents in the dispatch queue."

---

### [02:45 - 02:55] Act 6: AWS Strands Agents SDK & Multilingual Operations
- **Visual:** Click 'Operator Briefing' button in the top bar. Toggle English / Hindi view.
- **Narrator (10s):** "Using the AWS open-source Strands Agents SDK, Tript-Dhara automatically synthesizes priority vectors into actionable, multilingual field dispatch briefings for repair crews."

---

### [02:55 - 03:00] Act 7: Container Architecture & Conclusion
- **Visual:** Switch to 'Data & About' page, showing 5 container services and 100% data provenance transparency.
- **Narrator (5s):** "Built on 5 isolated Docker containers, Tript-Dhara empowers cities to build heat and water resilience with zero guesswork."
