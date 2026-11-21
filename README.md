# ScamBaitBank (SBB)

**Track:** Protect the little guy. **Scenario:** it's 2am, and the bank's KYC, login and biometrics are compromised, so a scammer gets into Ivan's online banking with a deepfake.

SBB lets them in, and then wastes their whole night.

1. **Hacker terminal.** The intro shows the takeover: a leaked KYC dump, a spoofed device, a deepfake passing Face ID, a hacked KYC check, a SIM swap. Then "Online banking is ours."
2. **A real-looking bank.** The scammer lands in SBB online banking as Ivan: balance, card, transactions, and a transfer form already filled in for AED 55,000 to a Dubai mule.
3. **"Additional verification required."** Sending the transfer opens an SBB transfer-authentication window that can't be closed (the × only shakes it and warns them).
4. **Scam Bait Bingo.** Inside is a 5×5 board of face-down cards. The scammer opens any card to get a task. The first card is always 100 squats holding your passport, and after that it's 99 absurd tasks in random order ("Find a spoon and balance it on your nose", "Sing Happy Birthday to your kettle", "Present a potato as your new business partner"). Each task must be recorded on camera. Videos are never analysed: about 6 in 10 uploads are rejected with a canned verdict ("Angle is wrong: 84°", "Cat detected", "Socks do not match") and the card flips back. The rest are accepted. Random audits reset accepted cards. A full row, column or diagonal is a BINGO, which unlocks "Level 2 of 7" on a fresh board. After 10 accepted cards the verification server goes on a 30-minute lunch break with a countdown. Double-click the timer to end it early during a demo.
5. **Behind the scenes.** The button in the corner shows what the scammer can't see: the real account was frozen the moment the takeover pattern appeared, Ivan was alerted, nothing moved, and each video was thrown away unwatched. The scammer's wasted time counts up live.

No AI, no server-side storage, no real bank, no real money. Recorded video stays in the browser's memory until upload finishes and is then discarded.

## Run it

```bash
node server.js
```

Open http://localhost:3000. No install is needed (Node 18 or newer). The camera only works on `localhost` or `https`. If the camera is unavailable, the recorder lets you send a pretend video so the demo keeps going.

## 5-minute demo

1. **0:00** "2:03am. Ivan is asleep. His bank's KYC and Face ID were hacked an hour ago." Let the terminal play out.
2. **0:40** Open online banking. It looks like any bank. Press **Send transfer**, then **Start Scam Bait Bingo**.
3. **1:10** A volunteer plays the scammer: try to close the window, then open a card and do the passport squats live.
4. **2:30** Open two or three more cards (spoon on nose, if you're lucky). Rejected, rejected, accepted, audit.
5. **3:45** Open **Behind the scenes**: account frozen, 0 ₽ moved, videos binned, minutes wasted.
6. **4:30** Close: "When the bank can't trust your face, it can still waste a scammer's night."

## Files

- `public/index.html`: the whole app (terminal intro, bank UI, Verification Bingo with 100 tasks, video recorder)
- `server.js`: tiny static server, no dependencies
