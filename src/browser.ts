import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

// Add stealth plugin and use defaults (all evasion techniques)
puppeteer.use(StealthPlugin());

let browser: Browser | null = null;
let page: Page | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

export async function getPage(): Promise<Page> {
  if (!page) {
    const b = await getBrowser();
    page = await b.newPage();
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }
  return page;
}

export async function navigate(url: string): Promise<string> {
  const p = await getPage();
  await p.goto(url, { waitUntil: 'networkidle2' });
  return await p.title();
}

export async function extractContent(selector?: string): Promise<string> {
  const p = await getPage();
  if (selector) {
    const element = await p.$(selector);
    if (element) {
      const text = await p.evaluate((el: any) => el.innerText, element);
      if (text) {
          return text;
      }
    }
    return '';
  }
  // Return whole body stripped text
  return await p.evaluate(() => document.body.innerText);
}

export async function searchWeb(query: string): Promise<string> {
  const p = await getPage();
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  await p.goto(searchUrl, { waitUntil: 'networkidle2' });
  
  // Extract search results
  const results = await p.evaluate(() => {
    const items = document.querySelectorAll('li.b_algo');
    return Array.from(items).map(item => {
      const title = item.querySelector('h2')?.textContent || '';
      const link = item.querySelector('a')?.getAttribute('href') || '';
      const snippet = item.querySelector('.b_caption p')?.textContent || '';
      return `${title}\n${link}\n${snippet}\n---`;
    }).join('\n');
  });
  return results;
}

export async function closeBrowser(): Promise<void> {
  if (page) {
    await page.close();
    page = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}
