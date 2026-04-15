import type { Schichtplanung, Mitarbeiterverwaltung, Schichtdefinitionen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface SchichtplanungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schichtplanung | null;
  onEdit: (record: Schichtplanung) => void;
  mitarbeiterverwaltungList: Mitarbeiterverwaltung[];
  schichtdefinitionenList: Schichtdefinitionen[];
}

export function SchichtplanungViewDialog({ open, onClose, record, onEdit, mitarbeiterverwaltungList, schichtdefinitionenList }: SchichtplanungViewDialogProps) {
  function getMitarbeiterverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitarbeiterverwaltungList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getSchichtdefinitionenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return schichtdefinitionenList.find(r => r.record_id === id)?.fields.schichtname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schichtplanung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum</Label>
            <p className="text-sm">{formatDate(record.fields.datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wochentag</Label>
            <Badge variant="secondary">{record.fields.wochentag?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mitarbeiter</Label>
            <p className="text-sm">{getMitarbeiterverwaltungDisplayName(record.fields.mitarbeiter)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schicht</Label>
            <p className="text-sm">{getSchichtdefinitionenDisplayName(record.fields.schicht)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einsatzbereich</Label>
            <p className="text-sm">{record.fields.einsatzbereich ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vertretung</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.vertretung ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.vertretung ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}