# ScamBaitBank (SBB): ScamBait for banks

> **This is a product demo, not a banking system.** It shows what a bank could do *after* its own fraud-scoring model has flagged a session as a scammer. There is no real bank, money, AI or video analysis here.

**Live demo:** https://hardleysonner.github.io/scambaitbank/
**Track:** Protect the little guy: human & transaction.

## The idea

Banks already score every session on device, location, behaviour, payee and time of day. When the score says "account takeover", the bank has two options today. Blocking tells the scammer to move on to the next victim. Allowing loses the money.

**ScamBait adds a third option: keep them busy.** When the scoring model is confident, the bank quietly:

1. **Freezes the real account** and alerts the real customer, so no money can move.
2. **Moves the scammer into a decoy session** that looks like normal online banking, where the transfer seems to go through.
3. **Sends the transfer to "additional verification"**: an endless, absurd but official-looking video check. Every minute spent there is a minute not spent on the next victim.
4. **Collects intel** for the fraud team: the takeover pattern, the device, the timing and the mule account the money was meant for.

The scammer thinks they're one step from cashing out. Nothing can move.

> **Detection is out of scope.** The demo assumes the bank's existing scoring model has already made the call. ScamBait is what happens next.

## What the demo shows

1. **The attack (terminal intro).** At 02:03 a script loads a leaked KYC dump, spoofs the device, streams a deepfake past Face ID, passes KYC through a compromised provider and swaps the phone number so SMS 2FA goes to the scammer. The last line is "Online banking is ours." *In the product, this is where the bank's model flags the session.*
2. **The decoy bank.** It shows Ivan's balance (AED 58,420.50), card and transactions, and a transfer form already filled in: AED 55,000 to the mule, Golden Sands Crypto FZE (Dubai).
3. **"Additional verification required."** Sending the transfer opens an authentication window that can't be closed. The × only shakes it and shows a warning.
4. **Scam Bait Bingo.** A 5×5 board of face-down cards with a free centre square. Each card is a task to record on camera. The first card is always *100 squats holding your passport*. The other 99 come in random order: balance a spoon on your nose, sing Happy Birthday to your kettle, present a potato as your new business partner.
   - About 6 in 10 videos are rejected with a canned reason ("Angle is wrong: 84°", "Cat detected"), and the card flips back.
   - Random audits reset two accepted cards.
   - A full row, column or diagonal is a BINGO, which unlocks "Level 2 of 7" on a fresh board.
   - After the 10th accepted video, the verification server goes on a 30-minute lunch break.
5. **Behind the scenes** (button in the bottom-left corner). This is what the bank sees: the real account was frozen as soon as the takeover pattern appeared, Ivan was alerted, AED 0 moved, and every video was thrown away unwatched. A live counter shows the scammer's wasted time, and a log records every transfer attempt with its amount and recipient.

## 5-minute demo

1. **0:00** "2:03am. Ivan is asleep, and his bank's KYC and Face ID were hacked an hour ago." Let the terminal play out.
2. **0:40** Open online banking. It looks like any bank. Press **Send transfer**, then **Start Scam Bait Bingo**.
3. **1:10** A volunteer plays the scammer. They try to close the window, then open a card and do the passport squats live.
4. **2:30** Open two or three more cards: rejected, rejected, accepted, audit.
5. **3:45** Open **Behind the scenes**: account frozen, AED 0 moved, videos binned, minutes wasted.
6. **4:30** "The bank can't stop every takeover, but it can stop the money and waste the scammer's night."

**Tip:** double-click the lunch-break timer to end the break early.

## Run it

    node server.js        # Node 18+, no install needed

Open http://localhost:3000. The camera only works on localhost or https, which includes the live demo. Without a camera, the recorder offers a **pretend video** so the demo keeps going.

## Tests

    npm install
    npm test                                     # server tests (node --test)
    npx playwright install --with-deps chromium
    npm run test:e2e                             # Playwright: walks the whole demo

The end-to-end tests stub the camera, so they always use the pretend video. CI runs both on every pull request and on every push to `main`.

## Security

`server.js` is a small static server with no dependencies. It was reviewed for judges who might poke at it on stage:

- Malformed URLs (`/%`, `GET http://[`) get a 400 instead of crashing the process.
- Only GET and HEAD are allowed. Path traversal is blocked.
- A strict Content-Security-Policy allows the app's own script only by its hash. It also blocks framing (anti-clickjacking for the camera prompt) and is backed by nosniff, Referrer-Policy and a Permissions-Policy that allows the camera only for the app.
- User input is escaped or set as text, so there is no XSS. The camera is released whenever the recorder closes.

## Limits of the demo

- No real bank, money, accounts or personal data. All names and figures are made up.
- Videos are never analysed, uploaded or stored. They stay in browser memory until the fake upload finishes and are then discarded.
- Verdicts are random scripted lines, with no AI.
- The live demo on GitHub Pages is a static copy (`gh-pages` branch) and does not update from `main` automatically. Pages can't send `server.js`'s security headers, so for the hardened version run `node server.js`.

## Files

- `public/index.html`: the whole app (terminal intro, decoy bank, Scam Bait Bingo with 100 tasks, recorder, Behind the scenes)
- `server.js`: the static server
- `test/`, `e2e/`: server tests and Playwright tests

## Built with

Claude (concept, prototype), Codex, and **Devin**. Devin wrote the test suite and CI, opened fixes for 8 bugs in parallel PRs (each with a regression test and a video), and ran a security review that caught a server crash triggered by a single request.
