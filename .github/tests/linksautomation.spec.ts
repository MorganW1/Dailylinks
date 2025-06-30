import { test } from '@playwright/test';
import fs from 'fs';

test('Scrape from NME and WrestlingInc and save to one markdown', async ({ page }) => {
  // --- Scrape WrestlingInc ---
  await page.goto('https://www.wrestlinginc.com/');

  let wrestlingArticles = new Set<string>();
  let maxWrestlingArticles = 30;
  let scrollAttempts = 0;

  while (wrestlingArticles.size < maxWrestlingArticles && scrollAttempts < 20) {
    const links = await page.locator('a[href^="/"]:not([href="#"])').elementHandles();

    for (const link of links) {
      const href = await link.getAttribute('href');
      const fullUrl = href?.startsWith('http') ? href : `https://www.wrestlinginc.com${href}`;
      const text = (await link.textContent())?.trim();

      if (
        fullUrl &&
        text &&
        text !== 'Read More' &&
        text.length > 10 &&
        !wrestlingArticles.has(fullUrl)
      ) {
        wrestlingArticles.add(`${text}|||${fullUrl}`);
      }

      if (wrestlingArticles.size >= maxWrestlingArticles) break;
    }

    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1000);
    scrollAttempts++;
  }

  // --- Scrape NME ---
  const baseUrl = 'https://www.nme.com/news/music/page/';
  const maxPages = 6;
  let allUrls = [];
  let newArticles = [];

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = `${baseUrl}${pageNum}`;
    console.log(`Visiting page: ${url}`);

    await page.goto(url);
    const articles = page.locator('.td-module-container');
    const count = await articles.count();

    for (let i = 0; i < count; i++) {
      const article = articles.nth(i);
      const title = (await article.locator('h3.entry-title > a[rel="bookmark"]').textContent())?.trim();
      const href = await article.locator('h3.entry-title > a[rel="bookmark"]').getAttribute('href');

      if (href && !allUrls.includes(href)) {
        newArticles.push({ title, url: href });
        allUrls.push(href);
        console.log(`📰 New article: ${title}`);
      }
    }
  }

  // --- Compose Markdown ---

  let markdown = '# WrestlingInc Articles\n\n';
  wrestlingArticles.forEach((entry) => {
    const [title, url] = entry.split('|||');
    markdown += `- [${title}](${url})\n`;
  });

  markdown += '\n# NME Articles\n\n';
  if (newArticles.length === 0) {
    markdown += '_No new articles found._\n';
  } else {
    newArticles.forEach(({ title, url }) => {
      markdown += `- [${title}](${url})\n`;
    });
  }

  // Save single markdown file
  fs.writeFileSync('combined-articles.md', markdown, 'utf-8');
  console.log(`✅ Saved combined articles to combined-articles.md`);
}, { timeout: 120000 });
