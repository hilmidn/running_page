# Plan: Update Detail Page dengan Design Modern Garmin/Coros Style

## TL;DR

Transform detail page dari skeleton (dengan "coming soon" sections) menjadi fully-featured activity dashboard dengan 5 komponen chart (HR, Elevation, Cadence, Pace Splits, Route Map) + interactive splits table. Design responsive mobile-first, Garmin/Coros-inspired styling dengan Tailwind + CSS variables untuk consistency.

---

## Steps

### Phase 1: Data Processing Layer & Utilities

1. **Create `src/utils/activityAnalytics.ts`** - Central hub untuk data processing
   - `splitActivityBySections()` - Split activity ke N-segment berdasarkan time/distance
   - `calculateSegmentStats()` - Per-segment: pace (min/max/avg), HR zone, elevation gain, cadence
   - `decodePolyline()` - Decode summary_polyline dari activities.json menjadi lat/lng array
   - `createElevationProfileData()` - Transform altitude[] menjadi {distance, elevation} points
   - `createCadenceZoneData()` - Group cadence ke zones (RPM ranges), hitung time% per zone
   - `validateStreamData()` - Check completeness (return flags: hasHR, hasAltitude, hasCadence)
   - Helper: `metersToKm()`, `secondsToMinutes()`, `calculateGrade()` (elevation/distance%)

2. **Enhance `src/components/Detail/Activity/index.tsx`** _(existing)_
   - Add data completeness badges (✓ HR, ✓ GPS, ✗ Cadence)
   - Show "No altitude data" graceful fallback text

### Phase 2: Core Chart Components (Recharts-based)

3. **Create `src/components/Detail/ElevationChart/index.tsx`** - Elevation profile
   - ComposedChart: Area (elevation) + Line (grade %), optional reference lines (max grade)
   - X-axis: Distance (km), Y-axis: Elevation (m)
   - Responsive container + Brush for zoom
   - Fallback: "Elevation data unavailable" card jika !hasAltitude
   - Mobile: 300px height, Desktop: 450px height

4. **Create `src/components/Detail/PaceChart/index.tsx`** - Pace variability + splits
   - ComposedChart: Bar (pace per segment) + Line (moving average pace)
   - X-axis: Segment/Time, Y-axis: Pace (min/km)
   - Color coding: Green (fast) → Yellow (moderate) → Red (slow)
   - Interactive segments: highlight pace range, HR avg, elevation for segment
   - Fallback: "Insufficient pace data" jika distance stream incomplete

5. **Create `src/components/Detail/CadenceChart/index.tsx`** - Cadence zones distribution
   - BarChart: Stacked bar chart dengan cadence zones (RPM ranges)
   - Alternative: LineChart dengan cadence over time
   - Heatmap-style: Zone colors (green/yellow/orange/red)
   - Stats table below: Zone name, Time%, Avg RPM, Intensity
   - Fallback: "No cadence sensor data" jika !hasCadence

6. **Enhance `src/components/Detail/HeartRate/HRZoneStats.tsx`** _(existing)_
   - Convert dari table → Modern card layout dengan zone progress bars
   - Each zone: colored bar (%) + time duration + intensity label
   - Summary: "Dominated Z3 (Aerobic)" highlight

### Phase 3: Map & Route Visualization

7. **Create `src/components/Detail/RouteMap/index.tsx`** - Interactive route map
   - Library: Leaflet atau Mapbox GL (atau Google Maps jika API key ada)
   - Decode summary_polyline → render route line
   - Start/End markers dengan icons
   - Elevation coloring optional (altitude value → color gradient)
   - Mobile: Full-width map, 350px height
   - Desktop: Sidebar layout possible, 600px height
   - Fallback: "No GPS data available" jika !summary_polyline

### Phase 4: Splits/Segments Summary Table

8. **Create `src/components/Detail/SplitsTable/index.tsx`** - Interactive splits breakdown
   - Table/Card layout (mobile-responsive)
   - Columns: Distance (km) | Time | Pace | HR avg | Elevation | Cadence
   - Row highlighting on hover → show on map/charts
   - Configurable: Split by distance (1km) or time (1min)
   - Sortable columns: Click header to sort
   - Color-coded rows: Difficulty (HR zone color)

### Phase 5: Layout Restructuring & Responsive Grid

9. **Refactor `src/pages/detail.tsx`** - Update layout structure
   - Remove static [coming soon] placeholders
   - Implement responsive grid:

     ```
     Mobile (320-767px):
       Full-width stack
       ├── DetailActivity (stats cards)
       ├── RouteMap (full width)
       ├── HeartRateChart (full width)
       ├── ElevationChart (full width)
       ├── PaceChart (full width)
       ├── CadenceChart (full width)
       └── SplitsTable (scrollable)

     Tablet (768-1024px):
       2-column layout
       ├── Left: Activity stats + RouteMap + SplitsTable
       └── Right: HR + Elevation stacked

     Desktop (1025px+):
       3-panel layout
       ├── Left: RouteMap (sticky)
       ├── Center: HR + Elevation + Pace (scrollable charts)
       └── Right: Cadence + SplitsTable (scrollable)
     ```

   - Add section headers dengan icons (Lucide)
   - Spacing/padding consistent with Tailwind scale

10. **Add error boundary & loading states**
    - Loading skeleton for each section (50% data opacity + animation)
    - Error fallback: "Failed to load [section]" dengan retry button
    - Toast notifications untuk missing data gracefully

### Phase 6: Styling & Theme Consistency

11. **Enhance `src/styles/index.css`** - CSS variables untuk consistency
    - Add new variables: `--chart-hr`, `--chart-pace`, `--chart-cadence`, `--chart-elevation`
    - Zone colors: `--zone-z1`, `--zone-z2`, etc. untuk reuse across components
    - Responsive spacing: `--space-mobile`, `--space-desktop`
    - Updated dark mode palette (modern, Garmin-inspired)

12. **Create `src/components/Detail/Detail.module.css`** - Scoped styles
    - Chart container styles (shadows, borders, rounded corners)
    - Responsive breakpoint utilities
    - Animation: Fade-in for data load, smooth transitions

### Phase 7: Testing & Validation

13. **Data validation & edge cases**
    - Test dengan activities yang punya: HR + GPS, HR only, GPS only, minimal data
    - Verify all charts render gracefully dengan missing data
    - Mobile responsiveness: Test pada 320px, 768px, 1024px, 1440px viewports

14. **Performance optimization** _(optional but recommended)_
    - Memoize heavy calculations: `useMemo(calculateSegmentStats, [streams])`
    - Lazy-load charts jika banyak data points (defer CadenceChart rendering)
    - Compress polyline rendering jika route terlalu banyak points

---

## Relevant Files

- `src/pages/detail.tsx` — Main page layout (restructure sections, add grid)
- `src/components/Detail/Activity/index.tsx` — Enhance dengan data completeness badges
- `src/components/Detail/HeartRate/HeartRateChart.tsx` — Reference untuk Recharts patterns
- `src/components/Detail/HeartRate/HRZoneStats.tsx` — Redesign ke card layout
- `src/styles/index.css` — Add CSS variables untuk consistency
- `src/utils/activityAnalytics.ts` — **Create** (central data processing)
- `src/components/Detail/ElevationChart/index.tsx` — **Create**
- `src/components/Detail/PaceChart/index.tsx` — **Create**
- `src/components/Detail/CadenceChart/index.tsx` — **Create**
- `src/components/Detail/RouteMap/index.tsx` — **Create**
- `src/components/Detail/SplitsTable/index.tsx` — **Create**
- `src/components/Detail/Detail.module.css` — **Create**

---

## Verification

1. **Component rendering**: Setiap chart render tanpa error jika data complete
2. **Fallback handling**: Setiap chart show graceful fallback jika data missing
3. **Mobile responsiveness**:
   - Horizontal scroll untuk table pada mobile
   - Stack layout pada <768px, grid pada ≥768px
   - Touch-friendly tap areas (min 44x44px)
4. **Data accuracy**:
   - Verify splits calculation: Σ segment distances = total distance ±0.1km
   - Verify zone times: Σ zone times = total activity time
   - Sample a few activities dan cross-check calculations dengan Strava/Garmin
5. **Performance**:
   - Detail page load time <2s (check DevTools)
   - Charts responsive to browser resize
   - No console errors/warnings
6. **Visual consistency**:
   - All charts use consistent color palette (CSS variables)
   - Icon set consistent (Lucide React icons)
   - Typography consistent (font-sizes, weights)

---

## Decisions

1. **Chart Library**: Tetap Recharts (sudah ada di project, patterns jelas)
   - Alternative considered: Chart.js (simpler API, lebih ringan) — decided against untuk consistency
2. **Route Map Library**: Leaflet recommended (lightweight, no API key needed jika use free tiles)
   - Alternative: Mapbox GL (lebih powerful, perlu API key) — depends on user budget
3. **Splits Strategy**: Fixed distance-based (1km splits) untuk konsistensi
   - Alternative: Time-based atau adaptive (auto-detect dari data) — skipped untuk MVP
4. **Data Processing**: Centralized di `activityAnalytics.ts` bukan component-level
   - Rationale: Reuse calculations, easier testing, cleaner components

5. **Styling Approach**: Tailwind + CSS modules hybrid
   - Tailwind untuk layout/spacing (responsive, utility-first)
   - CSS modules untuk complex component styles (scoped, reusable)
   - CSS variables untuk theming (dark/light mode consistency)

6. **Mobile-first strategy**:
   - Stack all charts vertically pada mobile (no side-by-side)
   - Maps/charts resize responsively dengan Recharts `ResponsiveContainer`
   - SplitsTable scrollable horizontal pada mobile (<768px)

---

## Further Considerations

1. **Route map dependency clarification**
   - Leaflet vs Mapbox GL vs Google Maps?
   - Recommendation: Start dengan Leaflet (free, lightweight) → can upgrade later
   - Requires: `npm install leaflet react-leaflet`

2. **Elevation profile smoothing?**
   - Current raw altitude data might be noisy (GPS errors)
   - Recommendation: Apply moving average (3-5 point window) untuk visual clarity
   - Optional feature: Toggle smoothing on/off

3. **Polyline decoding efficiency**
   - Large activities dengan 10k+ points mungkin slow to decode/render
   - Recommendation: Test performance, implement point decimation jika needed
   - Can use Mapbox's `@mapbox/polyline` library untuk decoding

4. **Segment interaction UX**
   - Clicking a split row → highlight segment di map + chart
   - Recommendation: Implement context/state management (useState or Context API)
   - Keep simple for MVP: Just show segment stats, highlight optional
