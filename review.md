# Review und Umsetzungsplan

Stand: 2026-07-27

## Ergebnis des aktuellen Durchlaufs

Der Sparplan-Editor wurde von Platzhalter-Tabs zu editierbaren Formularen erweitert. Einzahlungen, Zuschuesse, Sparpausen, Gebuehren, Steuern, Inflation, Auszahlungen sowie Prognose- und Produktreferenzdaten koennen nun im Planentwurf gepflegt und gespeichert werden. Ein fokussierter Komponenten-Test deckt das Anlegen und Speichern einer Einzahlungsregel ab.

Dieses Dokument ist ab hier bewusst ein Plan. Die folgenden Punkte wurden nicht in diesem Durchlauf umgesetzt.

## Prioritaet 0: Fachliche Korrektheit

### 1. Einzahlungszeitpunkt in der Prognose korrekt berechnen

**Befund:** `ContributionRule.execution` wird in `src/calculation/engine.ts` nicht ausgewertet. Alle Einzahlungen werden vor der Monatsrendite gebucht. Dadurch erhalten Einzahlungen am Periodenende unberechtigt Rendite fuer denselben Monat.

**Plan:**

1. Die monatliche Schleife in zwei Zahlungsphasen aufteilen: Periodenanfang und Periodenende.
2. Eigenbeitraege und Zuschuesse nach ihrer jeweiligen Regel in die passende Phase buchen.
3. Kaufgebuehren in derselben Phase berechnen und abziehen.
4. Rendite zwischen beiden Phasen anwenden.
5. Regressionstests fuer identische Einzahlungen am Monatsanfang und Monatsende schreiben; der Endwert bei Monatsanfang muss bei positiver Rendite hoeher sein.

**Abnahme:** Die `execution`-Auswahl im Editor hat nachweisbaren Einfluss auf die Projektionspunkte.

### 2. Historischen Modus auf periodische Buchungen statt auf jeden Kursdatensatz umstellen

**Befund:** `runHistorical` ruft bei jedem historischen Preisdatum `computeCashflows` auf. Bei taeglichen Kursen wird eine monatliche Regel daher an jedem Handelstag erneut gebucht. Das verfalscht Einzahlungen, Anteile und Marktwert massiv.

**Plan:**

1. Ausfuehrungstermine fuer jede Einzahlungs- und Zuschussregel einmalig im gesamten Zeitraum erzeugen.
2. Kurse und Cashflows nach Datum zusammenfuehren.
3. Anteile nur an echten Ausfuehrungsterminen zum passenden Kurs kaufen.
4. Nicht handelbare Termine eindeutig definieren, beispielsweise letzter bekannter Kurs oder naechster verfuegbarer Kurs.
5. Historische Gebuehren, Entnahmen und Steuern konsistent einbeziehen.
6. Tests mit taeglichen Kursen und einer monatlichen Einzahlung ergaenzen: exakt eine Buchung pro Monat.

**Abnahme:** Ein taeglicher Kursverlauf mit 31 Datenpunkten und einer monatlichen Rate erzeugt genau eine Monatsrate, nicht 31.

### 3. Sparpause `continueInterestAccrual` umsetzen

**Befund:** Das Feld ist im Datenmodell und Editor vorhanden, wird aber in der Prognose nicht verwendet. Rendite laeuft auch bei deaktivierter Verzinsung weiter.

**Plan:**

1. Eine Hilfsfunktion fuer aktive Sparpausen pro Monat erstellen.
2. Vor der Renditeanwendung pruefen, ob mindestens eine relevante Pause die Verzinsung deaktiviert.
3. Bei deaktivierter Verzinsung Monatsrendite auf null setzen, ohne Einzahlungen, Zuschuesse oder Gebuehren pauschal zu beeinflussen.
4. Tests fuer eine Pause mit und ohne fortlaufende Verzinsung schreiben.

**Abnahme:** Die zwei Pausenoptionen erzeugen unterschiedliche, nachvollziehbare Endwerte.

### 4. Planstatus und manuelle Werte in der Engine definieren

**Befund:** `isActive`, `isArchived` und `currentManualValueCents` werden in der Berechnung nicht durchgaengig beruecksichtigt. Ein inaktiver Plan wird weiter projiziert; der manuelle Wert wird nur in der Sidebar angezeigt.

**Plan:**

1. Fachliche Semantik festlegen: inaktive Plaene buchen keine neuen Regeln, archivierte Plaene sind standardmaessig aus Vergleich und Diagramm ausgeschlossen, sofern nicht explizit sichtbar.
2. Optionalen manuellen Wert als Stichtagswert definieren oder das Feld aus der Berechnungslogik klar entkoppeln.
3. Die Entscheidung in Editor-Hilfetext und README dokumentieren.
4. Unit-Tests fuer Statuswechsel und manuellen Wert ergaenzen.

## Prioritaet 1: Vollstaendige Prompt-Abdeckung

### 5. CSV-Import bis zur Speicherung und Zuordnung abschliessen

**Befund:** CSV-Dateien werden geparst, aber nur als Anzahl gemeldet. Daten werden keinem Plan zugeordnet und nicht in IndexedDB gespeichert. Manuelle Spaltenzuordnung fehlt.

**Plan:**

1. Einen CSV-Importdialog mit Vorschau der ersten Zeilen erstellen.
2. Feldzuordnung fuer Datum, Open, High, Low, Close, Adjusted Close, Ausschuttung und Waehrung implementieren.
3. Bei Abschluss einen Zielplan waehlen oder einen neuen historischen Plan erzeugen.
4. `StoredMarketData` mit Plan-ID, Provider-ID und Importzeitpunkt speichern.
5. Historische Projektion nach Import automatisch neu berechnen.
6. Parser- und Komponenten-Tests fuer Semikolon/Komma, Dezimalkomma/-punkt und deutsche/ISO-Daten schreiben.

### 6. JSON-Import mit Vorschau und sicherem Entscheidungsdialog ausbauen

**Befund:** Die Validierung, Migration und Merge/Replace-Logik existieren. Die Auswahl erfolgt jedoch ueber `window.confirm`, ohne Vorschau von Plaenen, Kursdaten oder Konflikten.

**Plan:**

1. Einen eigenen zuganglichen Dialog statt `window.confirm` bauen.
2. Vor dem Schreiben Schema-Version, Exportdatum, Anzahl Plaene und Kursreihen anzeigen.
3. Merge-Konflikte bei identischen IDs sichtbar machen und eine Strategie anbieten: ersetzen, neue ID vergeben oder ueberspringen.
4. Fehlerdetails in einem aufklappbaren Bereich darstellen.
5. Tests fuer Vorschau, Replace, Merge und Konfliktstrategie ergaenzen.

### 7. Diagramm auf die spezifizierten Reihen und Markierungen erweitern

**Befund:** Das Diagramm zeigt derzeit Gesamtwert, Eigenbeitraege sowie Min/Max als Linien. Zuschuesse, Gewinne, Gebuehren, Steuern, Auszahlungen, Realwert, Gesamtsumme, Renditeband und Ereignismarkierungen fehlen. Vollbild und Zeitraum-Voreinstellungen fehlen ebenfalls.

**Plan:**

1. Sichtbare Reihen pro Kennzahl als schaltbare ECharts-Serien anbieten.
2. Gesamtwert, Einzahlungen und Gewinne als gestapelten Bereich visualisieren.
3. Min/Max als echte Bandflaeche um die Basisszenario-Linie rendern.
4. `markArea` fuer Sparpausen sowie `markPoint` fuer Einmalzahlungen und Beginn von Auszahlungen einsetzen.
5. Eine Aggregation aller sichtbaren Plaene implementieren.
6. Steuer- und Inflationsanzeige an die Plan-/App-Einstellungen anbinden.
7. Zeitraum-Schnellauswahl und Vollbild mit zuganglichem Rueckweg hinzufuegen.
8. Chart-Optionen per Unit-Test und Interaktion per Komponenten-/E2E-Test absichern.

### 8. Kennzahlen und Vergleich vollstaendig machen

**Befund:** KPI- und Vergleichsansicht decken derzeit nur einen Teil der geforderten Werte ab. Realwert, durchschnittliche Jahresrendite, Einstandskurs, Anteilanzahl, Enddatum, Restlaufzeit, Liquiditaet und garantierter Anteil fehlen.

**Plan:**

1. Ein zentral typisiertes `PlanSummary` aus dem ProjectionResult ableiten.
2. Historische Kennzahlen nur anzeigen, wenn historische Daten vorhanden sind.
3. Im Vergleich mindestens reale Kaufkraft, Laufzeit und Datenqualitaet ergaenzen.
4. Nicht modellierbare Kriterien wie Liquiditaet und garantierter Anteil als explizite, optionale Planattribute einfuehren statt Werte zu erfinden.
5. Formatierungs- und Edge-Case-Tests ergaenzen.

### 9. Szenarien als eigenstaendige Nutzerfunktion ausbauen

**Befund:** Duplizieren erzeugt eine Kopie mit `scenarioOfPlanId`, es gibt aber keine Benennung als Szenario, keine gruppierte Ansicht und keinen zielgerichteten Szenario-Workflow.

**Plan:**

1. Eine Aktion "Als Szenario erstellen" im Planmenue ergaenzen.
2. Szenario-Namen und Basisplan im Editor sichtbar machen.
3. Szenarien mit ihrem Original im Diagramm und Vergleich gruppieren.
4. Szenario-Kopien gegen spaetere Aenderungen des Originals bewusst entkoppeln oder eine explizite Synchronisationsaktion anbieten.
5. Tests fuer Kopie, Originalschutz und Gruppierung schreiben.

## Prioritaet 2: Bedienbarkeit, PWA und Datenintegritaet

### 10. Einstellungsoberflaeche, Theme und Save-Status implementieren

**Befund:** Theme, Locale und API-Schluessel existieren im Typ und Storage, aber nicht als sichtbare Einstellungen. Der gespeicherte Zeitpunkt wird nicht angezeigt. Der Dark Mode folgt nur der Systempraeferenz und respektiert die App-Einstellung nicht.

**Plan:**

1. Ein Einstellungsfenster fuer Theme (hell/dunkel/system), Waehrung, Diagramm-Steuern und lokale API-Schluessel erstellen.
2. Theme als Dokumentklasse oder Datenattribut anwenden und lokal persistieren.
3. Den letzten Speicherzeitpunkt aus Settings/LocalStorage anzeigen.
4. API-Schluessel nur lokal speichern, niemals exportieren, und CORS-Hinweise direkt an den Anbieter-Einstellungen anzeigen.
5. Tests fuer Theme- und Settings-Persistenz schreiben.

### 11. Nutzerfeedback: Toasts, Undo und robuste Fehlerzustaende

**Befund:** Es gibt einzelne Inline-Meldungen und Browser-Confirm, aber keine Toasts, keine Undo-Loeschfunktion, keine Skeletons und keine strukturierten technischen Fehlerdetails.

**Plan:**

1. Einen zentralen Toast-Provider einfuehren.
2. Geloeschte Plaene fuer einen begrenzten Zeitraum im Speicher halten und mit "Rueckgaengig" wiederherstellen.
3. Lade-Skeletons fuer Dashboard, Diagramm und Import erstellen.
4. Eine wiederverwendbare Fehlerkomponente mit Kurztext und aufklappbaren Details bereitstellen.
5. Speicherfehler von Dexie, Importfehler und Provider-/CORS-Fehler eindeutig zuordnen.

### 12. PWA unter Node 20 verifizieren und Update-/Install-Hinweise vollenden

**Befund:** Die PWA-Plugin-Konfiguration wird lokal mit Node 18 absichtlich deaktiviert; CI verwendet Node 20. Eine installierbare PWA wird daher lokal nicht erzeugt. Install- und Update-Hinweise fehlen im UI.

**Plan:**

1. Node 20 lokal oder in einem reproduzierbaren Container verwenden und den PWA-Build pruefen.
2. `virtual:pwa-register` nutzen, um Update-Verfuegbarkeit sichtbar zu machen.
3. Das `beforeinstallprompt`-Ereignis fuer einen eigenen Installationshinweis behandeln.
4. Manifest, Service Worker, Offline-Navigation und gespeicherte IndexedDB-Daten mit Browser-Tests pruefen.
5. Die Node-Versionsanforderung in `package.json` als `engines.node` dokumentieren.

### 13. Desktop und Mobile gezielt pruefen und Sidebar als echten Drawer umsetzen

**Befund:** Responsive CSS reduziert die Ansicht auf eine Spalte, aber es gibt keinen Drawer mit Fokusmanagement auf Mobilgeraeten. Lange Editor-Formulare sind nicht gezielt getestet.

**Plan:**

1. Mobile Sidebar als modalem Drawer mit Escape, Fokusfalle und Schliessen nach Auswahl umsetzen.
2. Editor-Regelkarten fuer schmale Breiten visuell pruefen und erforderlichenfalls in einspaltige Abschnitte zerlegen.
3. Mindestens Desktop- und Mobil-Screenshots in einem Browser-Test erfassen.
4. Tastaturbedienung der Tabs, Dialoge, Regelaktionen und Diagrammsteuerung pruefen.

## Prioritaet 3: Performance und Architektur

### 14. Berechnungen in einen Web Worker auslagern

**Befund:** Jede Speicherung berechnet alle Plaene synchron im React-Hook. Bei 100 Plaenen, langen Laufzeiten oder grossen historischen Reihen kann das die UI blockieren.

**Plan:**

1. Einen Worker-Client fuer `calculatePlanProjection` einfuehren.
2. Requests versionieren, damit veraltete Ergebnisse nach schnellen Aenderungen verworfen werden.
3. Lade- und Fehlerstatus im App-State abbilden.
4. Kleine Datenmengen weiterhin synchron oder ueber denselben Worker-Weg berechnen; API vereinheitlichen.
5. Benchmark-Test fuer 100 Plaene, 50 Jahre und grosse historische Reihen erstellen.

### 15. Chart-Downsampling und Lazy Loading

**Befund:** ECharts und alle Serien werden direkt geladen; historische Tagesdaten werden ohne Downsampling an das Diagramm gegeben.

**Plan:**

1. ECharts dynamisch importieren und eine platzsparende Ladeansicht anzeigen.
2. Ein Downsampling-Verfahren wie LTTB fuer lange Serien verwenden, ohne Endpunkte oder Ereignismarkierungen zu verlieren.
3. Seriendaten pro sichtbarem Zeitraum aufbereiten.
4. Eine Messung fuer Renderzeit und Speicherverbrauch dokumentieren.

### 16. Schema-Typen strenger und ohne Casts modellieren

**Befund:** Import und Storage verwenden mehrere `as unknown as`-Casts, weil Zod-Schemas einige Domain-Unions als `string` beschreiben. Das reduziert die Aussagekraft von Strict TypeScript.

**Plan:**

1. Zod-Enums aus den Domain-Werte-Listen ableiten.
2. `z.infer` gegen die Domain-Typen per Compile-Time-Check absichern.
3. Unsichere Casts in `exportImport.ts` und `indexedDbStorage.ts` entfernen.
4. Unbekannte Keys in Importobjekten konsequent ablehnen oder strippen.

## Prioritaet 4: Optionale Sicherheitsfunktion

### 17. Passwortgeschuetzten JSON-Export planen und implementieren

**Befund:** Der Export ist nur unverschluesselt. Das ist laut Prompt optional, fuer sensible Finanzdaten aber sinnvoll.

**Plan:**

1. Einen optionalen Exportmodus "Mit Passwort verschluesseln" anbieten.
2. Web Crypto mit PBKDF2, zufaelligem Salt, AES-GCM und zufaelligem IV verwenden.
3. Ein versioniertes, klar gekennzeichnetes verschluesseltes Exportformat definieren.
4. Passwoerter ausschliesslich im aktuellen Dialog halten und nie speichern.
5. Tests fuer korrekte Entschluesselung, falsches Passwort, manipulierte Daten und Kompatibilitaet mit unverschluesselten Exporten schreiben.

## Empfohlene Reihenfolge fuer den naechsten Prompt

1. P0-1 bis P0-3: Berechnungsfehler korrigieren und mit Regressionstests absichern.
2. CSV-Import bis zur Speicherung und historischen Projektion komplett schliessen.
3. JSON-Importdialog und Nutzerfeedback (Toasts/Undo) implementieren.
4. Diagramm, Kennzahlen und Vergleich entsprechend den fachlich korrekten Daten erweitern.
5. Einstellungen, PWA-Install/Update-UX und Mobile Drawer abschliessen.
6. Web Worker, Downsampling und Performance-Benchmarks einfuehren.
7. Verschluesselten Export als optionale Sicherheitsfunktion abschliessen.

## Abschluss-Checkliste fuer den naechsten Durchlauf

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build` mit Node 20, damit der PWA-Pfad mitgeprueft wird
- Manuelle Browserpruefung: Desktop, Mobil, Offline, JSON-Merge/Replace, CSV-Zuordnung, Install/Update
