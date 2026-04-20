import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'catalog-pdf-export',
      configureServer(server) {
        const handler = async (req, res) => {
          try {
            let body = ''
            await new Promise(resolve => {
              req.on('data', c => { body += c })
              req.on('end', resolve)
            })
            let payload = {}
            try { payload = JSON.parse(body || '{}') } catch {}
            const url = new URL(req.url, 'http://localhost')
            const id = payload.catalogId || url.searchParams.get('catalogId') || 'cat_1'
            const host = req.headers.host || 'localhost:5173'
            const targetUrl = `http://${host}/catalogs/${id}/builder?print=1`
            const { default: puppeteer } = await import('puppeteer')
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            const page = await browser.newPage()
            if (payload.storageSnapshot) {
              await page.evaluateOnNewDocument((id, snapshot, sections) => {
                try {
                  localStorage.setItem('merchflow_catalogs', JSON.stringify(snapshot))
                } catch {}
                try {
                  sessionStorage.setItem(`export_sections_${id}`, JSON.stringify(sections || []))
                } catch {}
              }, id, payload.storageSnapshot, payload.sections)
            }
            await page.goto(targetUrl, { waitUntil: 'networkidle0' })
            try {
              await page.waitForFunction('window.__CATALOG_READY === true', { timeout: 15000 })
            } catch (_) {
              // fall through if signal not present
            }
            try {
              await page.evaluate(() => {
                const t = document.getElementById('catalog-print-root')
                if (!t) return
                let node = t
                while (node && node !== document.body) {
                  const p = node.parentElement
                  if (!p) break
                  Array.from(p.children).forEach((c) => { if (c !== node) c.style.display = 'none' })
                  node = p
                }
              })
            } catch {}
            await page.emulateMediaType('screen')
            const pdf = await page.pdf({
              format: 'A4',
              printBackground: true,
              preferCSSPageSize: true,
              margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }
            })
            await browser.close()
            const fileName = `catalog_${id}.pdf`
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Cache-Control', 'no-store')
            res.setHeader('Content-Length', String(pdf.length))
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
            res.end(pdf)
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e?.message || 'Failed to export PDF' }))
          }
        }
        server.middlewares.use('/api/export', handler)
      },
      configurePreviewServer(server) {
        server.middlewares.use('/api/export', async (req, res) => {
          // Reuse the dev handler logic by dynamic importing this file itself would be overkill,
          // so replicate a minimal version here.
          try {
            let body = ''
            await new Promise(resolve => {
              req.on('data', c => { body += c })
              req.on('end', resolve)
            })
            let payload = {}
            try { payload = JSON.parse(body || '{}') } catch {}
            const url = new URL(req.url, 'http://localhost')
            const id = payload.catalogId || url.searchParams.get('catalogId') || 'cat_1'
            const host = req.headers.host || 'localhost:5173'
            const targetUrl = `http://${host}/catalogs/${id}/builder?print=1`
            const { default: puppeteer } = await import('puppeteer')
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
            const page = await browser.newPage()
            if (payload.storageSnapshot) {
              await page.evaluateOnNewDocument((id, snapshot, sections) => {
                try {
                  localStorage.setItem('merchflow_catalogs', JSON.stringify(snapshot))
                } catch {}
                try {
                  sessionStorage.setItem(`export_sections_${id}`, JSON.stringify(sections || []))
                } catch {}
              }, id, payload.storageSnapshot, payload.sections)
            }
            await page.goto(targetUrl, { waitUntil: 'networkidle0' })
            try {
              await page.waitForFunction('window.__CATALOG_READY === true', { timeout: 15000 })
            } catch (_) {}
            try {
              await page.evaluate(() => {
                const t = document.getElementById('catalog-print-root')
                if (!t) return
                let node = t
                while (node && node !== document.body) {
                  const p = node.parentElement
                  if (!p) break
                  Array.from(p.children).forEach((c) => { if (c !== node) c.style.display = 'none' })
                  node = p
                }
              })
            } catch {}
            await page.emulateMediaType('screen')
            const pdf = await page.pdf({
              format: 'A4',
              printBackground: true,
              preferCSSPageSize: true,
              margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }
            })
            await browser.close()
            const fileName = `catalog_${id}.pdf`
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Cache-Control', 'no-store')
            res.setHeader('Content-Length', String(pdf.length))
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
            res.end(pdf)
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e?.message || 'Failed to export PDF' }))
          }
        })
      }
    }
  ],
})
