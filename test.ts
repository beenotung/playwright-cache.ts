import { chromium } from 'playwright'
import { PlaywrightCache, toOrigin } from './core'

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
