import puppeteer from 'puppeteer'
import { spawn } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'
import http from 'node:http'

async function isServerUp(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      res.resume()
      resolve(true)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1500, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function ensurePreview(baseUrl) {
  if (await isServerUp(baseUrl)) return { proc: null }
  const proc = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'preview', '--', '--port', '5173'], {
    stdio: 'inherit'
  })
  for (let i = 0; i < 30; i++) {
    if (await isServerUp(baseUrl)) break
    await wait(1000)
  }
  return { proc }
}

async function main() {
  const [, , catalogIdArg, outPathArg] = process.argv
  const catalogId = catalogIdArg || 'cat_1'
  const outPath = outPathArg || `catalog_${catalogId}.pdf`
  const baseUrl = process.env.CATALOG_BASE_URL || 'http://localhost:5173'
  const url = `${baseUrl}/catalogs/${catalogId}/builder?print=1`

  const { proc } = await ensurePreview(baseUrl)

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  page.setDefaultNavigationTimeout(60000)
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction('window.__CATALOG_READY === true', { timeout: 30000 }).catch(() => {})
  await page.emulateMediaType('screen')
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }
  })
  await browser.close()
  if (proc) proc.kill('SIGTERM')
  console.log(`PDF saved to ${outPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

