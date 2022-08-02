import { TAG_LENGTH } from "./const.ts";
import { Header } from "./header.ts";
import { ECECrypto, ECECryptoOptions } from "./ece_crypto.ts";

export async function encrypt(
  data: RecordIterable | ArrayBuffer,
  secret: ArrayBuffer,
  options?: ECECryptoOptions,
): Promise<ArrayBuffer> {
  const crypto = new ECECrypto(secret, options || {});

  const iterable = isRecordIterable(data)
    ? data as RecordIterable
    : new WithPaddingRecordIterable(
      data as ArrayBuffer,
      crypto.header.rs,
      1,
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

  return result.buffer;
}

export class Record extends ArrayBuffer {}

export interface RecordIterable {
  [Symbol.iterator](): Iterator<Record, Record>;
  readonly length: number;
}

// deno-lint-ignore no-explicit-any
function isRecordIterable(obj: any): boolean {
  return Symbol.iterator in obj && "length" in obj &&
    typeof (obj.length) === "number";
}

class WithPaddingRecordIterable implements RecordIterable {
  public readonly length: number;
  private readonly data: ArrayBuffer;

  // Record size without TAG_LENGTH but with padding
  private readonly rs: number;

  // Record size without TAG_LENGTH and padding
  private readonly ds: number;

  private readonly extraPadding: number;

  constructor(data: ArrayBuffer, rs: number, extraPadding = 0) {
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
    if (lastRecordSize <= extraPadding) this.length--;

    this.data = data;
  }

  [Symbol.iterator](): Iterator<Record, Record, undefined> {
    let cursor = 0;
    let done = false;
    let record: Record = null as unknown as Record;

    return {
      next: (..._args: [] | [undefined]): IteratorResult<Record, Record> => {
        if (done) return { done: true, value: record };

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

export async function decrypt(
  data: ArrayBuffer,
  secret: ArrayBuffer,
  header?: Header,
): Promise<ArrayBuffer> {
  if (header === undefined) header = Header.fromBytes(data);
  const crypto = new ECECrypto(secret, { header });
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

  return result;
}
