import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitarbeiterverwaltung, Schichtplanung, Schichtdefinitionen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [mitarbeiterverwaltung, setMitarbeiterverwaltung] = useState<Mitarbeiterverwaltung[]>([]);
  const [schichtplanung, setSchichtplanung] = useState<Schichtplanung[]>([]);
  const [schichtdefinitionen, setSchichtdefinitionen] = useState<Schichtdefinitionen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitarbeiterverwaltungData, schichtplanungData, schichtdefinitionenData] = await Promise.all([
        LivingAppsService.getMitarbeiterverwaltung(),
        LivingAppsService.getSchichtplanung(),
        LivingAppsService.getSchichtdefinitionen(),
      ]);
      setMitarbeiterverwaltung(mitarbeiterverwaltungData);
      setSchichtplanung(schichtplanungData);
      setSchichtdefinitionen(schichtdefinitionenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [mitarbeiterverwaltungData, schichtplanungData, schichtdefinitionenData] = await Promise.all([
          LivingAppsService.getMitarbeiterverwaltung(),
          LivingAppsService.getSchichtplanung(),
          LivingAppsService.getSchichtdefinitionen(),
        ]);
        setMitarbeiterverwaltung(mitarbeiterverwaltungData);
        setSchichtplanung(schichtplanungData);
        setSchichtdefinitionen(schichtdefinitionenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const mitarbeiterverwaltungMap = useMemo(() => {
    const m = new Map<string, Mitarbeiterverwaltung>();
    mitarbeiterverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeiterverwaltung]);

  const schichtdefinitionenMap = useMemo(() => {
    const m = new Map<string, Schichtdefinitionen>();
    schichtdefinitionen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schichtdefinitionen]);

  return { mitarbeiterverwaltung, setMitarbeiterverwaltung, schichtplanung, setSchichtplanung, schichtdefinitionen, setSchichtdefinitionen, loading, error, fetchAll, mitarbeiterverwaltungMap, schichtdefinitionenMap };
}