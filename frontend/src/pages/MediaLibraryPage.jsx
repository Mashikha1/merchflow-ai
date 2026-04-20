import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/cn'
import {
  Search, Folder, Image as ImageIcon, UploadCloud, Filter,
  MoreVertical, Sparkles, X, FileImage, FileText, XCircle, Tag, CheckCircle2,
  Palette
} from 'lucide-react'

// Base data removed

const DEFAULT_FOLDERS = [
  { id: 'f0', name: 'Product Original' },
  { id: 'f1', name: 'AI Virtual Try-On' },
  { id: 'f2', name: 'Lifestyle/Campaigns' },
  { id: 'f3', name: 'Documents & Specs' }
]

export function MediaLibraryPage() {
  const [localMedia, setLocalMedia] = useState(() => {
    try {
      const stored = localStorage.getItem('merchflow_media')
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error(err)
      return []
    }
  })

  const [folders, setFolders] = useState(() => {
    try {
      const stored = localStorage.getItem('merchflow_media_folders')
      if (stored) {
        const parsed = JSON.parse(stored)
        return [...DEFAULT_FOLDERS, ...parsed]
      }
    } catch (err) {
      console.error(err)
    }
    return DEFAULT_FOLDERS
  })

  const [activeFolder, setActiveFolder] = useState('All Media')

  const fileInputRef = useRef(null)

  // Drawer / Upload State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Drawer / Create Folder State
  const [isFolderDrawerOpen, setIsFolderDrawerOpen] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderForm, setNewFolderForm] = useState({
    name: '',
    parent: 'All Media',
    type: 'Generic Project',
    description: ''
  })
  const [folderFormError, setFolderFormError] = useState('')

  // Metadata Fields State
  const [metaFolder, setMetaFolder] = useState('All Media')
  const [metaAssetType, setMetaAssetType] = useState('Product Original')
  const [metaProduct, setMetaProduct] = useState('')
  const [metaTags, setMetaTags] = useState('')
  const [metaIsAi, setMetaIsAi] = useState(false)

  const queryClient = useQueryClient()

  const { data: apiMedia = [], isLoading, refetch } = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      try {
        const dbMedia = await api.get('/media')
        return [...localMedia, ...dbMedia.map(m => ({
          id: m.id, url: m.url, name: m.filename,
          size: `${(m.size / 1024 / 1024).toFixed(1)} MB`,
          isAi: (m.tags || []).includes('ai'), folder: m.folder || 'Product Original'
        }))]
      } catch {
        return localMedia
      }
    }
  })

  const media = apiMedia

  useEffect(() => {
    if (localMedia.length > 0) refetch()
  }, [localMedia, refetch])

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processFiles = (fileList) => {
    const filesArray = Array.from(fileList).map((f) => {
      const previewUrl = f.type.startsWith('image/') ? URL.createObjectURL(f) : null
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2)
      return {
        rawFile: f,
        id: `temp_${Date.now()}_${Math.random()}`,
        name: f.name,
        size: `${sizeMB} MB`,
        type: f.type,
        url: previewUrl
      }
    })
    setSelectedFiles(filesArray)

    // Inherit the active folder in the grid context, otherwise default to "All Media"
    setMetaFolder(activeFolder)
    setMetaAssetType('Product Original')
    setMetaProduct('')
    setMetaTags('')
    setMetaIsAi(false)

    setIsDrawerOpen(true)
  }

  const handleUploadConfirm = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get auth token from localStorage
      const auth = JSON.parse(localStorage.getItem('merchflow_auth') || '{}')
      const token = auth?.state?.token || null

      const formData = new FormData()
      selectedFiles.forEach(f => f.rawFile && formData.append('files', f.rawFile))

      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 85))
      }, 200)

      const res = await fetch(`${BASE_URL}/media/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!res.ok) throw new Error('Upload failed')

      // Also save locally for immediate display
      const newUploads = selectedFiles.map(f => ({
        id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        url: f.url || '',
        name: f.name, size: f.size, isAi: metaIsAi,
        folder: metaFolder !== 'All Media' ? metaFolder : 'Product Original',
      }))
      const combined = [...newUploads, ...localMedia]
      setLocalMedia(combined)
      try { localStorage.setItem('merchflow_media', JSON.stringify(combined)) } catch {}

      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['media'] })

      toast.success(`Successfully uploaded ${selectedFiles.length} file(s)`)
    } catch (err) {
      console.error(err)
      toast.error('Upload failed — check your connection')
    } finally {
      setIsUploading(false)
      setIsDrawerOpen(false)
      setTimeout(() => setSelectedFiles([]), 300)
    }
  }

  const handleCreateFolder = async () => {
    setFolderFormError('')
    if (!newFolderForm.name.trim()) {
      setFolderFormError('Folder Name is required.')
      return
    }

    // Duplication check
    if (folders.find(f => f.name.toLowerCase() === newFolderForm.name.trim().toLowerCase())) {
      setFolderFormError('A folder with this exact name already exists.')
      return
    }

    setIsCreatingFolder(true)
    await delay(800)

    const newFolderObj = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: newFolderForm.name.trim(),
      parent: newFolderForm.parent !== 'All Media' ? newFolderForm.parent : null,
      type: newFolderForm.type,
      description: newFolderForm.description
    }

    const updatedFolders = [...folders, newFolderObj]
    setFolders(updatedFolders)

    // Only save the custom ones to local storage (filter out the defaults if possible, 
    // but simpler to just filter out by missing "type" or save all non-default).
    const customFolders = updatedFolders.filter(f => !DEFAULT_FOLDERS.find(df => df.id === f.id))
    try {
      localStorage.setItem('merchflow_media_folders', JSON.stringify(customFolders))
    } catch (err) {
      console.error(err)
    }

    toast.success(`Folder '${newFolderObj.name}' created successfully`)

    setIsCreatingFolder(false)
    setIsFolderDrawerOpen(false)

    // Immediately navigate into the newly created empty folder
    setActiveFolder(newFolderObj.name)

    // Reset form
    setTimeout(() => setNewFolderForm({
      name: '',
      parent: 'All Media',
      type: 'Generic Project',
      description: ''
    }), 300)
  }

  const displayMedia = media?.filter(m => activeFolder === 'All Media' || m.folder === activeFolder) || []

  return (
    <div className="space-y-6 pb-12 relative w-full h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Media Library"
          description="Manage your product photos, AI assets, and campaign imagery."
        />
        <div className="flex items-center gap-3">
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf"
          />
          <Button variant="secondary" onClick={() => setIsFolderDrawerOpen(true)}>
            <Folder className="mr-2 h-4 w-4" /> New Folder
          </Button>
          <Button onClick={handleFileClick}><UploadCloud className="mr-2 h-4 w-4" /> Upload Files</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search files by name, tags, or product..." className="pl-9 bg-white w-full" />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Filter className="mr-2 h-4 w-4" /> All File Types</Button>
          <Button variant="secondary"><Sparkles className="mr-2 h-4 w-4 text-brand" /> AI Assets Only</Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Folders */}
        <div className="w-64 hidden lg:block space-y-1 shrink-0">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Folders</div>
          <button
            onClick={() => setActiveFolder('All Media')}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
              activeFolder === 'All Media' ? "bg-gray-100/50 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <ImageIcon className="h-4 w-4 text-gray-400 shrink-0" /> All Media
          </button>

          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.name)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left",
                activeFolder === folder.name ? "bg-gray-100/50 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Folder className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}
        </div>

        {/* Media Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse"></div>)}
            </div>
          ) : (
            displayMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed border-border-subtle rounded-2xl bg-app-card-muted/50 h-[400px] animate-in fade-in zoom-in-95 duration-300">
                <Folder className="h-16 w-16 text-content-tertiary mb-5 opacity-50" strokeWidth={1.5} />
                <h3 className="text-[20px] font-bold text-content-primary mb-2">No files in this folder yet</h3>
                <p className="text-[14px] text-content-secondary mb-8 max-w-[320px]">Items uploaded or assigned to "{activeFolder}" will appear here.</p>
                <Button size="lg" onClick={handleFileClick} className="shadow-sm">
                  <UploadCloud className="mr-2 h-[18px] w-[18px]" /> Upload Files Here
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Dropzone Card */}
                <div
                  className="aspect-square border-2 border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center text-center p-6 hover:bg-app-hover hover:border-brand-soft cursor-pointer transition-colors group"
                  onClick={handleFileClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="h-10 w-10 bg-app-card-muted text-content-secondary rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-soft/20 group-hover:text-brand transition-colors">
                    <UploadCloud size={20} />
                  </div>
                  <p className="text-sm font-bold text-content-primary">Upload to</p>
                  <p className="text-xs text-content-secondary mt-1 max-w-full truncate px-2">{activeFolder}</p>
                </div>

                {displayMedia.map(file => (
                  <div key={file.id} className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:border-brand-soft hover:shadow-md transition-all animate-in fade-in duration-300">
                    <div className="aspect-square bg-gray-100 relative">
                      {file.url && file.url.startsWith('blob:') ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      )}

                      {file.isAi && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-brand text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <Sparkles size={10} /> AI
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" className="h-8 text-xs font-bold border-none text-content-primary">Preview</Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] font-bold text-content-primary truncate">{file.name}</p>
                      <div className="flex items-center justify-between text-xs text-content-tertiary font-medium mt-1">
                        <span>{file.size}</span>
                        <button className="hover:text-content-primary"><MoreVertical size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Slide-out Drawer Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity",
          (isDrawerOpen || isFolderDrawerOpen) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => {
          if (!isUploading && !isCreatingFolder) {
            setIsDrawerOpen(false)
            setIsFolderDrawerOpen(false)
          }
        }}
      />

      {/* Create New Folder Drawer Modal */}
      <div className={cn(
        "fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 transform flex flex-col",
        isFolderDrawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-app-body/50">
          <h3 className="text-[16px] font-bold text-content-primary">Create New Folder</h3>
          <button
            onClick={() => setIsFolderDrawerOpen(false)}
            disabled={isCreatingFolder}
            className="h-8 w-8 flex items-center justify-center text-content-secondary hover:bg-border-subtle hover:text-content-primary transition-colors rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="mb-2">
            <div className="h-12 w-12 bg-app-card-muted rounded-xl flex items-center justify-center text-content-secondary mb-4 border border-border-subtle shadow-sm">
              <Folder size={24} strokeWidth={1.5} />
            </div>
            <p className="text-[14px] text-content-secondary leading-relaxed">Organize your media assets into custom hierarchical folders. Use them to bundle raw assets, campaign shots, or AI generation tasks.</p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-content-primary mb-1.5 flex justify-between">
              Folder Name <span className="text-semantic-error">*</span>
            </label>
            <Input
              placeholder="e.g. Summer 2026 Collection"
              className={cn("bg-white", folderFormError && "border-semantic-error focus:ring-semantic-error")}
              value={newFolderForm.name}
              onChange={e => setNewFolderForm({ ...newFolderForm, name: e.target.value })}
              disabled={isCreatingFolder}
            />
            {folderFormError && <p className="text-[11px] text-semantic-error font-medium mt-1.5">{folderFormError}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Parent Folder (Optional)</label>
            <select
              className="w-full h-10 px-3 border border-border-strong rounded-lg text-[13px] text-content-primary bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              value={newFolderForm.parent}
              onChange={e => setNewFolderForm({ ...newFolderForm, parent: e.target.value })}
              disabled={isCreatingFolder}
            >
              <option value="All Media">-- Root / None --</option>
              {folders.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Asset Classification Type</label>
            <select
              className="w-full h-10 px-3 border border-border-strong rounded-lg text-[13px] text-content-primary bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              value={newFolderForm.type}
              onChange={e => setNewFolderForm({ ...newFolderForm, type: e.target.value })}
              disabled={isCreatingFolder}
            >
              <option value="Generic Project">Generic Project</option>
              <option value="Raw Inputs">Raw Inputs</option>
              <option value="AI Generations">AI Generations</option>
              <option value="Publishing Ready">Publishing Ready</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-content-primary mb-1.5 flex items-center justify-between">
              Description <span className="text-content-tertiary font-normal">Optional</span>
            </label>
            <textarea
              placeholder="What should go in this folder?"
              className="w-full bg-white border border-border-strong rounded-lg p-3 text-[13px] text-content-primary outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[80px] resize-none"
              value={newFolderForm.description}
              onChange={e => setNewFolderForm({ ...newFolderForm, description: e.target.value })}
              disabled={isCreatingFolder}
            />
          </div>
        </div>

        <div className="p-5 border-t border-border-subtle bg-app-body/50">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex-1 bg-white border-border-strong text-content-secondary" onClick={() => setIsFolderDrawerOpen(false)} disabled={isCreatingFolder}>Cancel</Button>
            <Button className="flex-[2] shadow-sm font-bold" onClick={handleCreateFolder} disabled={isCreatingFolder}>
              {isCreatingFolder ? <div className="flex items-center"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</div> : 'Create Folder'}
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Media Configuration Drawer Modal */}
      <div className={cn(
        "fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 transform flex flex-col",
        isDrawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-app-body/50">
          <h3 className="text-[16px] font-bold text-content-primary">Configure Upload ({selectedFiles.length})</h3>
          <button
            onClick={() => {
              if (!isUploading) {
                setIsDrawerOpen(false);
                setTimeout(() => setSelectedFiles([]), 300)
              }
            }}
            disabled={isUploading}
            className="h-8 w-8 flex items-center justify-center text-content-secondary hover:bg-border-subtle hover:text-content-primary transition-colors rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Selected Files Preview */}
          <div>
            <h4 className="text-[13px] font-semibold text-content-secondary uppercase tracking-wider mb-3">Selected Files</h4>
            <div className="space-y-3">
              {selectedFiles.map(file => (
                <div key={file.id} className="flex items-center gap-3 bg-app-card-muted p-2.5 rounded-xl border border-border-subtle">
                  <div className="h-10 w-10 shrink-0 bg-white rounded-lg border border-border-strong overflow-hidden flex items-center justify-center shadow-sm">
                    {file.url ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="text-content-tertiary" size={20} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-content-primary truncate">{file.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-content-tertiary font-medium">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span className="truncate">{file.type || 'Unknown Type'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Form */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-semibold text-content-secondary uppercase tracking-wider mb-2">Asset Metadata</h4>

            <div>
              <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Asset Type <span className="text-semantic-error">*</span></label>
              <select
                className="w-full h-10 px-3 border border-border-strong rounded-lg text-[13px] text-content-primary bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                value={metaAssetType}
                onChange={e => setMetaAssetType(e.target.value)}
                disabled={isUploading}
              >
                <option value="Product Original">Product Original</option>
                <option value="AI Try-On">AI Try-On Generated</option>
                <option value="Lifestyle/Campaign">Lifestyle/Campaign</option>
                <option value="Document/Spec">Document/Specs</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Assign Folder</label>
              <select
                className="w-full h-10 px-3 border border-border-strong rounded-lg text-[13px] text-content-primary bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                value={metaFolder}
                onChange={e => setMetaFolder(e.target.value)}
                disabled={isUploading}
              >
                <option value="All Media">-- Root / All Media --</option>
                {folders.map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Assign to Product (SKU)</label>
              <div className="relative flex items-center">
                <Search className="absolute left-3 text-content-tertiary" size={16} />
                <Input
                  placeholder="Search products..."
                  className="pl-9 placeholder:text-content-tertiary"
                  value={metaProduct}
                  onChange={e => setMetaProduct(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Tags (comma-separated)</label>
              <div className="relative flex items-center">
                <Tag className="absolute left-3 text-content-tertiary" size={16} />
                <Input
                  placeholder="e.g. summer, promo, transparent"
                  className="pl-9 placeholder:text-content-tertiary"
                  value={metaTags}
                  onChange={e => setMetaTags(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </div>

            <label className="flex items-start justify-between p-4 bg-app-card-muted rounded-xl border border-border-subtle cursor-pointer hover:border-brand-soft transition-colors mt-6">
              <div className="flex gap-3">
                <Sparkles className={cn("mt-0", metaIsAi ? "text-brand" : "text-content-secondary")} size={20} />
                <div>
                  <span className="text-[13px] font-bold text-content-primary block mb-0.5">Mark as AI Asset</span>
                  <span className="text-[12px] text-content-secondary leading-tight block">Flags this media specifically as generated intentionally via AI Workflows.</span>
                </div>
              </div>
              <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors mt-0.5" style={{ backgroundColor: metaIsAi ? '#6366f1' : '#e5e7eb' }}>
                <input type="checkbox" className="sr-only" checked={metaIsAi} onChange={(e) => setMetaIsAi(e.target.checked)} disabled={isUploading} />
                <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm", metaIsAi ? "translate-x-4.5" : "translate-x-1", metaIsAi && "translate-x-4")} />
              </div>
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-border-subtle bg-app-body/50">
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[12px] font-bold">
                <span className="text-content-primary animate-pulse">Uploading {selectedFiles.length} files...</span>
                <span className="text-brand">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 w-full bg-border-strong rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex-1 bg-white border-border-strong text-content-secondary" onClick={() => { setIsDrawerOpen(false); setTimeout(() => setSelectedFiles([]), 300); }}>Cancel</Button>
              <Button className="flex-[2] shadow-sm font-bold" onClick={handleUploadConfirm}>Upload {selectedFiles.length} Files</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
