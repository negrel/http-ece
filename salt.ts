import { bytes } from "./deps.ts";

import { SALT_LENGTH } from "./const.ts";

/**
 * SaltLengthError is thrown when salt length is of the wrong size.
 */
export class SaltLengthError extends Error {}

/**
 * Salt define crypto salt used for HTTP Encryption Coding.
 */
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
