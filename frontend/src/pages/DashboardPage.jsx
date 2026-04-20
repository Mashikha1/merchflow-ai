import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Package,
  Layers,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Plus,
  Book,
  Upload,
  Zap,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { dashboardService } from '../services/dashboardService'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/cn'

function MetricCard({ title, value, icon: Icon, trend, subtext, isLoading }) {
  const isPositive = trend > 0

  return (
    <div className="bg-white rounded-lg p-6 shadow-card border border-border-subtle flex flex-col justify-between transition-all hover:shadow-card-hover duration-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-content-secondary">{title}</p>
        <Icon size={18} className="text-content-tertiary" />
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-9 w-24 mb-2 rounded-md" />
        ) : (
          <h3 className="text-2xl font-semibold tracking-tight text-content-primary mb-2">{value}</h3>
        )}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-4 w-32 rounded-md" />
          ) : (
            <>
              <div className={cn(
                "flex items-center gap-1 text-[13px] font-medium",
                isPositive ? "text-semantic-success" : "text-semantic-error"
              )}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(trend)}%
              </div>
              <span className="text-[13px] text-content-tertiary">{subtext}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionCard({ title, description, icon: Icon, to }) {
  const Wrapper = to ? Link : 'div'
  return (
    <Wrapper
      to={to}
      className="flex items-center gap-4 p-4 rounded-md bg-white border border-border-subtle hover:bg-app-card-muted hover:border-content-tertiary/20 transition-all duration-200 group cursor-pointer"
    >
      <div className="h-10 w-10 rounded-md bg-app-card-muted border border-border-subtle flex items-center justify-center shrink-0 transition-colors">
        <Icon size={18} className="text-content-secondary group-hover:text-brand" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-content-primary mb-0.5">{title}</h4>
        <p className="text-xs text-content-secondary leading-snug">{description}</p>
      </div>
    </Wrapper>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border-subtle px-3 py-2 rounded-md shadow-card">
        <p className="text-[11px] font-semibold text-content-tertiary mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-[15px] font-semibold text-content-primary flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand"></div>
          {payload[0].value.toLocaleString()} <span className="text-content-secondary text-xs font-normal">views</span>
        </p>
      </div>
    )
  }
  return null
}

export function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.getSummary
  })

  const { data: traffic, isLoading: loadingTraffic } = useQuery({
    queryKey: ['dashboard', 'traffic'],
    queryFn: dashboardService.getTrafficData
  })

  return (
    <div className="space-y-8 pb-16 max-w-[1400px] mx-auto px-4">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pt-4 border-b border-border-subtle pb-8">
        <PageHeader
          title="Overview"
          description="Track your product catalog, showrooms, and AI generations."
          className="mb-0"
        />
        <div className="flex items-center gap-3">
          <Link to="/products/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={summary?.totalProducts?.toLocaleString() || '4,205'}
          icon={Package}
          trend={12.4}
          subtext="vs last month"
          isLoading={loadingSummary}
        />
        <MetricCard
          title="Active Variants"
          value={summary?.activeVariants?.toLocaleString() || '12,840'}
          icon={Layers}
          trend={8.2}
          subtext="vs last month"
          isLoading={loadingSummary}
        />
        <MetricCard
          title="Quote Requests"
          value={summary?.quoteRequests?.toLocaleString() || '342'}
          icon={MessageSquare}
          trend={-2.4}
          subtext="vs last month"
          isLoading={loadingSummary}
        />
        <MetricCard
          title="Draft Products"
          value={summary?.draftProducts?.toLocaleString() || '45'}
          icon={Package}
          trend={5.1}
          subtext="vs last month"
          isLoading={loadingSummary}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-card border border-border-subtle flex flex-col h-full">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
              <div>
                <h3 className="text-base font-semibold text-content-primary tracking-tight mb-1">Traffic Trends</h3>
                <p className="text-xs text-content-secondary">Showroom and catalog views over the last 7 days</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xl font-semibold text-content-primary tracking-tight">21.4k <span className="text-xs font-medium text-semantic-success ml-1">18.4%</span></div>
                <p className="text-[10px] font-medium text-content-tertiary uppercase tracking-widest mt-1">This Week</p>
              </div>
            </div>

            {/* Chart Body */}
            <div className="h-[300px] w-full mt-auto relative -ml-4">
              {loadingTraffic ? (
                <Skeleton className="w-full h-full rounded-md" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={traffic} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C47B2B" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#C47B2B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4DDD4" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#A09080', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#A09080', fontWeight: 500 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F0EDE8', strokeWidth: 2 }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#C47B2B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#C47B2B' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-card border border-border-subtle h-fit">
          <h3 className="text-sm font-semibold text-content-primary mb-4 uppercase tracking-widest">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <ActionCard
              title="Create Catalog"
              description="Build a new seasonal wholesale catalog."
              icon={Book}
              to="/catalogs/new"
            />
            <ActionCard
              title="AI Studio"
              description="Generate AI visuals for your products."
              icon={Zap}
              to="/ai"
            />
            <ActionCard
              title="Bulk Import"
              description="Import products from CSV or Excel."
              icon={Upload}
              to="/imports"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
