import { ArrowRight, BarChart3, Database, Globe2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface StartPageProps {
  onOpenPlanner: () => void;
}

type Language = 'de' | 'en';

const copy = {
  de: {
    language: 'Sprache',
    eyebrow: 'Privater Finanzplaner',
    title: 'Deine Finanzen. Klar geplant.',
    description: 'Erstelle Sparplaene, vergleiche Szenarien und verstehe, wie Einzahlungen, Zuschuesse, Steuern und Inflation dein Vermoegen beeinflussen.',
    openPlanner: 'Planer oeffnen',
    privacy: 'Deine Daten bleiben lokal in deinem Browser.',
    features: [
      { title: 'Verstaendliche Szenarien', text: 'Vergleiche Basis-, Mindest- und Maximalrenditen auf einen Blick.' },
      { title: 'Alles an einem Ort', text: 'Einzahlungen, Zuschuesse, Gebuehren und Entnahmen sauber aufgeschluesselt.' },
      { title: 'Private Daten', text: 'IndexedDB-Speicherung, Export und Import ohne Konto oder Tracking.' },
    ],
    notice: 'Simulation, keine Anlage- oder Steuerberatung.',
  },
  en: {
    language: 'Language',
    eyebrow: 'Private financial planner',
    title: 'Plan your money with clarity.',
    description: 'Create savings plans, compare scenarios, and understand how contributions, subsidies, taxes, and inflation shape your wealth.',
    openPlanner: 'Open planner',
    privacy: 'Your data stays locally in your browser.',
    features: [
      { title: 'Clear scenarios', text: 'Compare base, minimum, and maximum returns at a glance.' },
      { title: 'Everything in one place', text: 'Break down contributions, subsidies, fees, and withdrawals clearly.' },
      { title: 'Private by design', text: 'IndexedDB storage, export, and import without an account or tracking.' },
    ],
    notice: 'A planning simulation, not investment or tax advice.',
  },
} as const;

const featureIcons = [BarChart3, Database, ShieldCheck];

export const StartPage = ({ onOpenPlanner }: StartPageProps) => {
  const [language, setLanguage] = useState<Language>('de');
  const content = copy[language];

  return (
    <main className="start-page">
      <header className="start-nav">
        <div className="start-brand">
          <span className="start-brand-mark"><BarChart3 size={22} /></span>
          <span>Financial Planner</span>
        </div>
        <div className="language-switch" aria-label={content.language}>
          <button type="button" className={language === 'de' ? 'active' : ''} onClick={() => setLanguage('de')} aria-pressed={language === 'de'}>DE</button>
          <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
        </div>
      </header>

      <section className="start-hero">
        <div className="start-copy">
          <p className="start-eyebrow"><Globe2 size={16} /> {content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="start-description">{content.description}</p>
          <div className="start-actions">
            <button type="button" className="start-primary-action" onClick={onOpenPlanner}>
              {content.openPlanner} <ArrowRight size={18} />
            </button>
            <p><ShieldCheck size={17} /> {content.privacy}</p>
          </div>
        </div>

        <div className="start-visual" aria-hidden="true">
          <div className="visual-axis" />
          <span className="visual-bar visual-bar-one" />
          <span className="visual-bar visual-bar-two" />
          <span className="visual-bar visual-bar-three" />
          <span className="visual-bar visual-bar-four" />
          <span className="visual-line" />
        </div>
      </section>

      <section className="start-features" aria-label="Features">
        {content.features.map((feature, index) => {
          const Icon = featureIcons[index];
          return (
            <article key={feature.title}>
              <Icon size={21} />
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </article>
          );
        })}
      </section>

      <footer className="start-footer">{content.notice}</footer>
    </main>
  );
};