import puppeteer from 'puppeteer';

/**
 * Scrapes the text content of any arbitrary URL.
 * Uses Google Translate as a proxy to bypass Cloudflare and Turnstile bot protection.
 * 
 * @param targetUrl The target URL to scrape
 * @returns The text content of the page
 */
export async function scrapeUrlContent(targetUrl: string): Promise<string> {
  console.log(`[Scraper] Initializing browser for URL: ${targetUrl}`);
  
  // Format target URL through Google Translate proxy
  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(targetUrl)}`;
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled' // Bypass basic bot flags
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set typical user agent to mimic a normal browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    console.log(`[Scraper] Navigating to translate proxy URL...`);
    // Wait for networkidle2 to ensure all static assets and dynamic content are loaded
    await page.goto(translateUrl, { waitUntil: 'networkidle2', timeout: 35000 }).catch(err => {
      console.warn(`[Scraper] Navigation warning: ${err.message}. Attempting to extract text anyway.`);
    });

    // Wait a short time for Google Translate's frame/iframe to render the actual target content
    await new Promise(resolve => setTimeout(resolve, 5000));

    const pageText = await page.evaluate(() => {
      // Clean up common boilerplate/noisy layout tags before extracting text
      const elementsToRemove = document.querySelectorAll(
        'script, style, nav, footer, header, noscript, iframe, svg, button'
      );
      elementsToRemove.forEach(el => el.remove());
      
      return document.body.innerText || '';
    });

    console.log(`[Scraper] Successfully extracted ${pageText.length} characters of page text.`);
    
    if (pageText.length < 50) {
      throw new Error("Scraped page content is too short. The page might be empty or blocked.");
    }
    
    return pageText;
  } catch (error: any) {
    console.error(`[Scraper] Scraping failed:`, error);
    throw new Error(`Không thể cào dữ liệu từ đường dẫn được cung cấp: ${error.message || error}`);
  } finally {
    console.log(`[Scraper] Closing browser...`);
    await browser.close();
  }
}
