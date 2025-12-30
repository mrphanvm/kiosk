// Type declarations for importing SVG files in TypeScript
// Allows both default import (string URL) and named ReactComponent import
// Example usages:
// import icon from './icon.svg';
// import { ReactComponent as Icon } from './icon.svg';

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}
