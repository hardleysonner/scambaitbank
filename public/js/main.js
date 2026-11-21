/* ScamBaitBank entry point: each module wires its own part of the page on import. */
import { runTerm } from "./intro.js";
import "./bank.js";
import "./auth.js";
import "./lunch.js";
import "./recorder.js";

runTerm();
