import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageLoadingFallback } from '../../components/PageLoadingFallback.jsx';
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary.jsx';

export function SettingsLayout() {
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <RouteErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </RouteErrorBoundary>
    </div>
  );
}
