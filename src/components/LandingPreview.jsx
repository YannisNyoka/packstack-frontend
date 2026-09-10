import { useEffect, useState } from 'react';
import * as bookingApi from '../api/publicBooking.js';
import { ClassicTemplate } from './landingTemplates/ClassicTemplate.jsx';
import { ModernTemplate } from './landingTemplates/ModernTemplate.jsx';
import { ElegantTemplate } from './landingTemplates/ElegantTemplate.jsx';
import { BoldTemplate } from './landingTemplates/BoldTemplate.jsx';
import { MinimalTemplate } from './landingTemplates/MinimalTemplate.jsx';
import { EditorialTemplate } from './landingTemplates/EditorialTemplate.jsx';
import { LuxeTemplate } from './landingTemplates/LuxeTemplate.jsx';
import { BoutiqueTemplate } from './landingTemplates/BoutiqueTemplate.jsx';
import { StudioTemplate } from './landingTemplates/StudioTemplate.jsx';
import { GlowTemplate } from './landingTemplates/GlowTemplate.jsx';
import { HeritageTemplate } from './landingTemplates/HeritageTemplate.jsx';
import { LoftTemplate } from './landingTemplates/LoftTemplate.jsx';
import { PetalTemplate } from './landingTemplates/PetalTemplate.jsx';
import { NoirTemplate } from './landingTemplates/NoirTemplate.jsx';
import { HorizonTemplate } from './landingTemplates/HorizonTemplate.jsx';
import { AuraTemplate } from './landingTemplates/AuraTemplate.jsx';
import { MarbleTemplate } from './landingTemplates/MarbleTemplate.jsx';
import { CanvasTemplate } from './landingTemplates/CanvasTemplate.jsx';
import { VelvetTemplate } from './landingTemplates/VelvetTemplate.jsx';
import { PulseTemplate } from './landingTemplates/PulseTemplate.jsx';
import { LinenTemplate } from './landingTemplates/LinenTemplate.jsx';
import { SidebarTemplate } from './landingTemplates/SidebarTemplate.jsx';
import { NeonTemplate } from './landingTemplates/NeonTemplate.jsx';
import { TerrazzoTemplate } from './landingTemplates/TerrazzoTemplate.jsx';
import { NeumorphicTemplate } from './landingTemplates/NeumorphicTemplate.jsx';

const TEMPLATES = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  elegant: ElegantTemplate,
  bold: BoldTemplate,
  minimal: MinimalTemplate,
  editorial: EditorialTemplate,
  luxe: LuxeTemplate,
  boutique: BoutiqueTemplate,
  studio: StudioTemplate,
  glow: GlowTemplate,
  heritage: HeritageTemplate,
  loft: LoftTemplate,
  petal: PetalTemplate,
  noir: NoirTemplate,
  horizon: HorizonTemplate,
  aura: AuraTemplate,
  marble: MarbleTemplate,
  canvas: CanvasTemplate,
  velvet: VelvetTemplate,
  pulse: PulseTemplate,
  linen: LinenTemplate,
  sidebar: SidebarTemplate,
  neon: NeonTemplate,
  terrazzo: TerrazzoTemplate,
  neumorphic: NeumorphicTemplate,
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

  const Template = TEMPLATES[theme?.template] || ClassicTemplate;
  return <Template theme={theme} customer={customer} services={services} staff={staff} />;
}
