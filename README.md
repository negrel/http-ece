# `http_ece` - HTTP Encrypted Content-Encoding for Deno & web browsers

This library is an implementation of HTTP Encrypted Content-Encoding
scheme([RFC 8188](https://datatracker.ietf.org/doc/html/rfc8188)).

## Implemented schemes

This crate implements only the published Web Push Encryption scheme, and **not**
the legacy scheme from earlier drafts.

It does not support, and we have no plans to ever support, the obsoletes
`aesgmc` and `aesgcm128` schemes from earlier drafts.

## Usage

```ts
import * as ece from "https://deno.land/x/http_ece@v0.0.1/mod.ts"; // mod.js bundle also exist

const input = new TextEncoder().encode("I am the walrus");
const secret = new TextEncoder().encode("my_secret");
const encrypted = await ece.encrypt(input, secret);

const decrypted = await ece.decrypt(encrypted, secret);

console.log(new TextDecoder().decode(decrypted));
// output: I am the walrus
```

## :stars: Show your support

Please give a :star: if this project helped you!

## :scroll: License

MIT © [Alexandre Negrel](https://www.negrel.dev/)
