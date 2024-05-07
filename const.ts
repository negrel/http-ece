/**
 * Size (in bytes) of salt block in encryption content-coding header.
 */
export const SALT_LENGTH = 16;
/**
 * Size (in bytes) of record size block in encryption content-coding header.
 */
export const RS_LENGTH = 4;

/**
 * Size (in bytes) of idlen block in encryption content-coding header.
 */
export const IDLEN_LENGTH = 1;

/**
 * Size (in bytes) of content-encryption key.
 */
export const KEY_LENGTH = 16;

/**
 * Size of authentication tag block in encryption content-coding header.
 */
export const TAG_LENGTH = 16;

/**
 * Size of a nonce.
 */
export const NONCE_LENGTH = 12;

/**
 * Minimum size of an encryption content-coding header.
 */
export const HEADER_LENGTH_MIN = SALT_LENGTH + RS_LENGTH + IDLEN_LENGTH;

/**
 * Default size of a record.
 */
export const DEFAULT_RECORD_SIZE = 1024 * 64;
/**
 * Minimum size of a record.
 */
export const RECORD_SIZE_MIN = 18;
/**
 * Maximum size of a record.
 */
export const RECORD_SIZE_MAX = 2 ** 36 - 31;

const encoder: TextEncoder = new TextEncoder();

/**
 * Content-encryption key info as in https://www.rfc-editor.org/rfc/rfc8188#section-2.2
 */
export const CEK_INFO: Uint8Array = encoder.encode(
  "Content-Encoding: aes128gcm\0",
);

/**
 * Nonce info as in https://www.rfc-editor.org/rfc/rfc8188#section-2.3
 */
export const NONCE_INFO: Uint8Array = encoder.encode(
  "Content-Encoding: nonce\0",
);
/**
 * Uint8Array of size 1 containing a single byte of value 1.
 * This is mostly used for concatenation with others Uint8Array.
 */
export const ONE_BYTE: Uint8Array = encoder.encode("\x01");
