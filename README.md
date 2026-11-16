# Xenia 2

A friend from elsewhere keeps your message.

A secret message card guarded by Xenia, a 3D alien friend among her flowers, rendered live in the browser with WebGL. She sleeps until the receiver answers her question. Then she wakes and follows you, and the flowers bloom one by one while the message resolves out of an invented script.

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

- `assets/xenia.glb`: the bust, reduced from about 2 million to 276,000 triangles, turned to face the viewer, with two added blink shapes (`blinkR`, `blinkL`).
- `assets/flora.glb`: ten flowers, split out of one sculpture into separate models of 9,000 triangles each.

Both files are compressed with meshopt. Head movement, eye glow and the opening of the flowers are small shader additions in `scene.js`.

## What she does

- Sleeps with closed eyes and a bowed head until the right answer.
- Stirs while you type, and turns away from a wrong answer.
- Wakes, opens her eyes, follows your cursor or finger, blinks.
- Winks and nods when you tap her face.
- Turns when you drag sideways.
- Her flowers open one by one while you press and hold, lean toward your finger, open or close when tapped, and shed petals.

## Third-party code

`vendor/` contains [three.js](https://threejs.org) r170 and a few of its add-ons, under the MIT license (see `vendor/THREE-LICENSE`).
