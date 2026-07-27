import { useEffect, useState } from 'react';

export const AppStatusBar = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className={`status-bar ${isOnline ? 'online' : 'offline'}`} role="status" aria-live="polite">
      {isOnline
        ? 'Online. Lokale Daten sind aktiv. Externe Marktdaten koennen je nach API/CORS variieren.'
        : 'Offline-Modus aktiv. Bereits gespeicherte lokale Daten bleiben verfuegbar.'}
    </div>
  );
};
