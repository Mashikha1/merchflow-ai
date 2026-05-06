import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AuthLayout } from '../layouts/AuthLayout'
import { AppShell } from '../layouts/AppShell'

import { LoginPage } from '../pages/auth/LoginPage'
import { SignupPage } from '../pages/auth/SignupPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { InviteAcceptPage } from '../pages/auth/InviteAcceptPage'
import { OnboardingPage } from '../pages/OnboardingPage'

import { DashboardPage } from '../pages/DashboardPage'
import { ProductsPage } from '../pages/ProductsPage'
import { ProductNewPage } from '../pages/ProductNewPage'
import { ProductDetailPage } from '../pages/ProductDetailPage'

import { CategoriesPage } from '../pages/CategoriesPage'
import { CollectionsPage } from '../pages/CollectionsPage'
import { CollectionNewPage } from '../pages/CollectionNewPage'
import { InventoryPage } from '../pages/InventoryPage'
import { ImportsPage } from '../pages/ImportsPage'
import { ImportWizardPage } from '../pages/ImportWizardPage'
import { ImportDetailPage } from '../pages/ImportDetailPage'
import { MediaLibraryPage } from '../pages/MediaLibraryPage'
import { MediaDetailPage } from '../pages/MediaDetailPage'

import { AIStudioPage } from '../pages/ai/AIStudioPage'
import { AITryOnPage } from '../pages/ai/AITryOnPage'
import { AIDescriptionsPage } from '../pages/ai/AIDescriptionsPage'
import { AIAttributesPage } from '../pages/ai/AIAttributesPage'
import { AIBackgroundsPage } from '../pages/ai/AIBackgroundsPage'
import { AILookbookAssistantPage } from '../pages/ai/AILookbookAssistantPage'
import { AIJobsPage } from '../pages/ai/AIJobsPage'

import { CatalogsPage } from '../pages/catalogs/CatalogsPage'
import { CatalogNewPage } from '../pages/catalogs/CatalogNewPage'
import { CatalogSetupPage } from '../pages/catalogs/CatalogSetupPage'
import { CatalogDetailPage } from '../pages/catalogs/CatalogDetailPage'
import { CatalogBuilderPage } from '../pages/catalogs/CatalogBuilderPage'

import { LookbooksPage } from '../pages/lookbooks/LookbooksPage'
import { LookbookBuilderPage } from '../pages/lookbooks/LookbookBuilderPage'

import { ShowroomsPage } from '../pages/showrooms/ShowroomsPage'
import { ShowroomNewPage } from '../pages/showrooms/ShowroomNewPage'
import { ShowroomDetailPage } from '../pages/showrooms/ShowroomDetailPage'

import { OrdersPage } from '../pages/OrdersPage'
import { QuotesPage } from '../pages/QuotesPage'
import { QuoteCreatePage } from '../pages/quotes/QuoteCreatePage'
import { CustomersPage } from '../pages/CustomersPage'

import { SettingsProfilePage } from '../pages/settings/SettingsProfilePage'
import { SettingsTeamPage } from '../pages/settings/SettingsTeamPage'
import { SettingsBrandPage } from '../pages/settings/SettingsBrandPage'
import { SettingsIntegrationsPage } from '../pages/settings/SettingsIntegrationsPage'
import { SettingsNotificationsPage } from '../pages/settings/SettingsNotificationsPage'
import { SettingsAIPage } from '../pages/settings/SettingsAIPage'

import { PublicShowroomPage } from '../pages/public/PublicShowroomPage'
import { PublicShowroomProductPage } from '../pages/public/PublicShowroomProductPage'
import { PublicShowroomWishlistPage } from '../pages/public/PublicShowroomWishlistPage'
import { PublicShowroomRequestQuotePage } from '../pages/public/PublicShowroomRequestQuotePage'
import { PublicShowroomRequestSamplePage } from '../pages/public/PublicShowroomRequestSamplePage'
import { BuyerHomePage } from '../pages/buyer/BuyerHomePage'
import { BuyerCatalogsPage } from '../pages/buyer/BuyerCatalogsPage'
import { BuyerCatalogDetailPage } from '../pages/buyer/BuyerCatalogDetailPage'
import { BuyerShowroomsPage } from '../pages/buyer/BuyerShowroomsPage'
import { BuyerShowroomDetailPage } from '../pages/buyer/BuyerShowroomDetailPage'
import { BuyerWishlistPage } from '../pages/buyer/BuyerWishlistPage'
import { BuyerRequestQuotePage } from '../pages/buyer/BuyerRequestQuotePage'

function RequireAuth({ children }) {
  const status = useAuthStore((s) => s.status)
  if (status !== 'authenticated') return <Navigate to="/login" replace />
  return children
}

export function RequireRole({ roles, children }) {
  const user = useAuthStore((s) => s.user)
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-content-primary">Access Restricted</h2>
          <p className="text-sm text-content-secondary">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite/accept" element={<InviteAcceptPage />} />
      </Route>

      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <div className="min-h-screen bg-app-body px-6 py-10 lg:px-20">
              <div className="mx-auto max-w-5xl">
                <OnboardingPage />
              </div>
            </div>
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductNewPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/new" element={<CollectionNewPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/imports" element={<ImportsPage />} />
        <Route path="/imports/new" element={<ImportWizardPage />} />
        <Route path="/imports/:id" element={<ImportDetailPage />} />
        <Route path="/media" element={<MediaLibraryPage />} />
        <Route path="/media/:id" element={<MediaDetailPage />} />

        <Route path="/ai" element={<AIStudioPage />} />
        <Route path="/ai/try-on" element={<AITryOnPage />} />
        <Route path="/ai/descriptions" element={<AIDescriptionsPage />} />
        <Route path="/ai/attributes" element={<AIAttributesPage />} />
        <Route path="/ai/backgrounds" element={<AIBackgroundsPage />} />
        <Route path="/ai/lookbook-assistant" element={<AILookbookAssistantPage />} />
        <Route path="/ai/jobs" element={<AIJobsPage />} />

        <Route path="/catalogs" element={<CatalogsPage />} />
        <Route path="/catalogs/new" element={<CatalogNewPage />} />
        <Route path="/catalogs/new/setup" element={<CatalogSetupPage />} />
        <Route path="/catalogs/:id" element={<CatalogDetailPage />} />
        <Route path="/catalogs/:id/builder" element={<CatalogBuilderPage />} />

        <Route path="/lookbooks" element={<LookbooksPage />} />
        <Route path="/lookbooks/:id/builder" element={<LookbookBuilderPage />} />

        <Route path="/showrooms" element={<ShowroomsPage />} />
        <Route path="/showrooms/new" element={<ShowroomNewPage />} />
        <Route path="/showrooms/:id" element={<ShowroomDetailPage />} />

        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/quotes/new" element={<QuoteCreatePage />} />
        <Route path="/quotes/:id/edit" element={<QuoteCreatePage />} />
        <Route path="/customers" element={<CustomersPage />} />

        <Route path="/settings/profile" element={<SettingsProfilePage />} />
        <Route path="/settings/team" element={<SettingsTeamPage />} />
        <Route path="/settings/brand" element={<SettingsBrandPage />} />
        <Route path="/settings/integrations" element={<SettingsIntegrationsPage />} />
        <Route path="/settings/notifications" element={<SettingsNotificationsPage />} />
        <Route path="/settings/ai" element={<SettingsAIPage />} />
      </Route>

      {/* Public showroom routes — no auth required */}
      <Route path="/s/:slug" element={<PublicShowroomPage />} />
      <Route path="/s/:slug/products/:id" element={<PublicShowroomProductPage />} />
      <Route path="/s/:slug/wishlist" element={<PublicShowroomWishlistPage />} />
      <Route path="/s/:slug/request-quote" element={<PublicShowroomRequestQuotePage />} />
      <Route path="/s/:slug/request-sample" element={<PublicShowroomRequestSamplePage />} />

      {/* Buyer portal — requires auth */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/buyer/home" element={<BuyerHomePage />} />
        <Route path="/buyer/catalogs" element={<BuyerCatalogsPage />} />
        <Route path="/buyer/catalogs/:id" element={<BuyerCatalogDetailPage />} />
        <Route path="/buyer/showrooms" element={<BuyerShowroomsPage />} />
        <Route path="/buyer/showrooms/:id" element={<BuyerShowroomDetailPage />} />
        <Route path="/buyer/wishlist" element={<BuyerWishlistPage />} />
        <Route path="/buyer/request-quote" element={<BuyerRequestQuotePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
