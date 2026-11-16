# Xenia 2

A friend from elsewhere keeps your message.

A secret message card guarded by an alien face in a crown of flowers. She sleeps until the receiver answers her question. Then her eyes open and follow you, and the flowers bloom one by one while the message resolves out of an invented script.

## How it works

- **Grow a card:** write the message, the question, and the answer. You get a link to send to your person.
- **Open a card:** open the link, answer the question, then press and hold the picture while the flowers open.

## Languages

English, Ukrainian, German, Polish, Dutch, Spanish, Portuguese, French. The page picks the browser language and remembers a manual choice.

## Privacy

The message is encrypted in the browser with AES-GCM. The key is derived from the answer with PBKDF2 (SHA-256, 200,000 iterations). The card travels inside the link, after the `#`, so it is never sent to a server. The lock is only as strong as the answer: a short or common answer can be guessed by anyone who holds the link.

## Run it

The whole app is `index.html`. Serve it over HTTPS or on localhost (browsers only allow the encryption API in a secure context), or publish the repository with GitHub Pages.

## Artwork

The face and all flowers are drawn procedurally on a canvas. No image files are used.
