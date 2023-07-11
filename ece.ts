import { TAG_LENGTH } from "./const.ts";
import { Header } from "./header.ts";
import { ECECrypto, ECECryptoOptions } from "./ece_crypto.ts";

/**
 * @param data is the buffer to encrypt or a RecordIterable.
 * @param secret is the encryption secret
 * @param options
 * @returns encrypted data
 */
export async function encrypt(
  data: RecordIterable | ArrayBuffer,
  secret: ArrayBuffer,
  options?: ECECryptoOptions,
): Promise<ArrayBuffer> {
  const crypto = new ECECrypto(secret, options || {});

  const iterable = data instanceof RecordIterable
    ? data
    : new WithPaddingRecordIterable(
      data as ArrayBuffer,
      crypto.header.rs,
    );

  const header = crypto.header.toBytes();
  const result = new Uint8Array(
    header.byteLength + iterable.length * crypto.header.rs,
  );
  result.set(new Uint8Array(header));

  let i = 0;
  let cursor = header.byteLength;
  for (const record of iterable) {
    const crypted = await crypto.encryptRecord(record, i);
    result.set(new Uint8Array(crypted), cursor);

    cursor += crypted.byteLength;
    i++;
  }

  return result.slice(0, cursor).buffer;
}

/**
 * PlainTextRecord define a single unencrypted record.
 */
export class PlainTextRecord extends ArrayBuffer {}

/**
 * RecordIterable splits input data into records ready
 * to be encrypted.
 * This interface exists mainly to support different padding
 * strategy.
 */
export interface RecordIterable {
  // Iterator of record.
  [Symbol.iterator](): Iterator<PlainTextRecord, PlainTextRecord>;

  // Total number of record
  readonly length: number;
}

export abstract class RecordIterable implements RecordIterable {}

/**
 * WithPaddingRecordIterable is a fixed padding RecordIterable.
 */
export class WithPaddingRecordIterable extends RecordIterable {
  public readonly length: number;
  private readonly data: ArrayBuffer;

  // Record size without TAG_LENGTH but with padding
  private readonly rs: number;

  // Record size without TAG_LENGTH and padding
  private readonly ds: number;

  private readonly extraPadding: number;

  constructor(data: ArrayBuffer, rs: number, extraPadding = 0) {
    super();

    this.rs = rs - TAG_LENGTH;

    // At least on byte of data must be present in each record
    if (extraPadding < 0 || this.rs - 1 <= extraPadding) {
      throw new Error(
        `extra padding must be comprised between 0 and ${
          this.rs - 2
        }: got ${extraPadding}`,
      );
    }

    this.extraPadding = extraPadding;

    // -1 for the padding delimiter
    this.ds = this.rs - 1 - extraPadding;

    // Number of record
    this.length = Math.ceil(data.byteLength / this.ds);
    const lastRecordSize = data.byteLength - this.length * this.ds;
    if (lastRecordSize <= extraPadding && this.length > 1) this.length--;

    this.data = data;
  }

  [Symbol.iterator](): Iterator<PlainTextRecord, PlainTextRecord, undefined> {
    let cursor = 0;
    let done = false;
    let record: PlainTextRecord = null as unknown as PlainTextRecord;

    return {
      next: (
        ..._args: [] | [undefined]
      ): IteratorResult<PlainTextRecord, PlainTextRecord> => {
        if (done) return { done, value: record };
        done = cursor + this.rs >= this.data.byteLength;

        const recordData = this.data.slice(
          cursor,
          done ? undefined : cursor + this.ds,
        );
        record = pad(
          new Uint8Array(recordData),
          done ? 0 : this.extraPadding,
          done ? 0x02 : 0x01,
        );

        cursor += this.ds;
        return { value: record };
      },
    };
  }
}

export class InvalidDataSizeError extends Error {
  constructor(maxDataSize: number, data: ArrayBuffer) {
    super(`data size must be less than ${maxDataSize}: got ${data.byteLength}`);
  }
}

export type PadDelimiter = 0x01 | 0x02;

/** Add padding to an ArrayBuffer
 * @param data the buffer without padding
 * @param padLen length of padding without delimiter
 * @param padDelimiter the padding delimiter
 * @returns an ArrayBuffer with padding.
 */
export function pad(
  data: ArrayBuffer,
  padLen: number,
  padDelimiter: PadDelimiter,
): ArrayBuffer {
  const result = new ArrayBuffer(data.byteLength + padLen + 1);
  const bytesArr = new Uint8Array(result);
  // Copy data into result
  bytesArr.set(new Uint8Array(data), 0);
  // Then add padding
  bytesArr.set(new Uint8Array(padLen), data.byteLength);
  // Then set delimiter octet
  bytesArr[data.byteLength] = padDelimiter;
  return result;
}

export function unpad(record: ArrayBuffer): ArrayBuffer {
  const r = new Uint8Array(record);

  for (let i = record.byteLength - 1; i >= 0; i--) {
    if (
      r[i] === 0x01 || r[i] === 0x02
    ) {
      return record.slice(0, i);
    }
  }

  return record;
}

/**
 * @param data is the encrypted data with the header block
 * @param secret is the secret used to encrypt the data
 * @param headerOrOptions an optional header if not part of data, or options object 
 * @returns the decrypted data
 */
export async function decrypt(
  data: ArrayBuffer,
  secret: ArrayBuffer,
  headerOrOptions?: Header | ECECryptoOptions,
): Promise<ArrayBuffer> {
  let options: ECECryptoOptions;
  let header: Header;
  if (headerOrOptions instanceof Header) {
    header = headerOrOptions;
    options = { header: headerOrOptions };
  } else if (headerOrOptions) {
    if (headerOrOptions.header instanceof Header) {
      header = headerOrOptions.header;
    } else {
      header = new Header(headerOrOptions.header || {});
    }
    options = { ...headerOrOptions, header };
  } else {
    header = Header.fromBytes(data);
    options = { header };
  }

  const crypto = new ECECrypto(secret, options);
  data = data.slice(header.byteLength);

  const recordsNum = data.byteLength / header.rs;

  let resultCursor = 0;
  const result = new Uint8Array(
    (recordsNum) * (header.rs - TAG_LENGTH),
  );

  let cursor = 0;
  for (let i = 0; i < recordsNum; i++) {
    const decryptedRecord = unpad(
      await crypto.decryptRecord(
        data.slice(cursor, cursor + header.rs),
        i,
      ),
    );

    cursor += header.rs;

    result.set(new Uint8Array(decryptedRecord), resultCursor);
    resultCursor += decryptedRecord.byteLength;
  }

  return result.slice(0, resultCursor);
}
