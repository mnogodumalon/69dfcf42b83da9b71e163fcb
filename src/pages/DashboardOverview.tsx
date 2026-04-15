import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSchichtplanung } from '@/lib/enrich';
import type { EnrichedSchichtplanung } from '@/types/enriched';
import type { Mitarbeiterverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconChevronLeft, IconChevronRight,
  IconUsers, IconCalendar, IconClock, IconLayoutGrid,
} from '@tabler/icons-react';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SchichtplanungDialog } from '@/components/dialogs/SchichtplanungDialog';

const APPGROUP_ID = '69dfcf42b83da9b71e163fcb';
const REPAIR_ENDPOINT = '/claude/build/repair';

const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const KATEGORIE_COLORS: Record<string, string> = {
  fruehschicht: 'bg-amber-100 text-amber-800 border-amber-200',
  spaetschicht: 'bg-blue-100 text-blue-800 border-blue-200',
  nachtschicht: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  tagschicht: 'bg-green-100 text-green-800 border-green-200',
  sonderschicht: 'bg-purple-100 text-purple-800 border-purple-200',
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatWeekLabel(start: Date): string {
  const end = addDays(start, 6);
  const startStr = start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  const endStr = end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function isCurrentWeek(weekStart: Date): boolean {
  const todayWeekStart = getWeekStart(new Date());
  return toDateString(weekStart) === toDateString(todayWeekStart);
}

export default function DashboardOverview() {
  const {
    mitarbeiterverwaltung, schichtdefinitionen, schichtplanung,
    mitarbeiterverwaltungMap, schichtdefinitionenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedSchichtplanung = enrichSchichtplanung(schichtplanung, { mitarbeiterverwaltungMap, schichtdefinitionenMap });

  // --- alle Hooks VOR early returns ---
  const [weekOffset, setWeekOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedSchichtplanung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedSchichtplanung | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [prefillMitarbeiter, setPrefillMitarbeiter] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'woche' | 'mitarbeiter'>('woche');

  const weekStart = useMemo(() => {
    const base = getWeekStart(new Date());
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekDayStrings = useMemo(() => weekDays.map(toDateString), [weekDays]);

  const weekEntries = useMemo(() => {
    return enrichedSchichtplanung.filter(e => {
      if (!e.fields.datum) return false;
      const d = e.fields.datum.slice(0, 10);
      return weekDayStrings.includes(d);
    });
  }, [enrichedSchichtplanung, weekDayStrings]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, EnrichedSchichtplanung[]> = {};
    for (const d of weekDayStrings) map[d] = [];
    for (const e of weekEntries) {
      const d = e.fields.datum!.slice(0, 10);
      if (map[d]) map[d].push(e);
    }
    return map;
  }, [weekEntries, weekDayStrings]);

  const entriesByMitarbeiter = useMemo(() => {
    const map: Record<string, { mitarbeiter: Mitarbeiterverwaltung; entries: EnrichedSchichtplanung[] }> = {};
    for (const e of weekEntries) {
      const id = extractRecordId(e.fields.mitarbeiter) ?? '__unknown__';
      if (!map[id]) {
        const m = id !== '__unknown__' ? mitarbeiterverwaltungMap.get(id) : undefined;
        map[id] = { mitarbeiter: m ?? { record_id: id, createdat: '', updatedat: null, fields: { vorname: '?', nachname: 'Unbekannt' } }, entries: [] };
      }
      map[id].entries.push(e);
    }
    return map;
  }, [weekEntries, mitarbeiterverwaltungMap]);

  const today = toDateString(new Date());

  // Stats
  const totalMitarbeiter = mitarbeiterverwaltung.length;
  const totalSchichten = schichtdefinitionen.length;
  const weekSchichten = weekEntries.length;
  const vertretungen = weekEntries.filter(e => e.fields.vertretung).length;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  function openCreate(datum?: string, mitarbeiterId?: string) {
    setEditRecord(null);
    setPrefillDate(datum);
    setPrefillMitarbeiter(mitarbeiterId ? createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, mitarbeiterId) : undefined);
    setDialogOpen(true);
  }

  function openEdit(entry: EnrichedSchichtplanung) {
    setEditRecord(entry);
    setPrefillDate(undefined);
    setPrefillMitarbeiter(undefined);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteSchichtplanungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  }

  function getSchichtColor(entry: EnrichedSchichtplanung): string {
    const schichtId = extractRecordId(entry.fields.schicht);
    if (!schichtId) return 'bg-gray-100 text-gray-700 border-gray-200';
    const schicht = schichtdefinitionenMap.get(schichtId);
    const kat = schicht?.fields.schichtkategorie?.key ?? '';
    return KATEGORIE_COLORS[kat] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  }

  function getSchichtName(entry: EnrichedSchichtplanung): string {
    return entry.schichtName || entry.fields.einsatzbereich || '–';
  }

  function getMitarbeiterName(entry: EnrichedSchichtplanung): string {
    return entry.mitarbeiterName || '–';
  }

  function getSchichtZeiten(entry: EnrichedSchichtplanung): string {
    const schichtId = extractRecordId(entry.fields.schicht);
    if (!schichtId) return '';
    const schicht = schichtdefinitionenMap.get(schichtId);
    if (!schicht) return '';
    const b = schicht.fields.schichtbeginn ?? '';
    const e = schicht.fields.schichtende ?? '';
    if (b && e) return `${b} – ${e}`;
    return b || e;
  }

  return (
    <div className="space-y-6">
      {/* KPI-Zeile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Mitarbeiter"
          value={String(totalMitarbeiter)}
          description="Aktive Mitarbeiter"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Schichtarten"
          value={String(totalSchichten)}
          description="Definierte Schichten"
          icon={<IconClock size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Diese Woche"
          value={String(weekSchichten)}
          description="Geplante Einsätze"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Vertretungen"
          value={String(vertretungen)}
          description="Diese Woche"
          icon={<IconLayoutGrid size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Wochen-Navigator + Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>
            <IconChevronLeft size={16} className="shrink-0" />
          </Button>
          <div className="text-sm font-semibold min-w-[180px] text-center">
            {formatWeekLabel(weekStart)}
            {isCurrentWeek(weekStart) && (
              <Badge variant="secondary" className="ml-2 text-xs">Aktuelle Woche</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
            <IconChevronRight size={16} className="shrink-0" />
          </Button>
          {!isCurrentWeek(weekStart) && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-xs text-muted-foreground">
              Heute
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('woche')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'woche' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            >
              Nach Tag
            </button>
            <button
              onClick={() => setViewMode('mitarbeiter')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'mitarbeiter' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            >
              Nach Mitarbeiter
            </button>
          </div>
          <Button size="sm" onClick={() => openCreate()}>
            <IconPlus size={15} className="mr-1 shrink-0" />
            <span>Schicht planen</span>
          </Button>
        </div>
      </div>

      {/* Hauptansicht: Wochenplan */}
      {viewMode === 'woche' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const dateStr = toDateString(day);
            const isToday = dateStr === today;
            const dayEntries = entriesByDate[dateStr] ?? [];
            const dayName = WOCHENTAGE[idx];
            const dayLabel = day.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

            return (
              <div
                key={dateStr}
                className={`rounded-xl border overflow-hidden flex flex-col ${isToday ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
              >
                {/* Tag-Header */}
                <div className={`px-3 py-2 flex items-center justify-between ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                  <div>
                    <div className={`text-xs font-semibold ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>{dayName}</div>
                    <div className={`text-xs ${isToday ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{dayLabel}</div>
                  </div>
                  <button
                    onClick={() => openCreate(dateStr)}
                    className={`rounded-lg p-1 transition-colors ${isToday ? 'hover:bg-white/20 text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                    title="Schicht hinzufügen"
                  >
                    <IconPlus size={14} className="shrink-0" />
                  </button>
                </div>

                {/* Einträge */}
                <div className="flex flex-col gap-1.5 p-2 flex-1 min-h-[100px] lg:min-h-[140px]">
                  {dayEntries.length === 0 && (
                    <button
                      onClick={() => openCreate(dateStr)}
                      className="flex-1 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-colors"
                    >
                      + Schicht
                    </button>
                  )}
                  {dayEntries.map(entry => {
                    const colorClass = getSchichtColor(entry);
                    const name = getMitarbeiterName(entry);
                    const schichtName = getSchichtName(entry);
                    const zeiten = getSchichtZeiten(entry);

                    return (
                      <div
                        key={entry.record_id}
                        className={`rounded-lg border px-2 py-1.5 text-xs flex flex-col gap-0.5 ${colorClass}`}
                      >
                        <div className="font-semibold truncate">{name}</div>
                        <div className="truncate opacity-80">{schichtName}</div>
                        {zeiten && <div className="opacity-70 text-[10px]">{zeiten}</div>}
                        {entry.fields.vertretung && (
                          <Badge variant="outline" className="text-[9px] w-fit px-1 py-0 border-current/40 mt-0.5">Vertretung</Badge>
                        )}
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => openEdit(entry)}
                            className="rounded p-0.5 hover:bg-black/10 transition-colors"
                            title="Bearbeiten"
                          >
                            <IconPencil size={11} className="shrink-0" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(entry)}
                            className="rounded p-0.5 hover:bg-black/10 transition-colors"
                            title="Löschen"
                          >
                            <IconTrash size={11} className="shrink-0" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Mitarbeiter-Ansicht */
        <div className="space-y-3">
          {mitarbeiterverwaltung.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">Keine Mitarbeiter vorhanden.</div>
          )}
          {mitarbeiterverwaltung.map(ma => {
            const maEntries = entriesByMitarbeiter[ma.record_id]?.entries ?? [];
            const fullName = [ma.fields.vorname, ma.fields.nachname].filter(Boolean).join(' ') || '–';

            return (
              <div key={ma.record_id} className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {(ma.fields.vorname?.[0] ?? '') + (ma.fields.nachname?.[0] ?? '')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{fullName}</div>
                      {ma.fields.abteilung && (
                        <div className="text-xs text-muted-foreground truncate">{ma.fields.abteilung}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">{maEntries.length} Schicht{maEntries.length !== 1 ? 'en' : ''}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => openCreate(undefined, ma.record_id)} className="h-7 px-2">
                      <IconPlus size={13} className="shrink-0" />
                    </Button>
                  </div>
                </div>

                {maEntries.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground/60 italic">
                    Keine Schichten diese Woche
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3">
                    {maEntries.map(entry => {
                      const colorClass = getSchichtColor(entry);
                      const entrySchichtName = getSchichtName(entry);
                      const zeiten = getSchichtZeiten(entry);
                      const dateStr = entry.fields.datum ? formatDate(entry.fields.datum) : '–';
                      const wochentag = entry.fields.wochentag?.label ?? '';

                      return (
                        <div key={entry.record_id} className={`rounded-lg border px-3 py-2 text-xs ${colorClass}`}>
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{wochentag || dateStr}</div>
                              <div className="truncate opacity-80">{entrySchichtName}</div>
                              {zeiten && <div className="opacity-70 text-[10px] mt-0.5">{zeiten}</div>}
                              {entry.fields.einsatzbereich && entrySchichtName !== entry.fields.einsatzbereich && (
                                <div className="opacity-60 text-[10px] truncate">{entry.fields.einsatzbereich}</div>
                              )}
                              {entry.fields.vertretung && (
                                <Badge variant="outline" className="text-[9px] w-fit px-1 py-0 border-current/40 mt-1">Vertretung</Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                onClick={() => openEdit(entry)}
                                className="rounded p-0.5 hover:bg-black/10 transition-colors"
                                title="Bearbeiten"
                              >
                                <IconPencil size={12} className="shrink-0" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(entry)}
                                className="rounded p-0.5 hover:bg-black/10 transition-colors"
                                title="Löschen"
                              >
                                <IconTrash size={12} className="shrink-0" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schichtlegende */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(KATEGORIE_COLORS).map(([key, cls]) => (
          <div key={key} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border ${cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />
            {key === 'fruehschicht' ? 'Frühschicht' :
              key === 'spaetschicht' ? 'Spätschicht' :
              key === 'nachtschicht' ? 'Nachtschicht' :
              key === 'tagschicht' ? 'Tagschicht' : 'Sonderschicht'}
          </div>
        ))}
      </div>

      {/* Dialoge */}
      <SchichtplanungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateSchichtplanungEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createSchichtplanungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord ? editRecord.fields : (prefillDate || prefillMitarbeiter ? {
          datum: prefillDate,
          mitarbeiter: prefillMitarbeiter,
        } : undefined)}
        mitarbeiterverwaltungList={mitarbeiterverwaltung}
        schichtdefinitionenList={schichtdefinitionen}
        enablePhotoScan={AI_PHOTO_SCAN['Schichtplanung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Schichteintrag löschen"
        description={`Soll der Eintrag für ${deleteTarget ? getMitarbeiterName(deleteTarget) : ''} wirklich gelöscht werden?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
