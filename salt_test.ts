import {
  assert,
  assertFalse,
  assertThrows,
} from "https://deno.land/std@0.150.0/testing/asserts.ts";
import { Salt, SALT_LENGTH, SaltLengthError } from "./salt.ts";

Deno.test("Salt/constructor/default", () => {
  const salt = new Salt();
  assert(salt.length === SALT_LENGTH);

  const other = new Salt();
  for (let i = 0; i < SALT_LENGTH; i++) {
    assert(salt[i] != other[i]);
  }
});

Deno.test("Salt/constructor/Uint8Array", () => {
  const buf = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(buf);

  const salt = new Salt(buf);
  assert(salt.length === SALT_LENGTH);
  assert(salt.every((_, i) => salt.at(i) === buf.at(i)));

  // Ensure buffer was copied
  crypto.getRandomValues(buf);
  assertFalse(salt.every((_, i) => salt.at(i) === buf.at(i)));
});

Deno.test("Salt/constructor/Uint8Array/InvalidLength", () => {
  for (const saltLength of [SALT_LENGTH - 1, SALT_LENGTH + 1]) {
    const buf = new Uint8Array(saltLength);
    crypto.getRandomValues(buf);

    assertThrows(() => {
      new Salt(buf);
    }, SaltLengthError);
  }
});

Deno.test("Salt/constructor/ArrayBuffer", () => {
  const arr = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(arr);

  const salt = new Salt(arr.buffer);
  assert(salt.length === SALT_LENGTH);
  assert(salt.every((_, i) => salt.at(i) === arr.at(i)));

  // Ensure buffer was copied
  crypto.getRandomValues(arr);
  assertFalse(salt.every((_, i) => salt.at(i) === arr.at(i)));
});

Deno.test("Salt/constructor/ArrayBuffer/InvalidLength", () => {
  for (const saltLength of [SALT_LENGTH - 1, SALT_LENGTH + 1]) {
    const buf = new Uint8Array(saltLength);
    const dv = new DataView(buf.buffer);
    for (let i = 0; i < saltLength; i++) {
      dv.setUint8(i, Math.floor(Math.random() * 255));
    }

    assertThrows(() => {
      new Salt(buf.buffer);
    }, SaltLengthError);
  }
});

Deno.test("Salt/equal", () => {
  const h1 = new Salt();
  assert(h1.equals(h1));

  const h2 = new Salt(h1);
  assert(h1.equals(h2));

  crypto.getRandomValues(h2);
  assertFalse(h1.equals(h2));
});
