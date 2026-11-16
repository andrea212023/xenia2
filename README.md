# Xenia 2

A friend from elsewhere keeps your message.

A secret message card guarded by a 3D alien face in a crown of flowers, rendered live in the browser with WebGL. She sleeps until the receiver answers her question. Then her eyes open and follow you, and the flowers bloom one by one while the message resolves out of an invented script.

## How it works

- **Grow a card:** write the message, the question, and the answer. You get a link to send to your person.
- **Open a card:** open the link, answer the question, then press and hold the picture while the flowers open.

## Languages

English, Ukrainian, German, Polish, Dutch, Spanish, Portuguese, French. The page picks the browser language and remembers a manual choice.

## Privacy

The message is encrypted in the browser with AES-GCM. The key is derived from the answer with PBKDF2 (SHA-256, 200,000 iterations). The card travels inside the link, after the `#`, so it is never sent to a server. The lock is only as strong as the answer: a short or common answer can be guessed by anyone who holds the link.

## Run it

The app is `index.html`, `app.js` (cards, encryption, languages) and `scene.js` (the 3D scene). Serve it over HTTPS or on localhost (browsers only allow the encryption API in a secure context), or publish the repository with GitHub Pages.

## Artwork

The head, the flowers, their textures and materials are all generated in code in `scene.js`. No image or model files are used.

## Third-party code

`vendor/` contains [three.js](https://threejs.org) r170 and a few of its add-ons, under the MIT license (see `vendor/THREE-LICENSE`).
