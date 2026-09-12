import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageLoadingFallback } from '../../components/PageLoadingFallback.jsx';

export function SettingsLayout() {
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
