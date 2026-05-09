import type { ReactElement } from "react";
import { GlassConeIllo } from "./glassConeShared";
import type { CupIlloProps } from "./types";

/** Everyday tumbler-glass proportions. */
export function GlassIllo(props: CupIlloProps): ReactElement {
  return (
    <GlassConeIllo {...props} wide={48} top={64} tall={0.98} gradKey="glass" />
  );
}
