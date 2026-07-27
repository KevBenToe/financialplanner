# GitHub-Copilot-Master-Prompt: Finanz- und Sparplan-Simulator

Erstelle ein vollständiges, produktionsnahes Webprojekt für eine interaktive Finanz- und Sparplan-Simulation.

Die Anwendung soll vollständig clientseitig funktionieren, ohne eigenes Backend auskommen und über GitHub Pages veröffentlicht werden können. Sie soll zusätzlich als Progressive Web App installierbar und offline nutzbar sein.

Arbeite das Projekt vollständig aus. Erstelle alle benötigten Dateien, Komponenten, Typen, Tests, Konfigurationen und Dokumentationen. Verwende keine Platzhalter wie „TODO“ für zentrale Funktionen.

## 1. Technischer Stack

Verwende:

* React
* TypeScript mit aktiviertem Strict Mode
* Vite
* Apache ECharts für interaktive Diagramme
* vite-plugin-pwa für die installierbare PWA
* IndexedDB für die dauerhafte Datenspeicherung
* localStorage nur für kleine UI-Einstellungen
* Vitest für Unit-Tests
* React Testing Library für Komponenten-Tests
* ESLint
* Prettier
* GitHub Actions für Build, Tests und Deployment auf GitHub Pages

Die Anwendung muss als statische Single-Page-Application funktionieren.

Es darf kein eigener Server und keine eigene Datenbank benötigt werden.

## 2. Ziel der Anwendung

Die Anwendung soll Nutzern ermöglichen, mehrere Finanzprodukte und Sparpläne anzulegen, zu vergleichen und deren historische oder prognostizierte Wertentwicklung zu betrachten.

Beispiele:

* ETF-Sparplan
* Aktiendepot
* Tagesgeld
* Festgeld
* Rentenversicherung
* Riester-Rente
* betriebliche Altersvorsorge
* Fonds
* Kryptowährungen
* allgemeiner Sparplan
* manuell gepflegtes Finanzprodukt

Die Anwendung ist ein Simulations- und Planungstool und darf keine Anlageberatung versprechen.

## 3. Grundlayout

Erstelle ein modernes, übersichtliches und responsives Dashboard.

### Desktop

Die Seite besteht aus zwei Hauptbereichen:

#### Linke Sidebar – ungefähr 25 Prozent

Die Sidebar enthält:

* Liste aller angelegten Sparpläne
* Name des Sparplans
* Produkttyp
* aktueller oder berechneter Wert
* frei wählbare Farbe
* Sichtbarkeit im Diagramm
* Auswahl des aktiven Sparplans
* Bearbeiten-Schaltfläche
* Duplizieren-Schaltfläche
* Löschen-Schaltfläche
* großes Plus-Symbol zum Anlegen eines neuen Sparplans

Die Sidebar soll ein- und ausklappbar sein.

#### Rechter Hauptbereich – ungefähr 75 Prozent

Der Hauptbereich enthält:

* interaktives Diagramm
* Zeitraumsauswahl
* Zusammenfassung
* Kennzahlen
* Vergleichsansicht
* Einstellungen des ausgewählten Sparplans

### Mobile Ansicht

Auf kleineren Bildschirmen soll die Sidebar als Drawer oder ausklappbares Menü dargestellt werden.

Das Diagramm und alle Eingabemasken müssen mobil gut bedienbar sein.

## 4. Sparplan-Datenmodell

Definiere ein sauberes, typisiertes Datenmodell.

Ein Sparplan soll mindestens folgende Eigenschaften besitzen:

### Allgemeine Daten

* eindeutige ID
* Name
* Beschreibung
* Produkttyp
* Kategorie
* Farbe
* Währung, standardmäßig EUR
* Startdatum
* optionales Enddatum
* Anfangswert
* aktueller manueller Wert
* aktiv oder archiviert
* im Diagramm sichtbar oder ausgeblendet

### Sparraten

Unterstütze mehrere Einzahlungsregeln pro Sparplan.

Eine Einzahlungsregel besitzt:

* Betrag
* Startdatum
* optionales Enddatum
* Häufigkeit:

  * einmalig
  * wöchentlich
  * zweiwöchentlich
  * monatlich
  * quartalsweise
  * halbjährlich
  * jährlich
* Ausführung:

  * am Periodenanfang
  * am Periodenende
* optionale jährliche Erhöhung in Prozent
* optionale jährliche Erhöhung als fixer Betrag
* Beschreibung

Dadurch sollen beispielsweise folgende Änderungen abbildbar sein:

* zunächst 100 Euro monatlich
* ab 2028 dann 200 Euro monatlich
* zusätzliche jährliche Sonderzahlung
* dynamische Erhöhung der Sparrate

### Zuschüsse

Unterstütze mehrere Zuschussregeln:

* Arbeitgeberzuschuss
* staatliche Zulage
* Bonuszahlung
* sonstiger Zuschuss

Je Zuschuss:

* Bezeichnung
* Betrag
* Häufigkeit
* Startdatum
* Enddatum
* jährliche Erhöhung
* während Sparpausen weiterzahlen: ja oder nein

Eigenbeiträge und Zuschüsse müssen getrennt ausgewertet werden.

### Sparpausen

Ein Sparplan kann beliebig viele Sparpausen besitzen.

Je Sparpause:

* Startdatum
* Enddatum
* Bezeichnung
* eigene Einzahlungen pausieren
* Zuschüsse pausieren
* Gebühren pausieren
* Verzinsung läuft während der Pause weiter

Überlappende Pausen müssen korrekt behandelt werden.

### Rendite

Unterstütze zwei Berechnungsarten:

#### Prognosemodus

* minimale erwartete Jahresrendite
* mittlere erwartete Jahresrendite
* maximale erwartete Jahresrendite
* optional nur eine feste Rendite
* positive, negative und null Prozent zulassen
* Zinseszins berücksichtigen
* monatliche interne Berechnung
* effektive Jahresrendite korrekt in Monatsrendite umrechnen

Berechnung:

Monatsrendite = `(1 + Jahresrendite) ^ (1 / 12) - 1`

Die Renditebandbreite soll als Min-, Basis- und Max-Szenario dargestellt werden.

#### Historischer Modus

Ein Finanzprodukt kann mit folgenden Angaben verknüpft werden:

* ISIN
* WKN
* Ticker beziehungsweise Symbol
* Börsenplatz
* Name des Produkts
* Produktwährung
* Datenquelle
* optionaler Datenquellen-Identifier

Erstelle eine abstrahierte Schnittstelle für Marktdatenanbieter:

```ts
interface MarketDataProvider {
  id: string;
  name: string;
  searchProducts(query: string): Promise<FinancialProductSearchResult[]>;
  getHistoricalPrices(
    product: FinancialProductReference,
    startDate: string,
    endDate: string
  ): Promise<HistoricalPricePoint[]>;
}
```

Implementiere zunächst folgende Datenquellen:

1. Manueller Kursverlauf
2. CSV-Import
3. JSON-Import
4. Demo-Datenanbieter mit reproduzierbaren Beispieldaten
5. vorbereitete Adapterstruktur für externe APIs

Wichtig:

* Keine API-Schlüssel fest im Quellcode hinterlegen.
* API-Schlüssel optional über die Einstellungen im Browser speichern.
* Kennzeichne klar, dass Browserabfragen je nach Anbieter durch CORS oder API-Beschränkungen verhindert werden können.
* Die Anwendung muss auch ohne externen Marktdatenanbieter vollständig funktionieren.
* ISIN, WKN und Ticker sollen getrennt gespeichert werden.
* Da eine ISIN bei manchen Anbietern nicht direkt genügt, muss eine optionale Zuordnung zu Ticker und Börsenplatz möglich sein.

Beim historischen Modus sollen Einzahlungen zum jeweiligen historischen Kurs virtuelle Anteile kaufen.

Berechne:

* gekaufte Anteile
* Gesamtanzahl der Anteile
* durchschnittlichen Einstandskurs
* aktuellen Marktwert
* eigene Einzahlungen
* Zuschüsse
* Wertentwicklung
* realisierten und nicht realisierten Gewinn, soweit Daten vorhanden sind

## 5. Gebühren

Ein Sparplan kann mehrere Gebührenregeln besitzen.

Unterstütze:

* einmalige Abschlussgebühr
* einmalige Einrichtungsgebühr
* fixe monatliche Gebühr
* fixe jährliche Gebühr
* prozentuale jährliche Verwaltungsgebühr
* prozentuale Gebühr auf das verwaltete Vermögen
* Kaufgebühr je Einzahlung
* prozentuale Kaufgebühr
* Verkaufsgebühr
* individuelle sonstige Gebühr

Je Gebühr:

* Name
* Typ
* Betrag oder Prozentsatz
* Startdatum
* Enddatum
* Zahlungsrhythmus
* steuerlich relevant: ja oder nein

Gebühren müssen separat ausgewiesen werden.

## 6. Steuern

Implementiere eine einfache, konfigurierbare Steuersimulation.

Steuermodi:

* steuerfrei
* steuerpflichtig
* individuelle Steuerberechnung deaktiviert
* benutzerdefinierter Steuersatz

Einstellungen:

* persönlicher Steuersatz
* jährlicher Freibetrag
* Teilfreistellung in Prozent
* Kirchensteuer optional
* Steuern jährlich oder erst bei Auszahlung berücksichtigen
* Steuerberechnung im Diagramm ein- und ausblendbar

Die Steuerberechnung soll ausdrücklich als vereinfachte Simulation bezeichnet werden.

Keine länderspezifische Steuerberatung implementieren.

## 7. Inflation

Optional soll die Inflation berücksichtigt werden können.

Einstellungen:

* Inflation deaktiviert
* feste jährliche Inflationsrate
* minimale, mittlere und maximale Inflationsannahme

Zeige wahlweise:

* nominalen Wert
* inflationsbereinigten realen Wert
* heutige Kaufkraft des zukünftigen Vermögens

## 8. Auszahlungen

Unterstütze optionale Auszahlungsregeln:

* einmalige Entnahme
* monatliche Entnahme
* jährliche Entnahme
* prozentuale Entnahme
* Entnahmephase ab bestimmtem Datum
* Entnahme bis zu einem bestimmten Enddatum
* Entnahme bis das Kapital aufgebraucht ist

Damit sollen auch Renten- und Auszahlungspläne simuliert werden können.

## 9. Berechnungsmodul

Trenne die Finanzberechnung vollständig von der Benutzeroberfläche.

Erstelle beispielsweise:

```text
src/
  domain/
  calculation/
  storage/
  market-data/
  components/
  pages/
  hooks/
  utils/
  tests/
```

Die Berechnungs-Engine soll als pure TypeScript-Funktionen implementiert werden.

Sie darf nicht direkt auf React, DOM oder Browser Storage zugreifen.

### Berechnungsschritte

Berechne intern mindestens monatlich.

Pro Monat:

1. Anfangskapital bestimmen
2. prüfen, ob der Sparplan aktiv ist
3. Einzahlungen ermitteln
4. Zuschüsse ermitteln
5. Sparpausen berücksichtigen
6. Kauf- oder Transaktionsgebühren abziehen
7. Rendite anwenden
8. laufende Gebühren abziehen
9. Steuern berechnen
10. Auszahlungen berücksichtigen
11. Endkapital speichern

Erstelle für jeden Zeitpunkt einen Datenpunkt mit:

```ts
interface ProjectionPoint {
  date: string;
  ownContributions: number;
  subsidies: number;
  grossContributions: number;
  fees: number;
  taxes: number;
  withdrawals: number;
  gains: number;
  totalValue: number;
  realValue?: number;
}
```

Für Renditebereiche müssen separate Datensätze für Minimum, Basis und Maximum erzeugt werden.

Geldwerte intern nicht mit unkontrollierten Fließkommaoperationen verarbeiten.

Verwende entweder:

* Werte in Cent als Integer

oder

* eine geeignete Decimal-Bibliothek

Runde erst an definierten Stellen.

## 10. Diagramm

Erstelle ein hochwertiges, interaktives ECharts-Diagramm.

Darstellbare Datenreihen:

* Gesamtwert
* eigene Einzahlungen
* Zuschüsse
* erwirtschaftete Rendite
* Gebühren
* Steuern
* Auszahlungen
* nominaler Wert
* inflationsbereinigter Wert
* Min-Szenario
* Basis-Szenario
* Max-Szenario

Das Diagramm soll folgende Funktionen besitzen:

* Zoom
* horizontales Verschieben
* Touch-Unterstützung
* Tooltip beim Überfahren
* Legende zum Ein- und Ausblenden
* frei wählbarer Zeitraum
* Jahres-, Monats- und Tagesdarstellung, soweit Daten vorhanden sind
* Download als PNG
* Vollbildmodus
* Vergleich mehrerer Sparpläne
* Gesamtsumme aller sichtbaren Sparpläne
* gestapelter Bereich für Einzahlungen und Wertzuwachs
* Renditeband zwischen Minimum und Maximum
* Markierungen für Sparpausen
* Markierungen für Einmalzahlungen
* Markierungen für Beginn der Auszahlungsphase

Der Tooltip zeigt mindestens:

* Datum
* Gesamtwert
* eigene Einzahlungen
* Zuschüsse
* Gebühren
* Steuern
* Gewinne
* prozentuale Wertentwicklung

## 11. Kennzahlen

Zeige oberhalb oder unterhalb des Diagramms übersichtliche Kennzahlenkarten:

* aktueller Wert
* prognostizierter Endwert
* eigene Einzahlungen
* Zuschüsse
* gesamte Einzahlungen
* erwirtschafteter Gewinn
* Rendite in Prozent
* gezahlte Gebühren
* gezahlte Steuern
* realer inflationsbereinigter Wert
* durchschnittliche jährliche Rendite
* interner Zinsfuß beziehungsweise XIRR, soweit berechenbar
* durchschnittlicher Einstandskurs
* Enddatum
* verbleibende Laufzeit

Alle Geldwerte im deutschen Zahlenformat darstellen, beispielsweise:

* 12.345,67 €
* 4,50 %

Verwende `Intl.NumberFormat` mit Locale `de-DE`.

## 12. Sparplan-Editor

Der Editor soll als übersichtlicher Dialog oder separater Bereich umgesetzt werden.

Unterteile ihn in Tabs oder Abschnitte:

1. Allgemein
2. Einzahlungen
3. Zuschüsse
4. Rendite und Marktdaten
5. Sparpausen
6. Gebühren
7. Steuern
8. Inflation
9. Auszahlungen
10. Vorschau

Verwende verständliche Beschriftungen und Hilfetexte.

Validiere alle Eingaben.

Beispiele:

* Enddatum darf nicht vor dem Startdatum liegen.
* Eine Sparpause braucht Start- und Enddatum.
* Prozentwerte müssen in einem sinnvollen Bereich liegen.
* Beträge dürfen grundsätzlich nicht negativ sein, außer bei ausdrücklich erlaubten Entnahmen.
* Leere Namen sind nicht zulässig.
* Überlappende Regeln müssen entweder unterstützt oder verständlich angezeigt werden.

## 13. Datenhaltung

Speichere die Daten lokal im Browser.

Verwende IndexedDB für:

* Sparpläne
* historische Kurse
* Einstellungen
* Szenarien
* importierte Dateien

Implementiere eine Storage-Abstraktion, damit die Speichertechnik später austauschbar bleibt.

Beispiel:

```ts
interface FinanceStorage {
  getPlans(): Promise<SavingsPlan[]>;
  savePlan(plan: SavingsPlan): Promise<void>;
  deletePlan(id: string): Promise<void>;
  exportData(): Promise<FinanceAppExport>;
  importData(data: FinanceAppExport): Promise<void>;
}
```

## 14. JSON-Import und Export

Die komplette Anwendung muss als JSON-Datei gesichert und wiederhergestellt werden können.

Der Export enthält:

* Schema-Version
* Exportdatum
* Anwendungsversion
* Sparpläne
* historische Daten
* Einstellungen

Beispiel:

```ts
interface FinanceAppExport {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  plans: SavingsPlan[];
  marketData: StoredMarketData[];
  settings: AppSettings;
}
```

Implementiere:

* JSON herunterladen
* JSON hochladen
* Vorschau vor dem Import
* Validierung
* Warnung vor dem Überschreiben vorhandener Daten
* Zusammenführen mit vorhandenen Daten
* vollständiges Ersetzen
* automatische Migration älterer Schema-Versionen
* verständliche Fehlermeldungen bei ungültigen Dateien

## 15. CSV-Import

Erstelle einen flexiblen CSV-Import für historische Kurse.

Unterstützte Spalten:

* Datum
* Eröffnungskurs
* Höchstkurs
* Tiefstkurs
* Schlusskurs
* bereinigter Schlusskurs
* Ausschüttung
* Währung

Der Nutzer soll Spalten manuell zuordnen können.

Unterstütze deutsche und internationale Formate:

* `31.12.2025`
* `2025-12-31`
* Dezimalkomma
* Dezimalpunkt
* Semikolon
* Komma

## 16. Szenarien

Nutzer sollen mehrere Szenarien eines Sparplans vergleichen können.

Beispiele:

* konservativ
* realistisch
* optimistisch
* Vertrag behalten
* Vertrag beitragsfrei stellen
* Vertrag kündigen und in ETF umschichten
* Sparrate erhöhen
* Sparrate reduzieren

Ein Szenario soll einen bestehenden Sparplan kopieren, ohne den ursprünglichen Plan zu verändern.

Zeige Szenarien im gleichen Diagramm an.

## 17. Vergleichsfunktionen

Erstelle eine Vergleichsansicht für bis zu fünf Sparpläne oder Szenarien.

Vergleiche:

* Endwert
* Einzahlungen
* Zuschüsse
* Gebühren
* Steuern
* Gewinn
* reale Kaufkraft
* Rendite
* Laufzeit
* Liquidität
* garantierter und nicht garantierter Anteil

Erstelle zusätzlich eine tabellarische Ansicht.

## 18. Bedienung und Design

Verwende ein modernes, ruhiges Finanz-Dashboard-Design.

Anforderungen:

* Light Mode
* Dark Mode
* Systemmodus
* gut lesbare Typografie
* ausreichende Kontraste
* Tastaturbedienung
* ARIA-Attribute
* sichtbare Fokuszustände
* keine unnötigen Animationen
* Skeleton Loading für längere Berechnungen
* Toast-Nachrichten
* Bestätigungsdialoge für Löschvorgänge
* Undo-Funktion nach dem Löschen
* automatische Speicherung
* Hinweis, wann zuletzt gespeichert wurde

Vermeide überladene Formulare.

Verwende Cards, Tabs, Akkordeons und Tooltips sinnvoll.

## 19. Startseite und Beispieldaten

Beim ersten Start soll der Nutzer wählen können:

* leeres Projekt starten
* Beispieldaten laden
* JSON-Sicherung importieren

Erstelle mindestens folgende Demo-Sparpläne:

1. ETF-Sparplan mit 10.000 Euro Anfangskapital und 500 Euro monatlicher Sparrate
2. Rentenversicherung mit monatlicher Einzahlung, Gebühren und fester Laufzeit
3. betriebliche Altersvorsorge mit Eigenanteil und Arbeitgeberzuschuss
4. Tagesgeldkonto mit variabler Verzinsung
5. Sparplan mit einer einjährigen Sparpause

Die Beispieldaten müssen deutlich als Demo-Daten gekennzeichnet sein.

## 20. PWA

Die Anwendung soll installierbar sein.

Implementiere:

* Web App Manifest
* Service Worker
* Offline-Unterstützung
* App-Icons
* Installationshinweis
* Update-Hinweis bei neuer Version
* verständliche Offline-Anzeige
* Cache-Strategie für statische Dateien

Externe Marktdaten müssen nicht offline abrufbar sein. Bereits gespeicherte Kursdaten sollen offline verfügbar bleiben.

## 21. GitHub Pages

Konfiguriere das Projekt für GitHub Pages.

Beachte den korrekten Base-Pfad von Vite.

Die Anwendung muss auch funktionieren, wenn sie unter folgender Struktur veröffentlicht wird:

```text
https://BENUTZERNAME.github.io/REPOSITORY-NAME/
```

Verwende entweder eine konfigurierbare Umgebungsvariable oder leite den Base-Pfad sauber aus der Deployment-Konfiguration ab.

Erstelle einen GitHub-Actions-Workflow:

```text
.github/workflows/deploy.yml
```

Der Workflow soll:

1. Repository auschecken
2. passende Node.js-LTS-Version installieren
3. Abhängigkeiten installieren
4. TypeScript prüfen
5. Linter ausführen
6. Tests ausführen
7. Anwendung bauen
8. Build-Artefakt hochladen
9. auf GitHub Pages veröffentlichen

Erstelle zusätzlich eine verständliche Anleitung in der README.

## 22. Datenschutz und Sicherheit

Da Finanzdaten sensibel sind:

* alle Daten standardmäßig nur lokal speichern
* keine Telemetrie
* kein Tracking
* keine Werbung
* keine Daten ohne Zustimmung übertragen
* keine API-Schlüssel im Repository speichern
* keine geheimen Daten in URL-Parametern speichern
* Importdateien validieren
* keine beliebigen HTML-Inhalte aus Dateien rendern
* Schutz vor Prototype Pollution beim JSON-Import
* klarer Hinweis, dass das Löschen der Browserdaten lokale Finanzdaten entfernen kann
* regelmäßigen JSON-Export als Sicherung empfehlen

Optional soll der JSON-Export mit einem Passwort verschlüsselt werden können.

Falls eine Verschlüsselung umgesetzt wird, verwende die Browser Web Crypto API und eine etablierte Kombination wie:

* PBKDF2
* AES-GCM
* zufälliges Salt
* zufälligen Initialisierungsvektor

Das Passwort darf nicht gespeichert werden.

## 23. Tests

Erstelle Unit-Tests für mindestens folgende Fälle:

* monatliche Einzahlung
* wöchentliche Einzahlung
* jährliche Einzahlung
* einmalige Einzahlung
* Arbeitgeberzuschuss
* jährliche staatliche Zulage
* Sparpause
* mehrere Sparpausen
* negative Rendite
* null Prozent Rendite
* Min-, Basis- und Max-Szenario
* Gebühren
* Steuerfreistellung
* Freibetrag
* Inflation
* einmalige Auszahlung
* regelmäßige Auszahlung
* historische Anteilskäufe
* JSON-Export
* JSON-Import
* Schema-Migration
* ungültige Importdatei
* Schaltjahre
* Startdatum am Monatsende
* Rundung von Centbeträgen

Verwende reproduzierbare Testdaten.

## 24. Performance

Die Anwendung soll auch mit folgenden Daten flüssig funktionieren:

* 100 Sparpläne
* 50 Jahre Projektionszeitraum
* tägliche historische Kursdaten
* mehrere Szenarien

Nutze bei Bedarf:

* Memoization
* Web Worker für umfangreiche Berechnungen
* Downsampling für sehr große Diagramm-Datensätze
* Lazy Loading
* virtuelle Listen

Die UI darf während längerer Berechnungen nicht einfrieren.

## 25. Fehlerbehandlung

Implementiere verständliche Fehlermeldungen für:

* ungültige Daten
* fehlende Kursdaten
* API-Fehler
* CORS-Fehler
* falschen API-Schlüssel
* Importfehler
* beschädigte JSON-Dateien
* nicht unterstützte Schema-Version
* Speicherfehler
* zu wenig Browser-Speicher
* Berechnungsfehler

Technische Details sollen optional aufklappbar sein.

## 26. Projektstruktur

Erstelle eine klare Projektstruktur, beispielsweise:

```text
finance-planner/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── icons/
│   └── manifest-assets/
├── src/
│   ├── app/
│   ├── components/
│   ├── calculation/
│   ├── domain/
│   ├── hooks/
│   ├── market-data/
│   ├── pages/
│   ├── storage/
│   ├── styles/
│   ├── tests/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── README.md
└── LICENSE
```

## 27. README

Die README soll enthalten:

* Beschreibung der Anwendung
* Screenshots-Platzhalter
* Funktionsübersicht
* Datenschutz-Hinweis
* lokale Installation
* Entwicklungsstart
* Tests
* Produktions-Build
* GitHub-Pages-Deployment
* PWA-Installation
* JSON-Import und Export
* CSV-Import
* Marktdatenanbieter
* Umgang mit API-Schlüsseln
* bekannte Einschränkungen
* Hinweis, dass es sich nicht um Anlage- oder Steuerberatung handelt

## 28. Lizenz

Verwende standardmäßig die MIT-Lizenz.

## 29. Vorgehensweise

Arbeite in diesen Schritten:

1. Projekt initialisieren
2. Datenmodell erstellen
3. Berechnungs-Engine implementieren
4. Unit-Tests für die Berechnung schreiben
5. Browser-Speicherung implementieren
6. Grundlayout erstellen
7. Sparplan-Editor implementieren
8. Diagramm implementieren
9. Vergleichs- und Szenariofunktionen erstellen
10. JSON- und CSV-Import umsetzen
11. PWA konfigurieren
12. GitHub-Pages-Deployment einrichten
13. Dokumentation vervollständigen
14. abschließenden Build, Typecheck, Lint und Tests durchführen

Beginne mit einer kurzen Übersicht über Architektur und Datenfluss. Erstelle danach direkt die Dateien.

Frage nicht nach jeder Datei um Bestätigung. Triff bei kleineren offenen Punkten sinnvolle Entscheidungen und dokumentiere sie.

## 30. Abnahmekriterien

Das Projekt ist fertig, wenn:

* es mit `npm install` installiert werden kann
* es mit `npm run dev` lokal startet
* `npm run build` erfolgreich ist
* `npm run test` erfolgreich ist
* `npm run lint` erfolgreich ist
* mehrere Sparpläne angelegt werden können
* Sparpläne über das Plus-Symbol hinzugefügt werden können
* Daten nach einem Browser-Neustart erhalten bleiben
* Daten als JSON exportiert und importiert werden können
* historische Kurse per CSV importiert werden können
* eigene Einzahlungen und Gewinne getrennt dargestellt werden
* Zuschüsse separat dargestellt werden
* Sparpausen korrekt berechnet werden
* Min-, Basis- und Max-Rendite sichtbar sind
* die Anwendung offline geöffnet werden kann
* die Anwendung auf GitHub Pages funktioniert
* Desktop- und Mobilansicht nutzbar sind
* keine geheimen API-Schlüssel im Repository enthalten sind
* die wichtigsten Berechnungen durch Tests abgesichert sind
