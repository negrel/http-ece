import * as base64url from "https://deno.land/std@0.150.0/encoding/base64url.ts";
import { equals } from "https://deno.land/std@0.150.0/bytes/equals.ts";
import { assert } from "https://deno.land/std@0.150.0/testing/asserts.ts";

import { decrypt, encrypt } from "./ece.ts";
import { Header } from "./header.ts";
import { WithPaddingRecordIterable } from "./mod.ts";

Deno.test("encrypt/RFC8188/Example1", async () => {
  const input = new TextEncoder().encode("I am the walrus");
  const header = Header.fromBase64Url("I1BsxtFttlv3u_Oo94xnmwAAEAAA");
  const secret = base64url.decode("yqdlZ-tYemfogSmv7Ws5PQ");

  const result = await encrypt(input, secret, { header });

  assert(
    equals(
      new Uint8Array(result),
      base64url.decode(
        "I1BsxtFttlv3u_Oo94xnmwAAEAAA-NAVub2qFgBEuQKRapoZu-IxkIva3MEB1PD-ly8Thjg",
      ),
    ),
  );
});

Deno.test("encrypt/RFC8188/Example2", async () => {
  const input = new TextEncoder().encode("I am the walrus");
  const header = Header.fromBase64Url("uNCkWiNYzKTnBN9ji3-qWAAAABkCYTE");
  const secret = base64url.decode("BO3ZVPxUlnLORbVGMpbT1Q");
  const recordIterable = new WithPaddingRecordIterable(input, header.rs, 1);

  const result = await encrypt(recordIterable, secret, { header });

  assert(
    equals(
      new Uint8Array(result),
      base64url.decode(
        "uNCkWiNYzKTnBN9ji3-qWAAAABkCYTHOG8chz_gnvgOqdGYovxyjuqRyJFjEDyoF1Fvkj6hQPdPHI51OEUKEpgz3SsLWIqS_uA",
      ),
    ),
  );
});

Deno.test("decrypt/RFC8188/Example1", async () => {
  const input = base64url.decode(
    "I1BsxtFttlv3u_Oo94xnmwAAEAAA-NAVub2qFgBEuQKRapoZu-IxkIva3MEB1PD-ly8Thjg",
  );
  const secret = base64url.decode("yqdlZ-tYemfogSmv7Ws5PQ");

  const result = await decrypt(input.buffer, secret);

  assert(
    equals(
      new Uint8Array(result),
      base64url.decode(
        "SSBhbSB0aGUgd2FscnVz",
      ),
    ),
  );
});

Deno.test("decrypt/RFC8188/Example2", async () => {
  const input = base64url.decode(
    "uNCkWiNYzKTnBN9ji3-qWAAAABkCYTHOG8chz_gnvgOqdGYovxyjuqRyJFjEDyoF1Fvkj6hQPdPHI51OEUKEpgz3SsLWIqS_uA",
  );
  const secret = base64url.decode("BO3ZVPxUlnLORbVGMpbT1Q");

  const result = await decrypt(input.buffer, secret);

  assert(
    equals(
      new Uint8Array(result),
      base64url.decode(
        "SSBhbSB0aGUgd2FscnVz",
      ),
    ),
  );
});
