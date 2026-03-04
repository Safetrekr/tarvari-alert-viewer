# TypeScript Types

Copy-paste ready types for the coverage page. Place in `src/lib/interfaces/coverage.ts` or co-locate with the hook.

---

## Supabase Row Types (what comes back from queries)

```typescript
/** Row from intel_sources table */
interface IntelSourceRow {
  source_key: string;
  name: string;
  category: string;
  status: 'active' | 'staging' | 'quarantine' | 'disabled';
  coverage: {
    geo?: string;           // "US", "Global", "EU", "Asia-Pacific", etc.
    languages?: string[];   // ["en"]
    frequency?: string;     // "1min", "5min", "15min", "1hr"
  } | null;
}

/** Row from intel_normalized table (map data) */
interface IntelNormalizedRow {
  id: string;
  title: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  category: string;
  source_id: string;
  geo: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  } | null;
  ingested_at: string;  // ISO 8601
}
```

---

## Derived / Display Types

```typescript
/** Processed source for the details table */
interface SourceCoverage {
  sourceKey: string;
  name: string;
  category: string;
  status: string;
  geographicCoverage: string | null;
  updateFrequency: string | null;
}

/** Category rollup for the card grid */
interface CoverageByCategory {
  category: string;
  sourceCount: number;
  activeSources: number;
  geographicRegions: string[];
}

/** Combined metrics response */
interface CoverageMetrics {
  totalSources: number;
  activeSources: number;
  categoriesCovered: number;
  sourcesByCoverage: SourceCoverage[];
  byCategory: CoverageByCategory[];
}
```

---

## Map Types

```typescript
/** GeoJSON feature for map rendering */
interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    id: string;
    type: 'intel';
    title: string;
    severity: string;
    category: string;
    sourceId: string;
    ingestedAt: string;
  };
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/** Simplified marker for rendering */
interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  severity: string;
  category: string;
  sourceId: string;
  ingestedAt: string;
}
```

---

## Constants

```typescript
const SEVERITY_LEVELS = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'] as const;
type Severity = typeof SEVERITY_LEVELS[number];

const SEVERITY_COLORS: Record<Severity, string> = {
  Extreme: 'red',
  Severe: 'orange',
  Moderate: 'yellow',
  Minor: 'blue',
  Unknown: 'gray',
};

const CATEGORIES = [
  'weather', 'seismic', 'geological', 'health', 'humanitarian',
  'conflict', 'infrastructure', 'aviation', 'maritime', 'disaster',
  'multi-hazard', 'fire', 'flood', 'storm', 'other',
] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<string, string> = {
  seismic: 'red',
  geological: 'orange',
  disaster: 'purple',
  humanitarian: 'blue',
  health: 'green',
  aviation: 'cyan',
  maritime: 'teal',
  infrastructure: 'yellow',
  weather: 'blue',
  conflict: 'red',
  fire: 'orange',
  flood: 'indigo',
  storm: 'sky',
  'multi-hazard': 'gray',
  other: 'gray',
};

const SOURCE_STATUSES = ['active', 'staging', 'quarantine', 'disabled'] as const;
type SourceStatus = typeof SOURCE_STATUSES[number];
```
