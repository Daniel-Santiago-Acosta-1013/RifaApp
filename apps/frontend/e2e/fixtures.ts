import { test as base, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

type RuntimeErrorEntry = {
  type: "console" | "pageerror" | "requestfailed";
  message: string;
  url?: string;
  location?: string;
  method?: string;
  stack?: string;
  timestamp: string;
};

const errorLogPath = path.resolve(process.cwd(), "playwright-report", "errors.log");

const appendRuntimeError = async (entry: RuntimeErrorEntry) => {
  await fs.mkdir(path.dirname(errorLogPath), { recursive: true });
  await fs.appendFile(errorLogPath, `${JSON.stringify(entry)}\n`);
};

export const test = base.extend({});
export { expect };

test.beforeEach(async ({ page }, testInfo) => {
  const errors: RuntimeErrorEntry[] = [];

  const record = (entry: RuntimeErrorEntry) => {
    errors.push(entry);
    void appendRuntimeError(entry);
  };

  const onConsole = (msg: { type: () => string; text: () => string; location: () => { url?: string } }) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      const location = msg.location()?.url;
      record({
        type: "console",
        message: msg.text(),
        location: location || undefined,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const onPageError = (error: Error) => {
    record({
      type: "pageerror",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  };

  const onRequestFailed = (request: { url: () => string; method: () => string; failure: () => { errorText?: string } | null }) => {
    const failure = request.failure();
    record({
      type: "requestfailed",
      message: failure?.errorText || "request failed",
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString(),
    });
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);

  (testInfo as { _runtimeErrors?: RuntimeErrorEntry[] })._runtimeErrors = errors;
  (testInfo as { _runtimeListeners?: Record<string, unknown> })._runtimeListeners = {
    onConsole,
    onPageError,
    onRequestFailed,
  };
});

test.afterEach(async ({ page }, testInfo) => {
  const errors = (testInfo as { _runtimeErrors?: RuntimeErrorEntry[] })._runtimeErrors || [];
  if (errors.length > 0) {
    await testInfo.attach("runtime-errors", {
      body: JSON.stringify(errors, null, 2),
      contentType: "application/json",
    });
  }

  const listeners = (testInfo as { _runtimeListeners?: Record<string, unknown> })._runtimeListeners;
  if (listeners) {
    page.off("console", listeners.onConsole as (msg: unknown) => void);
    page.off("pageerror", listeners.onPageError as (error: Error) => void);
    page.off("requestfailed", listeners.onRequestFailed as (request: unknown) => void);
  }
});
