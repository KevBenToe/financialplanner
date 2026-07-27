import { useState } from 'react';

import { StartPage } from './components/StartPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  const [plannerOpen, setPlannerOpen] = useState(false);

  return plannerOpen ? <DashboardPage /> : <StartPage onOpenPlanner={() => setPlannerOpen(true)} />;
}

export default App;
