import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package,
  Plus,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Sparkles,
  Archive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Book
} from 'lucide-react'
import { productService } from '../services/productService'
import { catalogService } from '../services/catalogService'
import { PageHeader } from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { RightDrawer } from '../components/RightDrawer'
import { useQuery as useRQ } from '@tanstack/react-query'
import { toast } from 'sonner'

export function ProductsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [globalFilter, setGlobalFilter] = useState('')
  const [selected, setSelected] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [mode, setMode] = useState('existing') // 'existing' | 'new'
  const [existingId, setExistingId] = useState('')
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('lookbook')
  const [placement, setPlacement] = useState({
    end: true,
    grid: false,
    featured: false,
    newSection: false,
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  })
  const catalogsQ = useRQ({ queryKey: ['catalogs'], queryFn: catalogService.getCatalogs })

  const columns = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-black focus:ring-black"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-black focus:ring-black"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <Link to={`/products/${row.original.id}`} className="font-medium text-gray-900 hover:underline">
                {row.getValue('name')}
              </Link>
              <div className="text-xs text-gray-500">{row.original.sku}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <span className="text-gray-600">{row.getValue('category')}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status')
        const getStyles = () => {
          if (status === 'Active') return 'bg-green-100 text-green-700 border-green-200'
          if (status === 'Low Stock') return 'bg-amber-100 text-amber-700 border-amber-200'
          return 'bg-gray-100 text-gray-700 border-gray-200'
        }
        return (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStyles()} inline-flex items-center gap-1.5`}>
            {status === 'Active' && <CheckCircle2 size={12} />}
            {status === 'Low Stock' && <AlertCircle size={12} />}
            {status}
          </span>
        )
      },
    },
    {
      accessorKey: 'stock',
      header: 'Inventory',
      cell: ({ row }) => {
        const stock = row.getValue('stock')
        return <span className={stock < 10 ? 'text-red-500 font-medium' : 'text-gray-600'}>{stock} in stock</span>
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('price'))
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount)
        return <div className="font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: 'aiAssets',
      header: 'AI Ready',
      cell: ({ row }) => {
        const count = row.getValue('aiAssets')
        if (count > 0) {
          return (
            <div className="flex items-center gap-1 text-indigo-600 font-medium text-xs bg-indigo-50 px-2 py-1 rounded-md w-fit">
              <Sparkles size={12} /> {count} Assets
            </div>
          )
        }
        return <span className="text-gray-400 text-xs">—</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-medium text-brand hover:text-brand-hover hover:bg-brand-soft transition-colors"
              onClick={() => {
                setSelected([row.original])
                setAddOpen(true)
              }}
            >
              <Book className="mr-1.5 h-3.5 w-3.5" /> Add to Catalog
            </Button>
          </div>
        )
      },
    },
  ]

  const stats = [
    { label: 'Total Products', value: products?.length || 0, loading: isLoading },
    { label: 'Active', value: products?.filter(p => p.status === 'Active').length || 0, loading: isLoading },
    { label: 'Drafts', value: products?.filter(p => p.status === 'Draft').length || 0, loading: isLoading },
    { label: 'Low Stock', value: products?.filter(p => p.status === 'Low Stock').length || 0, loading: isLoading },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Products"
          description="Manage your product catalog, pricing, and variant inventory."
        />
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="hidden sm:flex"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button
            variant="secondary"
            className="hidden md:flex"
            onClick={() => {
              if (selected.length === 0) {
                toast.message('Select at least one product to add to a catalog')
                return
              }
              setAddOpen(true)
            }}
          >
            <Book className="mr-2 h-4 w-4" /> Add to Catalog
          </Button>
          <Link to="/products/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
            {s.loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{s.value}</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-0 border-none shadow-sm bg-transparent">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, SKUs..."
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Button variant="secondary">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={products || []}
          loading={isLoading}
          onRowSelectionChange={(rows) => setSelected(rows)}
        />
      </Card>

      <RightDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add to Catalog"
        subtitle={selected.length ? `${selected.length} product(s) selected` : 'Select products to add'}
        widthClassName="w-[min(680px,calc(100%-24px))]"
      >
        <div className="space-y-6">
          <div>
            <div className="text-xs text-muted">Selected products</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {selected.map((p) => (
                <div key={p.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted">{p.sku}</div>
                </div>
              ))}
              {selected.length === 0 ? <div className="text-xs text-muted">No products selected.</div> : null}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted mb-2">Destination</div>
            <div className="inline-flex rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1">
              <button
                className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'existing' ? 'bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] font-semibold' : 'text-muted hover:text-content-primary'}`}
                onClick={() => setMode('existing')}
              >
                Existing Catalog
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'new' ? 'bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] font-semibold' : 'text-muted hover:text-content-primary'}`}
                onClick={() => setMode('new')}
              >
                Create New Catalog
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="mt-3">
                <label className="text-xs font-medium text-muted">Select catalog</label>
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm"
                  value={existingId}
                  onChange={(e) => setExistingId(e.target.value)}
                >
                  <option value="">Choose a catalog…</option>
                  {(catalogsQ.data || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted">Catalog Name</label>
                  <Input className="mt-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Spring 26 Line Sheet" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Catalog Type</label>
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="lookbook">Lookbook</option>
                    <option value="linesheet">Line Sheet</option>
                    <option value="pricelist">Price List</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-muted">Placement</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2 text-sm">
                <input type="checkbox" checked={placement.end} onChange={(e) => setPlacement((p) => ({ ...p, end: e.target.checked }))} /> Add to end of catalog
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2 text-sm">
                <input type="checkbox" checked={placement.grid} onChange={(e) => setPlacement((p) => ({ ...p, grid: e.target.checked }))} /> Add to product grid
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2 text-sm">
                <input type="checkbox" checked={placement.featured} onChange={(e) => setPlacement((p) => ({ ...p, featured: e.target.checked }))} /> Add to featured section
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2 text-sm">
                <input type="checkbox" checked={placement.newSection} onChange={(e) => setPlacement((p) => ({ ...p, newSection: e.target.checked }))} /> Create new section
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!selected.length) {
                  toast.message('Select at least one product to add to a catalog')
                  return
                }
                try {
                  let targetId = existingId
                  if (mode === 'new') {
                    if (!newName.trim()) {
                      toast.message('Enter a catalog name')
                      return
                    }
                    const created = await catalogService.createCatalog({
                      name: newName.trim(),
                      type: newType,
                    })
                    targetId = created.id
                  }
                  if (!targetId) {
                    toast.message('Choose a catalog')
                    return
                  }
                  const target = await catalogService.getCatalog(targetId)
                  const existingItems = Array.isArray(target.items) ? target.items : []
                  
                  // Filter out products already in the catalog
                  const existingIds = new Set(existingItems.map(item => item.id))
                  const newItems = selected
                    .filter(p => !existingIds.has(p.id))
                    .map((p) => ({ id: p.id, sku: p.sku, name: p.name }))

                  if (newItems.length === 0 && mode === 'existing') {
                    toast.message('Products are already in this catalog')
                    setAddOpen(false)
                    return
                  }

                  await catalogService.updateCatalog(targetId, { 
                    items: [...existingItems, ...newItems] 
                  })
                  
                  queryClient.invalidateQueries({ queryKey: ['catalogs'] })
                  toast.success(mode === 'new' ? 'Catalog created' : 'Added to catalog', { 
                    description: `${newItems.length} product(s) added` 
                  })
                  setAddOpen(false)
                  navigate(`/catalogs/${targetId}/builder`)
                } catch {
                  toast.error('Could not add to catalog')
                }
              }}
            >
              Add to Catalog
            </Button>
          </div>
        </div>
      </RightDrawer>
    </div>
  )
}
