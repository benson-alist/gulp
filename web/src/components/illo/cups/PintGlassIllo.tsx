import type { ReactElement } from "react";
import { GlassConeIllo } from "./glassConeShared";
import type { CupIlloProps } from "./types";

/** Taller mild taper — pint silhouette. */
export function PintGlassIllo(props: CupIlloProps): ReactElement {
  return (
    <GlassConeIllo {...props} wide={50} top={62} tall={1.05} gradKey="pint" />
  );
}
