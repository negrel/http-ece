import * as bytes from "https://deno.land/std@0.150.0/bytes/mod.ts";

export const SALT_LENGTH = 16;

export class SaltLengthError extends Error {}

export class Salt extends Uint8Array {
  constructor(salt?: Uint8Array | ArrayBuffer) {
    if (salt === undefined) {
      super(SALT_LENGTH);
      crypto.getRandomValues(this);
      return;
    }

    if (salt.byteLength != SALT_LENGTH) {
      throw new SaltLengthError(
        `salt length must be ${SALT_LENGTH}: got ${salt.byteLength}`,
      );
    }

    if (salt instanceof ArrayBuffer) {
      const copy = new Uint8Array(SALT_LENGTH);
      bytes.copy(new Uint8Array(salt), copy);
      super(copy);
      return;
    }

    super(SALT_LENGTH);
    this.set(salt, 0);
  }

  public equals(other: Salt): boolean {
    return bytes.equals(this, other);
  }
}
