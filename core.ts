import { createHash } from 'crypto'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs'
import { join } from 'path'
import { Page } from 'playwright'

export type GotoOptions = Parameters<Page['goto']>[1]

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
  cacheInterval?: number // default
  /**
   * @description to fetch() the web page within the same origin, or to navigate with page.goto()
   * @default 'navigate'
   */
  getMode?: GetMode
}
export type GetMode = 'fetch' | 'navigate'

export class PlaywrightCache {
  cacheDir: string
  cacheInterval: number
  getMode: GetMode

  constructor(options?: CacheOption) {
    this.cacheDir = options?.cacheDir || '.cache'
    this.cacheInterval = options?.cacheInterval || 15 * 60 * 1000
    this.getMode = options?.getMode || 'navigate'
    mkdirSync(this.cacheDir, { recursive: true })
  }

  /**
   * @description get the html payload of the given url, auto save and reuse caches
   */
  async cachedGetPageContent(
    page: Page,
    url: string,
    options?: GotoOptions,
  ): Promise<string> {
    let filename = hashUrl(url)
    let file = join(this.cacheDir, filename)
    let now = Date.now()

    if (existsSync(file)) {
      let stat = statSync(file)
      let passedTime = now - stat.mtimeMs
      if (passedTime < this.cacheInterval) {
        return readFileSync(file).toString()
      }
    }

    let html =
      this.getMode == 'fetch'
        ? await this.fetch(page, url, options)
        : await this.goto(page, url, options)

    writeFileSync(file, html)

    this.appendLog(now, filename, url)

    return html
  }

  private appendLog(now: number, filename: string, url: string) {
    let logFile = join(this.cacheDir, 'log')
    let line = `${formatTime(now)} ${filename} ${url}\n`
    appendFileSync(logFile, line)
  }

  private async fetch(
    page: Page,
    url: string,
    options: GotoOptions,
  ): Promise<string> {
    await toOrigin(page, url, options)
    return page.evaluate(url => fetch(url).then(res => res.text()), url)
  }

  private async goto(
    page: Page,
    url: string,
    options: GotoOptions,
  ): Promise<string> {
    await page.goto(url, options)
    return page.evaluate(() => document.body.parentElement!.outerHTML)
  }
}

/**
 * @description goto the url's origin if not already, for evaluating relative links of a[href]
 */
export async function toOrigin(page: Page, url: string, options: GotoOptions) {
  let origin = new URL(url).origin
  if (new URL(page.url()).origin != origin) {
    await page.goto(origin, options)
  }
}

function hashUrl(url: string) {
  let hash = createHash('sha256')
  hash.update(url)
  return hash.digest().toString('base64url')
}

function formatTime(time: number) {
  let date = new Date(time)
  return `${date.getFullYear()}-${d2(date.getMonth() + 1)}-${d2(
    date.getDate(),
  )} ${d2(date.getHours())}:${d2(date.getMinutes())}:${d2(
    date.getSeconds(),
  )}.${d3(date.getMilliseconds())}`
}

function d2(x: number) {
  return x < 10 ? '0' + x : x
}

function d3(x: number) {
  return x < 10 ? '00' + x : x < 100 ? '0' + x : x
}
