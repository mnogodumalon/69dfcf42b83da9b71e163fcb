import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import MitarbeiterverwaltungPage from '@/pages/MitarbeiterverwaltungPage';
import SchichtplanungPage from '@/pages/SchichtplanungPage';
import SchichtdefinitionenPage from '@/pages/SchichtdefinitionenPage';
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="mitarbeiterverwaltung" element={<MitarbeiterverwaltungPage />} />
              <Route path="schichtplanung" element={<SchichtplanungPage />} />
              <Route path="schichtdefinitionen" element={<SchichtdefinitionenPage />} />
              <Route path="admin" element={<AdminPage />} />
              {/* <custom:routes> */}
              {/* </custom:routes> */}
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
