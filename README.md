# playwright-cache.ts

Cache web pages fetched using the Playwright.

[![npm Package Version](https://img.shields.io/npm/v/playwright-cache.ts)](https://www.npmjs.com/package/playwright-cache.ts)

This is particularly useful for web scraping where you might want to reduce the load on the server, or speed up the process by reusing previously fetched web pages.

## Installation

To install this library, you can use npm, pnpm or yarn:

```bash
npm install playwright-cache.ts
```

or

```bash
pnpm install playwright-cache.ts
```

or

```bash
yarn add playwright-cache.ts
```

## Usage Example

```typescript
import { chromium } from 'playwright'
import { PlaywrightCache, toOrigin } from 'playwright-cache.ts'

async function main() {
  let browser = await chromium.launch({ headless: false })
  let page = await browser.newPage()

  let cache = new PlaywrightCache({
    cacheDir: '.cache',
    getMode: 'navigate',
  })

  let url = 'https://en.wikipedia.org/wiki/Factorial'

  let html = await cache.cachedGetPageContent(page, url)

  await toOrigin(page, url, { waitUntil: 'domcontentloaded' })

  let links = await page.evaluate(html => {
    let document = new DOMParser().parseFromString(html, 'text/html')
    return Array.from(document.querySelectorAll('a'), a => a.href).filter(
      link => {
        try {
          return new URL(link).origin == location.origin
        } catch (error) {
          return false
        }
      },
    )
  }, html)

  console.log(links.length, 'links')
  console.log(links)

  await page.close()
  await browser.close()
}

main()
```

## API with Typescript Signature

### Class: PlaywrightCache

Below is the API of `PlaywrightCache`'s `constructor()` and it's main method `cachedGetPageContent()`, which returns the html of the given url:

```typescript
import { Page } from 'playwright'
export type GotoOptions = Parameters<Page['goto']>[1]

export class PlaywrightCache {
  constructor(options?: CacheOption)

  /**
   * @description get the html payload of the given url, auto save and reuse caches
   */
  cachedGetPageContent(
    page: Page,
    url: string,
    options?: GotoOptions,
  ): Promise<string>
}

export type CacheOption = {
  /**
   * @description the directory to store cached web pages
   * @default '.cache'
   * */
  cacheDir?: string
  /**
   * @description reuse cached web pages within this interval period (in milliseconds)
   * @default 15*60*1000 (15 minutes)
   */
  cacheInterval?: number
  /**
   * @description to fetch() the web page within the same origin, or to navigate with page.goto()
   * @default 'navigate'
   */
  getMode?: GetMode
}

export type GetMode = 'fetch' | 'navigate'
```

### Helper Function: toOrigin()

Below is the API of a helper function `toOrigin()`, which can be called before calling `new DOMParser().parseFromString(html,'text/html')` in `page.evaluate()` to make sure it handles relative href properly.

```typescript
import { Page } from 'playwright'
export type GotoOptions = Parameters<Page['goto']>[1]

/**
 * @description goto the url's origin if not already, for evaluating relative links of a[href]
 */
export function toOrigin(
  page: Page,
  url: string,
  options: GotoOptions,
): Promise<void>
```

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
