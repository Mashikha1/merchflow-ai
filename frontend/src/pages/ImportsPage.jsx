import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  ShoppingCart,
  Store,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  MoreVertical,
  Download
} from 'lucide-react'
import { importService } from '../services/importService'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { DataTable } from '../components/DataTable'

function SourceCard({ title, description, icon: Icon, badge, highlight }) {
  return (
    <Card className={`p-6 hover:border-black transition-colors cursor-pointer group ${highlight ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${highlight ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 group-hover:bg-black group-hover:text-white transition-colors'}`}>
          <Icon size={24} />
        </div>
        {badge && <Badge variant="secondary" className="bg-green-100 text-green-700">{badge}</Badge>}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center">
        {title} <ArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4" />
      </h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Card>
  )
}

export function ImportsPage() {
  const navigate = useNavigate()
  const { data: imports, isLoading } = useQuery({
    queryKey: ['imports'],
    queryFn: importService.getRecentImports
  })

  const columns = [
    {
      accessorKey: 'source',
      header: 'Source / File',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.source}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <FileText size={12} /> {row.original.fileName}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.getValue('status')
        if (s === 'Completed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"><CheckCircle2 size={12} /> Completed</span>
        if (s === 'Failed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><AlertCircle size={12} /> Failed</span>
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"><RefreshCw size={12} className="animate-spin" /> Processing</span>
      }
    },
    {
      accessorKey: 'totalRows',
      header: 'Rows',
      cell: ({ row }) => {
        const t = row.getValue('totalRows')
        const s = row.original.successRows
        const f = row.original.failedRows
        if (!t) return <span className="text-gray-400">—</span>
        return (
          <div className="text-sm">
            <span className="font-medium">{t}</span> total
            <div className="flex gap-2 text-xs mt-0.5">
              <span className="text-green-600">{s} ok</span>
              {f > 0 && <span className="text-red-600">{f} fail</span>}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Date & User',
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-gray-900">{row.getValue('createdAt')}</div>
          <div className="text-xs text-gray-500">{row.original.createdBy}</div>
        </div>
      )
    },
    {
      id: 'actions',
      cell: () => (
        <div className="text-right">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Import Center"
          description="Bring products, inventory, and categories into MerchFlow."
        />
        <div className="flex items-center gap-3">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download Sample CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SourceCard
          title="CSV Upload"
          description="Standard tabular data import with visual mapping."
          icon={FileText}
          highlight
        />
        <SourceCard
          title="Excel Upload"
          description="Support for .xlsx files with multiple sheets."
          icon={FileSpreadsheet}
        />
        <SourceCard
          title="Shopify Sync"
          description="Connect store API to pull live product catalog."
          icon={ShoppingCart}
          badge="Active"
        />
        <SourceCard
          title="WooCommerce"
          description="Automated synchronization for WP stores."
          icon={Store}
        />
      </div>

      <Card className="p-0 border-none shadow-sm bg-transparent">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Imports</h3>
          <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
        </div>
        <DataTable columns={columns} data={imports || []} loading={isLoading} />
      </Card>

      <Card className="p-8 border-dashed bg-gray-50 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-indigo-500">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need to import historical data?</h3>
        <p className="text-gray-500 max-w-md mb-6">Our system supports up to 100,000 rows per CSV. Drag and drop a file anywhere on this screen to start the import wizard.</p>
        <Button size="lg" onClick={() => navigate('/imports/new')}>Start Import Wizard</Button>
      </Card>
    </div>
  )
}
