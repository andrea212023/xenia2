# Xenia 2

A friend from elsewhere keeps your message.

A secret message card guarded by Xenia, a 3D alien friend among her flowers, rendered live in the browser with WebGL. Her flowers stay closed until the receiver answers her question. Then they bloom one by one while the message resolves out of an invented script.

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

Xenia and her flowers are 3D models by Andrianna-Mariia Kis, generated with Tripo from her own prompts. They were finished in Blender for the web:

- `assets/xenia.glb`: the original bust with all of its roughly 2 million triangles, with her 4K colour and detail textures, only compressed with meshopt (24 MB). She is turned to face the viewer in code.
- `assets/xenia-lite.glb`: a lighter copy (788,000 triangles, 2K textures, 11 MB) that phones load instead. Add `?full` to the address to force the original, or `?lite` to force the light one.
- `assets/flora.glb`: ten flowers, split out of one sculpture in Blender into separate models of 9,000 triangles each.

## What happens

- Her eyes follow your cursor or finger: the irises slide inside the eye openings, and the bust turns gently with them. Drag sideways to turn her further.
- The flowers stay closed until the right answer, and shrink back from a wrong one.
- They open one by one while you press and hold, lean toward your finger, open or close when tapped, light up, and shed petals.
- Iridescent dust drifts through the scene, a soft aura glows behind her, and her eyes and the open flowers bloom with light.

## Third-party code

`vendor/` contains [three.js](https://threejs.org) r170 and a few of its add-ons, under the MIT license (see `vendor/THREE-LICENSE`).
