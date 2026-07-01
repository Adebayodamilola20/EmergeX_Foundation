#!/usr/bin/env bun
/**
 * emergex Code - Terminal UI
 *
 * A structured agentic coding environment.
 * Built with Ink (React for CLI).
 */

import React from "react";
import { render } from "ink";
import { App } from "./app.js";
import { enableInfiniteMode } from "../../../packages/permissions/index.js";
import { parseTuiArgv } from "./lib/tui-cli.js";

const argv = process.argv.slice(2);
const parsed = parseTuiArgv(argv);

// Log training proxy status if active
const trainingProxyUrl = process.env.TRAINING_PROXY_URL;
if (trainingProxyUrl) {
  console.log(`\x1b[36mTraining proxy: active (${trainingProxyUrl})\x1b[0m`);
}

const hasInfiniteFlag = parsed.infiniteFlag;
if (hasInfiniteFlag) {
  enableInfiniteMode();
  console.log("\x1b[33m[∞] Infinite Loop mode enabled\x1b[0m\n");
}

const command = parsed.positional[0] || "repl";
const passthroughArgs = parsed.positional.slice(1);

// Fullscreen: switch to the alternate screen buffer (like vim/htop) so Ink owns
// a clean, fixed viewport. Without this, shell output above the app breaks Ink's
// erase-and-redraw line accounting and stale characters bleed into every frame.
const ALT_SCREEN_ENTER = "\x1b[?1049h\x1b[H\x1b[2J";
const ALT_SCREEN_EXIT = "\x1b[?1049l";
const isTTY = Boolean(process.stdout.isTTY);

if (isTTY) {
  process.stdout.write(ALT_SCREEN_ENTER);
}

const restoreScreen = () => {
  if (isTTY) {
    process.stdout.write(ALT_SCREEN_EXIT);
  }
};
// Restore the normal buffer on every exit path (clean exit, crash, signal)
process.on("exit", restoreScreen);

// Render the TUI
const instance = render(
  <App
    initialCommand={command}
    args={passthroughArgs}
    sessionName={parsed.sessionName}
    sessionResume={parsed.sessionResume}
    cliProvider={parsed.provider}
    cliModel={parsed.model}
    cliAutoApprove={parsed.yes}
  />,
);

// A resize re-wraps every line, invalidating Ink's previous-frame line count.
// Clear the screen so the next paint starts from a known-clean state.
if (isTTY) {
  process.stdout.on("resize", () => {
    process.stdout.write("\x1b[2J\x1b[H");
  });
}

instance.waitUntilExit().then(restoreScreen, restoreScreen);
