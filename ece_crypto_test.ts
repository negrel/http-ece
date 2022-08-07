import { assert } from "./dev_deps.ts";
import { base64url, bytes } from "./deps.ts";

import { ECECrypto } from "./ece_crypto.ts";
import { Header } from "./header.ts";

Deno.test("ECECrypto/encryptRecord/RFC8188/Example1", async () => {
  const input = new TextEncoder().encode("I am the walrus");

  const header = Header.fromBase64Url(
    "I1BsxtFttlv3u_Oo94xnmwAAEAAA",
  );
  const secret = base64url.decode("yqdlZ-tYemfogSmv7Ws5PQ");

  const crypto = new ECECrypto(secret, { header });

  const record = await crypto.encryptRecord(
    bytes.concat(input, Uint8Array.of(0x02)), // add padding
    0,
  );

  assert(
    bytes.equals(
      new Uint8Array(record),
      base64url.decode("-NAVub2qFgBEuQKRapoZu-IxkIva3MEB1PD-ly8Thjg"),
    ),
  );
});

Deno.test("ECECrypto/encryptRecord/RFC8188/Example2", async () => {
  const input = new TextEncoder().encode("I am the walrus");

  const header = Header.fromBase64Url(
    "uNCkWiNYzKTnBN9ji3-qWAAAABkCYTE",
  );
  const secret = base64url.decode("BO3ZVPxUlnLORbVGMpbT1Q");
  const crypto = new ECECrypto(secret, { header });

  const firstRecord = await crypto.encryptRecord(
    bytes.concat(input.slice(0, 7), Uint8Array.of(0x01, 0x0)),
    0,
  );

  const secondRecord = await crypto.encryptRecord(
    bytes.concat(input.slice(7), Uint8Array.of(0x02)),
    1,
  );

  const result = bytes.concat(
    new Uint8Array(firstRecord),
    new Uint8Array(secondRecord),
  );

  assert(
    bytes.equals(
      result,
      base64url.decode(
        "zhvHIc_4J74DqnRmKL8co7qkciRYxA8qBdRb5I-oUD3TxyOdThFChKYM90rC1iKkv7g",
      ),
    ),
  );
});

Deno.test("ECECrypto/decryptRecord/RFC8188/Example1", async () => {
  const input = base64url.decode(
    "I1BsxtFttlv3u_Oo94xnmwAAEAAA-NAVub2qFgBEuQKRapoZu-IxkIva3MEB1PD-ly8Thjg",
  );

  const header = Header.fromBytes(input.buffer);
  const secret = base64url.decode("yqdlZ-tYemfogSmv7Ws5PQ");

  const crypto = new ECECrypto(secret, { header });

  const record = await crypto.decryptRecord(
    input.slice(header.byteLength),
    0,
  );

  assert(
    bytes.equals(
      new Uint8Array(record),
      base64url.decode("SSBhbSB0aGUgd2FscnVzAg"),
    ),
  );
});

Deno.test("ECECrypto/decryptRecord/RFC8188/Example2", async () => {
  const input = base64url.decode(
    "uNCkWiNYzKTnBN9ji3-qWAAAABkCYTHOG8chz_gnvgOqdGYovxyjuqRyJFjEDyoF1Fvkj6hQPdPHI51OEUKEpgz3SsLWIqS_uA",
  );

  const header = Header.fromBytes(input.buffer);

  const secret = base64url.decode("BO3ZVPxUlnLORbVGMpbT1Q");
  const crypto = new ECECrypto(secret, { header });

  const firstRecord = await crypto.decryptRecord(
    input.slice(header.byteLength, header.byteLength + header.rs),
    0,
  );

  const secondRecord = await crypto.decryptRecord(
    input.slice(header.byteLength + header.rs),
    1,
  );

  const result = bytes.concat(
    new Uint8Array(firstRecord),
    new Uint8Array(secondRecord),
  );

  assert(
    bytes.equals(
      result,
      base64url.decode(
        "SSBhbSB0aAEAZSB3YWxydXMC",
      ),
    ),
  );
});
