import {
  assert,
  assertEquals,
  assertFalse,
  assertNotEquals,
  assertThrows,
} from "./dev_deps.ts";
import { bytes, decodeBase64Url } from "./deps.ts";

import { DEFAULT_RECORD_SIZE, SALT_LENGTH } from "./const.ts";
import { Header, RecordSizeError } from "./header.ts";
import { Salt } from "./salt.ts";

Deno.test("Header/constructor/default", () => {
  const h = new Header({});
  assert(h.rs === DEFAULT_RECORD_SIZE);
  assert(h.keyid.length === 0);
  assertFalse(h.salt === null);
  assertFalse(h.salt.equals(new Salt(new Uint8Array(SALT_LENGTH))));
});

Deno.test("Header/constructor/InvalidRecordSize", () => {
  assertThrows(() => {
    new Header({ rs: 0 });
  }, RecordSizeError);

  // Min value
  new Header({ rs: 18 });
  // Max value
  new Header({ rs: 2 ** 36 - 31 });

  assertThrows(() => {
    new Header({ rs: 2 ** 36 - 30 });
  }, RecordSizeError);
});

Deno.test("Header/equal", () => {
  const h1 = new Header({});
  const h2 = new Header({ salt: h1.salt, rs: h1.rs, keyid: h1.keyid });

  assertEquals(h1, h2);
  assert(h1.equals(h2));

  const h3 = new Header({});
  assertNotEquals(h1, h3);
  assertFalse(h1.equals(h3));
});

Deno.test("Header/not/equal", () => {
  const h1 = new Header({ keyid: Uint8Array.of(66) });
  const h2 = new Header({ keyid: Uint8Array.of(67) });

  assertNotEquals(h1, h2);
});

Deno.test("Header/toBytes", () => {
  const innerSalt = decodeBase64Url("I1BsxtFttlv3u_Oo94xnmw");
  const salt = new Salt(innerSalt);
  const h = new Header({ salt, rs: 4096, keyid: new Uint8Array() });

  const rs = Uint8Array.of(0, 0, 16, 0); // 4096
  const idlen = Uint8Array.of(h.idlen);
  assert(
    bytes.equals(
      new Uint8Array(h.toBytes()),
      bytes.concat([innerSalt, rs, idlen, h.keyid]),
    ),
  );
});

Deno.test("Header/toBase64", () => {
  const innerSalt = decodeBase64Url("I1BsxtFttlv3u_Oo94xnmw");
  const salt = new Salt(innerSalt);
  const h = new Header({ salt, rs: 4096, keyid: new Uint8Array() });

  assert(h.toBase64() === "I1BsxtFttlv3u/Oo94xnmwAAEAAA");
});

Deno.test("Header/toBase64Url", () => {
  const innerSalt = decodeBase64Url("I1BsxtFttlv3u_Oo94xnmw");
  const salt = new Salt(innerSalt);
  const h = new Header({ salt, rs: 4096, keyid: new Uint8Array() });

  assert(h.toBase64Url() === "I1BsxtFttlv3u_Oo94xnmwAAEAAA");
});

Deno.test("Header/fromBytes", () => {
  const innerSalt = decodeBase64Url("I1BsxtFttlv3u_Oo94xnmw");
  const salt = new Salt(innerSalt);
  const h1 = new Header({ salt, rs: 4096, keyid: new Uint8Array() });

  const h2 = Header.fromBytes(h1.toBytes());
  assertFalse(h1 === h2);
  assert(h1.equals(h2));
});

Deno.test("Header/fromBase64", () => {
  const innerSalt = decodeBase64Url("I1BsxtFttlv3u_Oo94xnmw");
  const salt = new Salt(innerSalt);
  const h1 = new Header({ salt, rs: 4096, keyid: new Uint8Array() });

  const h2 = Header.fromBase64(h1.toBase64());
  assertFalse(h1 === h2);
  assert(h1.equals(h2));
});

Deno.test("Header/fromBase64Url", () => {
  const innerSalt = decodeBase64Url("I1BsxtFttlv3u_Oo94xnmw");
  const salt = new Salt(innerSalt);
  const h1 = new Header({ salt, rs: 4096, keyid: new Uint8Array() });

  const h2 = Header.fromBase64Url(h1.toBase64Url());
  assertFalse(h1 === h2);
  assert(h1.equals(h2));
});
