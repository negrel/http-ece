# `http-ece` - HTTP Encrypted Content-Encoding for Deno & web browsers

![jsr badge](https://jsr.io/badges/@negrel/http-ece)
![license MIT badge](https://img.shields.io/github/license/negrel/http-ece)
![code size badge](https://img.shields.io/github/languages/code-size/negrel/http-ece)

This library is an implementation of HTTP Encrypted Content-Encoding
scheme([RFC 8188](https://datatracker.ietf.org/doc/html/rfc8188)).

> NOTE: This library hasn't been reviewed by crypto experts and may be unsecure.
> I've done my best to follow RFC recommandation and I only used primitives
> provided by the
> [SubtleCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto).

`http-ece` is available on [JSR](https://jsr.io/@negrel/http-ece).

## Implemented schemes

This crate implements only the published Web Push Encryption scheme
(`aes128gcm`), and **not** the legacy scheme from earlier drafts.

It does not support, and we have no plans to ever support, the obsolete `aesgmc`
and `aesgcm128` schemes from earlier drafts.

## Usage

```ts
import * as ece from "jsr:@negrel/http-ece";

const input = new TextEncoder().encode("I am the walrus");
const secret = new TextEncoder().encode("my_secret");
const encrypted = await ece.encrypt(input, secret);

const decrypted = await ece.decrypt(encrypted, secret);

console.log(new TextDecoder().decode(decrypted));
// output: I am the walrus
```

## Features

- `aes128gcm` encryption and decryption
- custom padding strategy supported
- Web browser compatible (based on
  [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto))

## TODO

- [ ] Support
      [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

## Contributing

If you want to contribute to `http_ece` to add a feature or improve the code
contact me at [negrel.dev@protonmail.com](mailto:negrel.dev@protonmail.com),
open an [issue](https://github.com/negrel/http_ece/issues) or make a
[pull request](https://github.com/negrel/http_ece/pulls).

## :stars: Show your support

Please give a :star: if this project helped you!

[![buy me a coffee](https://github.com/negrel/.github/raw/master/.github/images/bmc-button.png?raw=true)](https://www.buymeacoffee.com/negrel)

## :scroll: License

MIT © [Alexandre Negrel](https://www.negrel.dev/)
