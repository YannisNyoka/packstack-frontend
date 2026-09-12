import { lazy, Suspense, useEffect, useState } from 'react';
import * as bookingApi from '../api/publicBooking.js';

// Lazy per-template: a tenant only ever renders the one template they
// picked, but the old static-import map pulled all 26 components (plus
// their CSS modules) into every page's bundle regardless - the single
// biggest contributor to the app's JS payload. Each import() becomes its
// own chunk, fetched only when that specific template is actually chosen.
const TEMPLATES = {
  classic: lazy(() => import('./landingTemplates/ClassicTemplate.jsx').then((m) => ({ default: m.ClassicTemplate }))),
  modern: lazy(() => import('./landingTemplates/ModernTemplate.jsx').then((m) => ({ default: m.ModernTemplate }))),
  elegant: lazy(() => import('./landingTemplates/ElegantTemplate.jsx').then((m) => ({ default: m.ElegantTemplate }))),
  bold: lazy(() => import('./landingTemplates/BoldTemplate.jsx').then((m) => ({ default: m.BoldTemplate }))),
  minimal: lazy(() => import('./landingTemplates/MinimalTemplate.jsx').then((m) => ({ default: m.MinimalTemplate }))),
  editorial: lazy(() => import('./landingTemplates/EditorialTemplate.jsx').then((m) => ({ default: m.EditorialTemplate }))),
  luxe: lazy(() => import('./landingTemplates/LuxeTemplate.jsx').then((m) => ({ default: m.LuxeTemplate }))),
  boutique: lazy(() => import('./landingTemplates/BoutiqueTemplate.jsx').then((m) => ({ default: m.BoutiqueTemplate }))),
  studio: lazy(() => import('./landingTemplates/StudioTemplate.jsx').then((m) => ({ default: m.StudioTemplate }))),
  glow: lazy(() => import('./landingTemplates/GlowTemplate.jsx').then((m) => ({ default: m.GlowTemplate }))),
  heritage: lazy(() => import('./landingTemplates/HeritageTemplate.jsx').then((m) => ({ default: m.HeritageTemplate }))),
  loft: lazy(() => import('./landingTemplates/LoftTemplate.jsx').then((m) => ({ default: m.LoftTemplate }))),
  petal: lazy(() => import('./landingTemplates/PetalTemplate.jsx').then((m) => ({ default: m.PetalTemplate }))),
  noir: lazy(() => import('./landingTemplates/NoirTemplate.jsx').then((m) => ({ default: m.NoirTemplate }))),
  horizon: lazy(() => import('./landingTemplates/HorizonTemplate.jsx').then((m) => ({ default: m.HorizonTemplate }))),
  aura: lazy(() => import('./landingTemplates/AuraTemplate.jsx').then((m) => ({ default: m.AuraTemplate }))),
  marble: lazy(() => import('./landingTemplates/MarbleTemplate.jsx').then((m) => ({ default: m.MarbleTemplate }))),
  canvas: lazy(() => import('./landingTemplates/CanvasTemplate.jsx').then((m) => ({ default: m.CanvasTemplate }))),
  velvet: lazy(() => import('./landingTemplates/VelvetTemplate.jsx').then((m) => ({ default: m.VelvetTemplate }))),
  pulse: lazy(() => import('./landingTemplates/PulseTemplate.jsx').then((m) => ({ default: m.PulseTemplate }))),
  linen: lazy(() => import('./landingTemplates/LinenTemplate.jsx').then((m) => ({ default: m.LinenTemplate }))),
  sidebar: lazy(() => import('./landingTemplates/SidebarTemplate.jsx').then((m) => ({ default: m.SidebarTemplate }))),
  neon: lazy(() => import('./landingTemplates/NeonTemplate.jsx').then((m) => ({ default: m.NeonTemplate }))),
  terrazzo: lazy(() => import('./landingTemplates/TerrazzoTemplate.jsx').then((m) => ({ default: m.TerrazzoTemplate }))),
  neumorphic: lazy(() => import('./landingTemplates/NeumorphicTemplate.jsx').then((m) => ({ default: m.NeumorphicTemplate }))),
  flare: lazy(() => import('./landingTemplates/FlareTemplate.jsx').then((m) => ({ default: m.FlareTemplate }))),
};

/**
 * Dispatches to the tenant's chosen landing-page template (see
 * ThemeConfig.template / components/landingTemplates/) - reused two ways:
 * the real public route (pages/LandingPage.jsx, fetches theme from the API,
 * knows the logged-in customer) and the live preview in Settings > Branding
 * (fed the in-progress, unsaved form state instead, no logged-in customer
 * to speak of) - see BrandingSettingsPage.jsx.
 *
 * Services/staff are fetched here once, regardless of which template ends
 * up rendering - simpler than conditional per-template fetching, and both
 * lists are typically small for a single salon. Templates that don't show
 * this content (e.g. Minimal's staff-less layout) just ignore the props.
 */
export function LandingPreview({ theme, customer = null }) {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    bookingApi.listServices().then(setServices).catch(() => {});
    bookingApi.listStaff().then(setStaff).catch(() => {});
  }, []);

  const Template = TEMPLATES[theme?.template] || TEMPLATES.classic;
  return (
    <Suspense fallback={null}>
      <Template theme={theme} customer={customer} services={services} staff={staff} />
    </Suspense>
  );
}
