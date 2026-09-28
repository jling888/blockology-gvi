import React from 'react';
import PublicStreetscapeApp from './PublicStreetscapeApp';
import ResearchApp from './ResearchApp';

/**
 * Public app is the default product surface.
 *
 * The inherited research/government workbench remains available only through
 * an internal diagnostic URL parameter (`?mode=research`) while the public
 * VM→VLM backend is built. This is a UI routing convenience, not access
 * control; production authorization must be implemented separately if the
 * research workbench is deployed outside a trusted environment.
 */
export default function App() {
  const search = new URLSearchParams(window.location.search);
  const internalResearchMode = search.get('mode') === 'research';

  if (internalResearchMode) {
    return <ResearchApp />;
  }

  return <PublicStreetscapeApp />;
}
