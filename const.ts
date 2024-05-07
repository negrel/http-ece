export const SALT_LENGTH = 16;
export const RS_LENGTH = 4;
export const IDLEN_LENGTH = 1;
export const KEY_LENGTH = 16;

export const TAG_LENGTH = 16;
export const NONCE_LENGTH = 12;

export const HEADER_LENGTH_MIN = SALT_LENGTH + RS_LENGTH + IDLEN_LENGTH;

export const DEFAULT_RECORD_SIZE = 1024 * 64;
export const RECORD_SIZE_MIN = 18;
export const RECORD_SIZE_MAX = 2 ** 36 - 31;

export const encoder = new TextEncoder();
export const CEK_INFO = encoder.encode("Content-Encoding: aes128gcm\0");
export const NONCE_INFO = encoder.encode("Content-Encoding: nonce\0");
export const ONE_BYTE = encoder.encode("\x01");
