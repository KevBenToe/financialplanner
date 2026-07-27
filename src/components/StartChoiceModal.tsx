interface StartChoiceModalProps {
  onCreateEmpty: () => void;
  onLoadDemo: () => void;
  onImportJson: () => void;
}

export const StartChoiceModal = ({
  onCreateEmpty,
  onLoadDemo,
  onImportJson,
}: StartChoiceModalProps) => {
  return (
    <div className="start-overlay" role="dialog" aria-modal="true" aria-label="Startauswahl">
      <div className="start-card">
        <h2>Willkommen zum Finanzplaner</h2>
        <p>Wie moechten Sie starten?</p>
        <div className="start-actions">
          <button type="button" onClick={onCreateEmpty}>
            Leeres Projekt
          </button>
          <button type="button" onClick={onLoadDemo}>
            Beispieldaten laden
          </button>
          <button type="button" onClick={onImportJson}>
            JSON-Sicherung importieren
          </button>
        </div>
      </div>
    </div>
  );
};
