import type { ReactElement } from "react";
import { GlassConeIllo } from "./glassConeShared";
import type { CupIlloProps } from "./types";

/** Short thick cone — shot volume. */
export function ShotGlassIllo(props: CupIlloProps): ReactElement {
  return (
    <GlassConeIllo {...props} wide={44} top={78} tall={1} gradKey="shot" />
  );
}
