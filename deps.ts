export { crypto } from "https://deno.land/std@0.156.0/crypto/mod.ts";
export * as base64url from "https://deno.land/std@0.156.0/encoding/base64url.ts";
export * as base64 from "https://deno.land/std@0.156.0/encoding/base64.ts";

import * as bytesMod from "https://deno.land/std@0.156.0/bytes/mod.ts";
import { equalsNaive } from "https://deno.land/std@0.156.0/bytes/equals.ts";
export const bytes = {
  ...bytesMod,
  equalsNaive,
};
