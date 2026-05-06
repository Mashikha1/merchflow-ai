import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/DataTable'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Search, Filter, AlertCircle, ArrowDownToLine, RefreshCw } from 'lucide-react'

// Transform backend inventory item → flat table row shape
function transformItem(i) {
  const available = Math.max(0, i.onHand - i.reserved)
  let status = 'In Stock'
  if (i.onHand === 0) status = 'Out of Stock'
  else if (i.onHand <= 20) status = 'Low Stock'
  return {
    id: i.id,
    sku: i.product?.sku || '—',
    product: i.product?.name || '—',
    warehouse: i.location,
    inStock: i.onHand,
    reserved: i.reserved,
    available,
    incoming: i.incoming,
    status,
  }
}

export function InventoryPage() {
  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory'),
  })

  const summary = raw?.summary || {}
  const inventory = (raw?.items || []).map(transformItem)

  const columns = [
    { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-medium text-gray-900">{row.getValue('sku')}</span> },
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'warehouse', header: 'Location' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.getValue('status')
        if (s === 'In Stock') return <span className="text-green-600 font-medium text-xs">{s}</span>
        if (s === 'Low Stock') return <span className="text-amber-600 font-medium text-xs flex items-center gap-1"><AlertCircle size={12} />{s}</span>
        return <span className="text-red-600 font-medium text-xs">{s}</span>
      }
    },
    { accessorKey: 'inStock', header: 'On Hand', cell: ({ row }) => <span className="font-semibold">{row.getValue('inStock')}</span> },
    { accessorKey: 'reserved', header: 'Reserved', cell: ({ row }) => <span className="text-gray-500">{row.getValue('reserved')}</span> },
    { accessorKey: 'available', header: 'Available', cell: ({ row }) => <span className="font-semibold text-indigo-600">{row.getValue('available')}</span> },
    { accessorKey: 'incoming', header: 'Incoming', cell: ({ row }) => <span className="text-gray-500">{row.getValue('incoming')}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Inventory Dashboard"
          description="Track stock levels, incoming shipments, and location availability."
        />
        <div className="flex items-center gap-3">
          <Button variant="secondary"><ArrowDownToLine className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button><RefreshCw className="mr-2 h-4 w-4" /> Bulk Adjust</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-center border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Available Units</p>
          <p className="text-2xl font-semibold">{isLoading ? '—' : summary.totalAvailable?.toLocaleString() ?? 0}</p>
        </Card>
        <Card className="p-4 flex flex-col justify-center border-l-4 border-l-amber-500 bg-amber-50/20">
          <p className="text-sm font-medium text-gray-500 mb-1">Low Stock Alerts</p>
          <p className="text-2xl font-semibold text-amber-600">{isLoading ? '—' : summary.lowStock ?? 0}</p>
        </Card>
        <Card className="p-4 flex flex-col justify-center border-l-4 border-l-red-500 bg-red-50/20">
          <p className="text-sm font-medium text-gray-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-semibold text-red-600">{isLoading ? '—' : summary.outOfStock ?? 0}</p>
        </Card>
        <Card className="p-4 flex flex-col justify-center border-l-4 border-l-indigo-500">
          <p className="text-sm font-medium text-gray-500 mb-1">Incoming Units</p>
          <p className="text-2xl font-semibold">{isLoading ? '—' : summary.incoming?.toLocaleString() ?? 0}</p>
        </Card>
      </div>

      <Card className="p-0 border-none shadow-sm bg-transparent">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search inventory by SKU, product..." className="pl-9 bg-white" />
            </div>
            <Button variant="secondary">
              <Filter className="mr-2 h-4 w-4" /> Locations
            </Button>
          </div>
        </div>

        <DataTable columns={columns} data={inventory || []} loading={isLoading} />
      </Card>
    </div>
  )
}
