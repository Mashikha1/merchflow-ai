import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Plus, Search, Filter, MoreHorizontal, Book } from 'lucide-react'

export function CollectionsPage() {
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get('/collections'),
  })


  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Collections"
          description="Group products for specific seasons, drops, or marketing campaigns."
        />
        <Link to="/collections/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Collection</Button>
        </Link>
      </div>

      <Card className="p-0 border-none shadow-sm bg-transparent">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search collections..." className="pl-9 w-full h-10 rounded-md border border-gray-200 focus:ring-1 focus:ring-black outline-none block" />
          </div>
          <Button variant="secondary"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
        </div>

        <div className="bg-white border text-sm border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Collection Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Products</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [1,2,3].map(i => (
                  <tr key={i}><td colSpan={4} className="px-6 py-4"><Skeleton className="h-8 w-full rounded-md" /></td></tr>
                ))
              ) : collections.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">No collections yet.</td></tr>
              ) : collections.map(collection => (
                <tr key={collection.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                        {collection.name?.charAt(0) || 'C'}
                      </div>
                      <span className="font-medium text-gray-900">{collection.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      collection.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {collection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{collection._count?.products ?? 0} items</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/catalogs/new`}>
                        <Button variant="secondary" size="sm"><Book className="mr-1.5 h-3.5 w-3.5" /> Send to Catalog</Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
