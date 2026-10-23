// react-dom ships no type declarations and @types/react-dom is not a
// dependency; the tests only need renderToStaticMarkup.
declare module "react-dom/server" {
  import type { ReactElement } from "react";
  export function renderToStaticMarkup(element: ReactElement): string;
}
