/**
 * Where the business name TEXT renders - the logo (if set) always shows
 * wherever a template puts it, independent of this setting; this only
 * controls the "{businessName}" string itself. Defaults to 'both', the
 * original fixed behavior every template had before ThemeConfig.
 * businessNamePosition existed - see BrandingSettingsPage.jsx.
 */
export function businessNameVisibility(theme) {
  const position = theme?.businessNamePosition || 'both';
  return {
    showInNav: position !== 'hero',
    showInHero: position !== 'nav',
  };
}
