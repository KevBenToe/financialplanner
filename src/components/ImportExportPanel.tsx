import { useRef, useState } from 'react';
import { Download, FileUp, Upload, X } from 'lucide-react';

import { parseHistoricalCsv } from '../market-data';
import { downloadJson, parseImportJson } from '../storage/exportImport';
import { financeStorage } from '../storage/indexedDbStorage';

interface ImportExportPanelProps {
  onReload: () => Promise<void>;
  onLoadDemo: () => Promise<void>;
  open: boolean;
  onClose: () => void;
}

export const ImportExportPanel = ({ onReload, onLoadDemo, open, onClose }: ImportExportPanelProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string>();

  const exportJson = async () => {
    const payload = await financeStorage.exportData('1.0.0');
    downloadJson(payload);
    setMessage('Export erfolgreich erstellt.');
  };

  const importJson = async (file?: File | null) => {
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = parseImportJson(raw);

      const replace = window.confirm(
        'Vorhandene Daten ueberschreiben? Abbrechen = Zusammenfuehren',
      );

      await financeStorage.importData(parsed, replace ? 'replace' : 'merge');
      await onReload();
      setMessage('Import erfolgreich abgeschlossen.');
    } catch (error) {
      setMessage(`Importfehler: ${(error as Error).message}`);
    }
  };

  const importCsv = async (file?: File | null) => {
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const rows = parseHistoricalCsv(raw);
      setMessage(`CSV erkannt: ${rows.length} Kurszeilen. Fuegen Sie die Daten einem Plan zu.`);
    } catch (error) {
      setMessage(`CSV-Fehler: ${(error as Error).message}`);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="io-card project-data-dialog" aria-label="Import und Export" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header className="dialog-header">
          <h3>Projektdaten</h3>
          <button type="button" className="dialog-close-button" onClick={onClose} aria-label="Dialog schliessen" title="Schliessen"><X size={18} /></button>
        </header>
      <p>
        Alle Daten bleiben lokal im Browser. Exporte sollten regelmaessig als Sicherung erstellt
        werden.
      </p>
      <div className="io-actions">
        <button type="button" onClick={() => void exportJson()}>
          <Download size={17} /> JSON exportieren
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={17} /> JSON importieren
        </button>
        <button type="button" onClick={() => csvInputRef.current?.click()}>
          <FileUp size={17} /> CSV Kurse importieren
        </button>
        <button type="button" onClick={() => void onLoadDemo()}>
          Demo-Daten laden
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(event) => void importJson(event.target.files?.[0])}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept="text/csv,.csv"
        hidden
        onChange={(event) => void importCsv(event.target.files?.[0])}
      />

      {message && <p className="note">{message}</p>}
      </section>
    </div>
  );
};
