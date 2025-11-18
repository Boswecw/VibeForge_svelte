/// <reference types="vite/client" />

// Image asset type declarations
declare module "*.avif" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.ico" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

// Specific declarations for $lib path alias
declare module "$lib/assets/*.avif" {
  const src: string;
  export default src;
}

declare module "$lib/assets/*.png" {
  const src: string;
  export default src;
}

declare module "$lib/assets/*.jpg" {
  const src: string;
  export default src;
}

declare module "$lib/assets/*.jpeg" {
  const src: string;
  export default src;
}

declare module "$lib/assets/*.svg" {
  const src: string;
  export default src;
}

declare module "$lib/assets/*.webp" {
  const src: string;
  export default src;
}

declare module "$lib/assets/*.ico" {
  const src: string;
  export default src;
}

declare module "$lib/assets/*.gif" {
  const src: string;
  export default src;
}

