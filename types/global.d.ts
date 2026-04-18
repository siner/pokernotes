// Type declarations for assets and special modules

// CSS modules and global CSS imports
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// SVG imports (future use)
declare module '*.svg' {
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
