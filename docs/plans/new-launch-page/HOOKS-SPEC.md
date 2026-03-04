# TanStack Query Hooks Specification

Two hooks that fetch from Supabase directly. Place in `src/hooks/`.

The app already uses TanStack Query 5 and has a Supabase client at `src/lib/supabase/client.ts`.

---

## Hook 1: `useCoverageMetrics`

Fetches all intel sources and computes the metrics client-side.

```typescript
// src/hooks/useCoverageMetrics.ts

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface IntelSourceRow {
  source_key: string;
  name: string;
  category: string;
  status: string;
  coverage: { geo?: string; frequency?: string } | null;
}

interface SourceCoverage {
  sourceKey: string;
  name: string;
  category: string;
  status: string;
  geographicCoverage: string | null;
  updateFrequency: string | null;
}

interface CoverageByCategory {
  category: string;
  sourceCount: number;
  activeSources: number;
  geographicRegions: string[];
}

interface CoverageMetrics {
  totalSources: number;
  activeSources: number;
  categoriesCovered: number;
  sourcesByCoverage: SourceCoverage[];
  byCategory: CoverageByCategory[];
}

async function fetchCoverageMetrics(): Promise<CoverageMetrics> {
  const supabase = getSupabaseBrowserClient();

  const { data: sources, error } = await supabase
    .from('intel_sources')
    .select('source_key, name, category, status, coverage');

  if (error) throw error;
  if (!sources) return emptyMetrics();

  // Build flat source list
  const sourcesByCoverage: SourceCoverage[] = sources.map((s: IntelSourceRow) => ({
    sourceKey: s.source_key,
    name: s.name,
    category: s.category,
    status: s.status,
    geographicCoverage: s.coverage?.geo ?? null,
    updateFrequency: s.coverage?.frequency ?? null,
  }));

  // Aggregate by category
  const categoryMap = new Map<string, CoverageByCategory>();
  for (const s of sources) {
    const cat = s.category;
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        category: cat,
        sourceCount: 0,
        activeSources: 0,
        geographicRegions: [],
      });
    }
    const entry = categoryMap.get(cat)!;
    entry.sourceCount++;
    if (s.status === 'active') entry.activeSources++;
    const geo = s.coverage?.geo;
    if (geo && !entry.geographicRegions.includes(geo)) {
      entry.geographicRegions.push(geo);
    }
  }

  const byCategory = Array.from(categoryMap.values())
    .sort((a, b) => b.sourceCount - a.sourceCount);

  return {
    totalSources: sources.length,
    activeSources: sources.filter(s => s.status === 'active').length,
    categoriesCovered: categoryMap.size,
    sourcesByCoverage,
    byCategory,
  };
}

function emptyMetrics(): CoverageMetrics {
  return { totalSources: 0, activeSources: 0, categoriesCovered: 0, sourcesByCoverage: [], byCategory: [] };
}

export function useCoverageMetrics() {
  return useQuery<CoverageMetrics>({
    queryKey: ['coverage', 'metrics'],
    queryFn: fetchCoverageMetrics,
    staleTime: 45_000,
    refetchInterval: 60_000,
  });
}
```

---

## Hook 2: `useCoverageMapData`

Fetches intel items that have geographic data for map pins.

```typescript
// src/hooks/useCoverageMapData.ts

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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

interface CoverageMapFilters {
  category?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
}

async function fetchCoverageMapData(filters?: CoverageMapFilters): Promise<MapMarker[]> {
  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from('intel_normalized')
    .select('id, title, severity, category, source_id, geo, ingested_at')
    .not('geo', 'is', null)
    .limit(1000);

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.startDate) query = query.gte('ingested_at', filters.startDate);
  if (filters?.endDate) query = query.lte('ingested_at', filters.endDate);

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  return data
    .filter(item => item.geo?.type === 'Point' && Array.isArray(item.geo?.coordinates))
    .map(item => ({
      id: item.id,
      lat: item.geo.coordinates[1],    // GeoJSON is [lng, lat]
      lng: item.geo.coordinates[0],
      title: item.title ?? 'Intel Item',
      severity: item.severity ?? 'Unknown',
      category: item.category ?? 'other',
      sourceId: item.source_id,
      ingestedAt: item.ingested_at,
    }));
}

export function useCoverageMapData(filters?: CoverageMapFilters) {
  return useQuery<MapMarker[]>({
    queryKey: ['coverage', 'map-data', filters],
    queryFn: () => fetchCoverageMapData(filters),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
```

---

## Usage in a Page Component

```typescript
const { data: metrics, isLoading, error } = useCoverageMetrics();
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const { data: markers = [], isLoading: mapLoading } = useCoverageMapData({
  category: selectedCategory ?? undefined,
});
```
