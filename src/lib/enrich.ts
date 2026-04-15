import type { EnrichedSchichtplanung } from '@/types/enriched';
import type { Mitarbeiterverwaltung, Schichtdefinitionen, Schichtplanung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SchichtplanungMaps {
  mitarbeiterverwaltungMap: Map<string, Mitarbeiterverwaltung>;
  schichtdefinitionenMap: Map<string, Schichtdefinitionen>;
}

export function enrichSchichtplanung(
  schichtplanung: Schichtplanung[],
  maps: SchichtplanungMaps
): EnrichedSchichtplanung[] {
  return schichtplanung.map(r => ({
    ...r,
    mitarbeiterName: resolveDisplay(r.fields.mitarbeiter, maps.mitarbeiterverwaltungMap, 'vorname', 'nachname'),
    schichtName: resolveDisplay(r.fields.schicht, maps.schichtdefinitionenMap, 'schichtname'),
  }));
}
