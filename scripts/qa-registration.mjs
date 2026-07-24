import puppeteer from "puppeteer-core";
import { writeFile } from "node:fs/promises";

const baseUrl = process.env.MYFINANCES_QA_URL ?? "http://127.0.0.1:3015";
console.info("Iniciando Chrome de QA...");
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  protocolTimeout: 30_000,
  args: ["--no-first-run", "--no-default-browser-check", "--hide-scrollbars"],
});
console.info("Chrome listo.");
const pages = await browser.pages();
const page = pages[0] ?? (await browser.newPage());
const email = `qa-registration-${Date.now()}@example.invalid`;
const password = "MyFinancesQA2026!";

await writeFile("/private/tmp/myfinances-registration-qa-email", email, { mode: 0o600 });
await page.goto(`${baseUrl}/registro`, { waitUntil: "domcontentloaded", timeout: 30_000 });
await page.waitForSelector('input[name="email"]', { timeout: 15_000 });

const fields = await page.evaluate(() => ({
  name: Boolean(document.querySelector('input[name="name"]')),
  email: Boolean(document.querySelector('input[name="email"]')),
  password: Boolean(document.querySelector('input[name="password"]')),
  confirmPassword: Boolean(document.querySelector('input[name="confirmPassword"]')),
}));

await page.type('input[name="name"]', "Usuario QA");
await page.type('input[name="email"]', email);
await page.type('input[name="password"]', password);
await page.type('input[name="confirmPassword"]', password);

await page.click('button[type="submit"]');
await page.waitForFunction(() => location.pathname === "/inicio", { timeout: 30_000 });
await page.waitForFunction(
  () => document.body.innerText.includes("Balance disponible"),
  { timeout: 30_000 },
);

const result = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  heading: document.querySelector("h1")?.textContent ?? null,
  dashboard: document.body.innerText.includes("Balance disponible"),
  error: document.querySelector('[role="status"]')?.textContent ?? null,
}));

await page.screenshot({ path: "/private/tmp/myfinances-registration-success.png" });
console.info(JSON.stringify({ fields, result }));
await browser.close();
