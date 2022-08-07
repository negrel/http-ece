import { Header, HeaderOptions } from "./header.ts";
import { CEK_INFO, KEY_LENGTH, NONCE_INFO, NONCE_LENGTH } from "./const.ts";

export interface ECECryptoOptions {
  header?: Header | HeaderOptions;
  info?: Uint8Array;
  subtleCrypto?: SubtleCrypto;
}

/**
 * ECECrypto define an helper class that handle the
 * encryption and decryption of records one by one.
 * This class is stateless and is used as a building
 * block for ECE & ECEStream classes.
 */
export class ECECrypto {
  public readonly info: Uint8Array;
  public readonly header: Header;
  public readonly crypto: SubtleCrypto;

  // Input Keying Material
  private readonly ikm: ArrayBuffer;

  // Pseudo Random Key
  private prk: ArrayBuffer | null = null;

  // Content Encryption Key
  private cek: CryptoKey | null = null;

  // Number once
  private nonce: ArrayBuffer | null = null;

  constructor(
    ikm: ArrayBuffer,
    {
      header = new Header({}),
      info = CEK_INFO,
      subtleCrypto = crypto.subtle,
    }: ECECryptoOptions,
  ) {
    this.ikm = ikm;
    this.info = info;
    this.header = header instanceof Header ? header : new Header(header);
    this.crypto = subtleCrypto;
  }

  protected async getPRK(): Promise<ArrayBuffer> {
    if (this.prk === null) {
      this.prk = await this.hmacSha256(
        this.header.salt.buffer,
        this.ikm,
      );
    }

    return this.prk;
  }

  protected async getCEK(): Promise<CryptoKey> {
    let rawCEK: ArrayBuffer | null = null;
    if (this.cek === null) {
      rawCEK = await this.hmacSha256(
        await this.getPRK(),
        this.info,
        KEY_LENGTH,
      );

      this.cek = await this.crypto.importKey(
        "raw",
        rawCEK,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
      );
    }

    return this.cek;
  }

  protected async getNonce(): Promise<ArrayBuffer> {
    if (this.nonce === null) {
      this.nonce = await this.hmacSha256(
        await this.getPRK(),
        NONCE_INFO,
        NONCE_LENGTH,
      );
    }

    return this.nonce;
  }

  protected async deriveNonce(seq: number): Promise<Uint8Array> {
    if (seq > 0xffffffff) {
      throw new ExceedRecordSequenceNumberError(seq);
    }

    const nonce = new DataView((await this.getNonce()).slice(0));
    const m = nonce.getUint32(nonce.byteLength - 4);
    // forces unsigned int xor
    const xor = (m ^ seq) >>> 0;
    nonce.setUint32(nonce.byteLength - 4, xor);
    return new Uint8Array(nonce.buffer);
  }

  protected async hmacSha256(
    secret: CryptoKey | ArrayBuffer,
    body: ArrayBuffer,
    length?: number,
  ): Promise<ArrayBuffer> {
    if (secret instanceof ArrayBuffer) {
      secret = await this.crypto.importKey(
        "raw",
        secret,
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        false,
        ["sign"],
      );
    }

    const result = await this.crypto.sign("HMAC", secret, body);

    if (length !== null) return result.slice(0, length);

    return result;
  }

  /** Encrypt a single record.
   * @param data is padded data of size rs to encrypt
   * @param seq is the record sequence number
   * @returns encrypted data
   */
  public async encryptRecord(
    data: ArrayBuffer,
    seq: number,
  ): Promise<ArrayBuffer> {
    return this._encryptRecord(data, seq, await this.getCEK());
  }

  private async _encryptRecord(
    data: ArrayBuffer,
    seq: number,
    cek: CryptoKey,
  ): Promise<ArrayBuffer> {
    const crypted = await this.crypto.encrypt(
      {
        name: "AES-GCM",
        iv: await this.deriveNonce(seq),
        tagLength: 128,
      },
      cek,
      data,
    );

    return crypted;
  }

  /** Decrypt a single record.
   * @param crypted is the crypted record
   * @param seq is the record sequence number
   * @returns decrypted record
   */
  public async decryptRecord(
    crypted: ArrayBuffer,
    seq: number,
  ): Promise<ArrayBuffer> {
    return this._decryptRecord(crypted, seq, await this.getCEK());
  }

  private async _decryptRecord(
    crypted: ArrayBuffer,
    seq: number,
    cek: CryptoKey,
  ): Promise<ArrayBuffer> {
    const data = await this.crypto.decrypt(
      {
        name: "AES-GCM",
        iv: await this.deriveNonce(seq),
        tagLength: 128,
      },
      cek,
      crypted,
    );

    return data;
  }
}

export class ExceedRecordSequenceNumberError extends Error {
  constructor(seq: number) {
    super(`record sequence number exceed limit (${0xffffffff}): got ${seq}`);
  }
}
