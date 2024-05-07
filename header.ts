import {
  bytes,
  decodeBase64,
  decodeBase64Url,
  encodeBase64,
  encodeBase64Url,
} from "./deps.ts";

import {
  DEFAULT_RECORD_SIZE,
  HEADER_LENGTH_MIN,
  IDLEN_LENGTH,
  RECORD_SIZE_MAX,
  RECORD_SIZE_MIN,
  RS_LENGTH,
  SALT_LENGTH,
} from "./const.ts";
import { Salt } from "./salt.ts";

/**
 * Options for Header class.
 */
export interface HeaderOptions {
  salt?: Salt | Uint8Array | ArrayBuffer;
  rs?: number;
  keyid?: Uint8Array;
}

/**
 * Header define Encryption Content-Coding Header (https://www.rfc-editor.org/rfc/rfc8188#section-2.1)
 */
export class Header {
  public readonly salt: Salt;
  public readonly rs: number;
  public readonly keyid: Uint8Array;

  public get idlen(): number {
    return this.keyid.byteLength;
  }

  public get byteLength(): number {
    return HEADER_LENGTH_MIN + this.idlen;
  }

  constructor(
    {
      salt = new Salt(),
      rs = DEFAULT_RECORD_SIZE,
      keyid = new Uint8Array(),
    }: HeaderOptions,
  ) {
    if (rs < RECORD_SIZE_MIN || rs > RECORD_SIZE_MAX) {
      throw new RecordSizeError(rs);
    }

    this.salt = salt instanceof Salt ? salt : new Salt(salt);
    this.rs = rs;
    this.keyid = keyid;
  }

  public static fromBytes(buf: ArrayBuffer): Header {
    if (buf.byteLength < HEADER_LENGTH_MIN) {
      throw new HeaderSizeError(buf);
    }

    const dv = new DataView(buf);

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
    return Header.fromBytes(decodeBase64(b).buffer);
  }

  public static fromBase64Url(b: string): Header {
    return Header.fromBytes(decodeBase64Url(b).buffer);
  }

  public toBytes(): ArrayBuffer {
    const bytes = new Uint8Array(this.byteLength);
    const dv = new DataView(bytes.buffer);

    bytes.set(this.salt);
    dv.setUint32(SALT_LENGTH, this.rs);
    dv.setUint8(SALT_LENGTH + RS_LENGTH, this.idlen);
    bytes.set(this.keyid, SALT_LENGTH + RS_LENGTH + IDLEN_LENGTH);

    return bytes.buffer;
  }

  public toBase64(): string {
    return encodeBase64(this.toBytes());
  }

  public toBase64Url(): string {
    return encodeBase64Url(this.toBytes());
  }

  public equals(other: Header): boolean {
    return bytes.equals(this.salt, other.salt) &&
      this.rs === other.rs &&
      bytes.equals(this.keyid, other.keyid);
  }
}

/**
 * RecordSizeError is thrown when record size exceed maximum size of is less than
 * minimum record size.
 */
export class RecordSizeError extends Error {
  constructor(rs: number) {
    super(
      `record size must be comprised between ${RECORD_SIZE_MIN} and ${RECORD_SIZE_MAX}: got ${rs}`,
    );
  }
}

/**
 * HeaderSizeError is thrown when encryption content-coding header is less than
 * minimum header size.
 */
export class HeaderSizeError extends Error {
  constructor(bytes: ArrayBuffer) {
    super(
      `header block must be at least ${HEADER_LENGTH_MIN} byte long: got ${bytes.byteLength}`,
    );
  }
}
