// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Mitarbeiterverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    personalnummer?: string;
    abteilung?: string;
    telefon?: string;
    email?: string;
    beschaeftigungsart?: LookupValue;
    bemerkung?: string;
  };
}

export interface Schichtdefinitionen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schichtname?: string;
    schichtbeginn?: string;
    schichtende?: string;
    schichtkategorie?: LookupValue;
    schichtbeschreibung?: string;
  };
}

export interface Schichtplanung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    wochentag?: LookupValue;
    mitarbeiter?: string; // applookup -> URL zu 'Mitarbeiterverwaltung' Record
    schicht?: string; // applookup -> URL zu 'Schichtdefinitionen' Record
    einsatzbereich?: string;
    vertretung?: boolean;
    notizen?: string;
  };
}

export const APP_IDS = {
  MITARBEITERVERWALTUNG: '69dfcf2420b9dd0739d9ef2d',
  SCHICHTDEFINITIONEN: '69dfcf2a89f27c78cdb064ed',
  SCHICHTPLANUNG: '69dfcf2b9958ccbd1df5185a',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitarbeiterverwaltung': {
    beschaeftigungsart: [{ key: "vollzeit", label: "Vollzeit" }, { key: "teilzeit", label: "Teilzeit" }, { key: "minijob", label: "Minijob" }, { key: "aushilfe", label: "Aushilfe" }],
  },
  'schichtdefinitionen': {
    schichtkategorie: [{ key: "fruehschicht", label: "Frühschicht" }, { key: "spaetschicht", label: "Spätschicht" }, { key: "nachtschicht", label: "Nachtschicht" }, { key: "tagschicht", label: "Tagschicht" }, { key: "sonderschicht", label: "Sonderschicht" }],
  },
  'schichtplanung': {
    wochentag: [{ key: "dienstag", label: "Dienstag" }, { key: "mittwoch", label: "Mittwoch" }, { key: "donnerstag", label: "Donnerstag" }, { key: "freitag", label: "Freitag" }, { key: "samstag", label: "Samstag" }, { key: "sonntag", label: "Sonntag" }, { key: "montag", label: "Montag" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitarbeiterverwaltung': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'personalnummer': 'string/text',
    'abteilung': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'beschaeftigungsart': 'lookup/radio',
    'bemerkung': 'string/textarea',
  },
  'schichtdefinitionen': {
    'schichtname': 'string/text',
    'schichtbeginn': 'string/text',
    'schichtende': 'string/text',
    'schichtkategorie': 'lookup/select',
    'schichtbeschreibung': 'string/textarea',
  },
  'schichtplanung': {
    'datum': 'date/date',
    'wochentag': 'lookup/select',
    'mitarbeiter': 'applookup/select',
    'schicht': 'applookup/select',
    'einsatzbereich': 'string/text',
    'vertretung': 'bool',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitarbeiterverwaltung = StripLookup<Mitarbeiterverwaltung['fields']>;
export type CreateSchichtdefinitionen = StripLookup<Schichtdefinitionen['fields']>;
export type CreateSchichtplanung = StripLookup<Schichtplanung['fields']>;