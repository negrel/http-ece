# `http_ece` - HTTP Encrypted Content-Encoding for Deno & web browsers

![license MIT badge](https://img.shields.io/github/license/negrel/http_ece)
![code size badge](https://img.shields.io/github/languages/code-size/negrel/http_ece)

This library is an implementation of HTTP Encrypted Content-Encoding
scheme([RFC 8188](https://datatracker.ietf.org/doc/html/rfc8188)).

## Implemented schemes

This crate implements only the published Web Push Encryption scheme
(`aes128gcm`), and **not** the legacy scheme from earlier drafts.

It does not support, and we have no plans to ever support, the obsoletes
`aesgmc` and `aesgcm128` schemes from earlier drafts.

## Usage

```ts
import * as ece from "https://deno.land/x/http_ece@@v0.0.4/mod.ts";

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
- Web browser compatible

## TODO

- [ ] Support the
      [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

## Contributing

If you want to contribute to `http_ece` to add a feature or improve the code
contact me at [negrel.dev@protonmail.com](mailto:negrel.dev@protonmail.com),
open an [issue](https://github.com/negrel/http_ece/issues) or make a
[pull request](https://github.com/negrel/http_ece/pulls).

## :stars: Show your support

Please give a :star: if this project helped you!

[![buy me a coffee](.github/bmc-button.png)](https://www.buymeacoffee.com/negrel)

## :scroll: License

MIT © [Alexandre Negrel](https://www.negrel.dev/)
