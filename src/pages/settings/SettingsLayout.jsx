import { Outlet } from 'react-router-dom';

export function SettingsLayout() {
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <Outlet />
    </div>
  );
}
