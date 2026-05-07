import { useSearchParams } from 'react-router-dom'
import { CatalogBuilderPage } from './CatalogBuilderPage'

/**
 * CatalogPrintPage
 * A dedicated route that renders the full CatalogBuilderPage in buyerMode.
 * If ?download=true is in the URL, it will auto-trigger the PDF export.
 */
export function CatalogPrintPage() {
  const [searchParams] = useSearchParams()
  const autoExport = searchParams.get('download') === 'true'

  return <CatalogBuilderPage buyerMode={true} autoExport={autoExport} />
}

