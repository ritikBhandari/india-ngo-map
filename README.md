# India NGO Map

Interactive district-demographics and Ashoka Fellows / NGO explorer for India.

## Launch
Open **[index.html](./index.html)** directly in a browser, or enable GitHub Pages with **Deploy from a branch → master → /(root)** to publish the site.

## Features
- India state and district map with organization markers
- Clustered NGO markers so multiple organizations at the same location remain selectable
- NGO/fellow, district, state and topic browsing and search
- City/metro to district approximations when precise organization addresses are not available
- **Your supplied district demographic composition always takes precedence** where available; Census 2011 is used only as a clearly labelled fallback for districts without supplied composition data
- Each NGO's demographic panel labels the source, distinguishing user-supplied district figures from Census 2011 fallbacks and geographic comparison proxies


## Analytics workspace
Use the **Explore Map** and **Data Insights** tabs in the dashboard. The interactive insights page is also available at [#insights](https://ritikbhandari.github.io/india-ngo-map/#insights).

- State/UT and district NGO rankings; fellowship-year timeline and decade cohorts
- Most represented topic tags and geographic concentration in the top 10 mapped districts
- Location precision, demographic data provenance and state coverage gaps
- Cross-filter by state, topic, fellowship-year range, location coverage, and text search
- Export the filtered NGO records as CSV for further analysis

**Year semantics:** The underlying data provides **Ashoka Fellowship year**, not verified NGO founding/incorporation year. All timelines and decade charts use fellowship year.

**Interpretation:** Counts are derived from the supplied Ashoka Fellows / NGO dataset; they do not represent a complete enumeration of Indian NGOs. District matches and metro assignments may be approximate. Your supplied district demographic values are always preferred over Census 2011 fallbacks.

## Data quality notes
- The map contains district boundaries from a different reference period than Census 2011. Administrative districts have changed since 2011; names and boundaries may not match.
- The embedded fallback contains selected Census 2011 district records; the dashboard attempts to load a wider district-level dataset when internet is available. **Do not interpret this as complete verified coverage of all districts.**
- Religious-community percentages and SC/ST categories overlap as classifications and must not be added together as though they were mutually exclusive.
- Marker coordinates and city-to-district assignments may be approximate. Comparisons to adjacent districts are proxies, **not** the organization's actual district figures.
- Exact organizational addresses and a validated 2011-to-current administrative-district crosswalk are needed for complete demographic attribution.

## Census references
- Census of India 2011: https://censusindia.gov.in/
- Primary Census Abstract: https://censusindia.gov.in/nada/index.php/catalog/6191

This is a static HTML dashboard: no installation or build step is required.
