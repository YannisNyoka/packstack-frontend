import { useEffect, useState } from 'react';
import * as bookingApi from '../api/publicBooking.js';
import { ClassicTemplate } from './landingTemplates/ClassicTemplate.jsx';
import { ModernTemplate } from './landingTemplates/ModernTemplate.jsx';
import { ElegantTemplate } from './landingTemplates/ElegantTemplate.jsx';
import { BoldTemplate } from './landingTemplates/BoldTemplate.jsx';
import { MinimalTemplate } from './landingTemplates/MinimalTemplate.jsx';
import { EditorialTemplate } from './landingTemplates/EditorialTemplate.jsx';

const TEMPLATES = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  elegant: ElegantTemplate,
  bold: BoldTemplate,
  minimal: MinimalTemplate,
  editorial: EditorialTemplate,
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
