import * as b64url from "https://deno.land/std@0.149.0/encoding/base64url.ts";
import * as b64 from "https://deno.land/std@0.149.0/encoding/base64.ts";
import { Salt, SALT_LENGTH } from "./salt.ts";
import { equalUint8Array } from "./utils.ts";

export const IDLEN_LENGTH = 1;
export const RS_LENGTH = 4;
export const DEFAULT_RECORD_SIZE = 1024 * 64;
const HEADER_MIN_LENGTH = SALT_LENGTH + RS_LENGTH + IDLEN_LENGTH;

export const RECORD_SIZE_MIN = 18;
export const RECORD_SIZE_MAX = 2 ** 36 - 31;

export class RecordSizeError extends Error {}
export class HeaderSizeError extends Error {}

export class Header {
  public readonly salt: Salt;
  public readonly rs: number;
  public readonly keyid: Uint8Array;

  public get idlen(): number {
    return this.keyid.byteLength;
  }

  constructor(
    { salt = new Salt(), rs = DEFAULT_RECORD_SIZE, keyid = new Uint8Array() },
  ) {
    if (rs < 18 || rs > 2 ** 36 - 31) {
      throw new RecordSizeError(
        `record size must be comprise between ${RECORD_SIZE_MIN} and ${RECORD_SIZE_MAX}: got ${rs}`,
      );
    }

    this.salt = salt;
    this.rs = rs;
    this.keyid = keyid;
  }

  public static fromBytes(bytes: Uint8Array): Header {
    if (bytes.byteLength < HEADER_MIN_LENGTH) {
      throw new HeaderSizeError(
        `header block must be at least ${HEADER_MIN_LENGTH} byte long: got ${bytes.byteLength}`,
      );
    }

    const dv = new DataView(bytes.buffer);

    let cur = 0;
    const salt = dv.buffer.slice(0, SALT_LENGTH);
    cur += SALT_LENGTH;

    const rs = dv.getUint32(cur);
    cur += RS_LENGTH;

    const idlen = dv.getUint8(cur);
    cur += IDLEN_LENGTH;

    const keyid = dv.buffer.slice(cur, cur + idlen);
    cur += idlen;

    return new Header({
      salt: new Salt(salt),
      rs,
      keyid: new Uint8Array(keyid),
    });
  }

  public static fromBase64(b: string): Header {
    return Header.fromBytes(b64.decode(b));
  }

  public static fromBase64Url(b: string): Header {
    return Header.fromBytes(b64url.decode(b));
  }

  public toBytes(): Uint8Array {
    const bytes = new Uint8Array(HEADER_MIN_LENGTH + this.keyid.byteLength);
    const dv = new DataView(bytes.buffer);

    bytes.set(this.salt);
    dv.setUint32(SALT_LENGTH, this.rs);
    dv.setUint8(SALT_LENGTH + 4, this.idlen);
    bytes.set(this.keyid, SALT_LENGTH + IDLEN_LENGTH + 4);

    return bytes;
  }

  public toBase64(): string {
    return b64.encode(this.toBytes().buffer);
  }

  public toBase64Url(): string {
    return b64url.encode(this.toBytes().buffer);
  }

  public equals(other: Header): boolean {
    return equalUint8Array(this.salt, other.salt) &&
      this.rs === other.rs &&
      equalUint8Array(this.keyid, other.keyid);
  }
}
