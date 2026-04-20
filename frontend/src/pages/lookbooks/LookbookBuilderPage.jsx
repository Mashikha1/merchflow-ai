import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Save, Eye, Monitor, Smartphone, LayoutGrid, Type, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

export function LookbookBuilderPage() {
  const [sections, setSections] = useState([
    { id: '1', type: 'hero', content: 'Fall Collection' },
    { id: '2', type: 'grid', content: 'Featured Products' }
  ])

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden -mx-4 -mt-6">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>Back</Button>
          <div className="h-4 w-px bg-gray-200"></div>
          <h2 className="font-semibold text-lg">Autumn Edit 2026</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-md flex mr-4">
            <button className="p-1 px-3 bg-white shadow-sm rounded text-gray-900 text-xs font-medium flex items-center"><Monitor size={14} className="mr-1" /> Desktop</button>
            <button className="p-1 px-3 text-gray-500 hover:text-gray-900 text-xs flex items-center"><Smartphone size={14} className="mr-1" /> Mobile</button>
          </div>
          <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Preview</Button>
          <Button><Save className="mr-2 h-4 w-4" /> Save & Publish</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Blocks */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add Block</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="border border-gray-200 rounded p-3 flex flex-col items-center justify-center gap-2 bg-white hover:border-black transition-colors text-xs font-medium text-gray-700">
                <ImageIcon size={20} className="text-gray-400" /> Hero Cover
              </button>
              <button className="border border-gray-200 rounded p-3 flex flex-col items-center justify-center gap-2 bg-white hover:border-black transition-colors text-xs font-medium text-gray-700">
                <LayoutGrid size={20} className="text-gray-400" /> Prod Grid
              </button>
              <button className="border border-gray-200 rounded p-3 flex flex-col items-center justify-center gap-2 bg-white hover:border-black transition-colors text-xs font-medium text-gray-700">
                <Type size={20} className="text-gray-400" /> Text Block
              </button>
              <button className="border border-gray-200 rounded p-3 flex flex-col items-center justify-center gap-2 bg-white hover:border-black transition-colors text-xs font-medium text-gray-700">
                <Plus size={20} className="text-gray-400" /> Collection
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Theme Colors</label>
                <div className="flex gap-2">
                  <button className="w-6 h-6 rounded-full bg-black ring-2 ring-offset-1 ring-black"></button>
                  <button className="w-6 h-6 rounded-full bg-[#E5D0BA] border border-gray-200"></button>
                  <button className="w-6 h-6 rounded-full bg-[#8E9B90] border border-gray-200"></button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Typography</label>
                <select className="w-full text-xs border-gray-200 rounded">
                  <option>Inter / System UI</option>
                  <option>Playfair Display / Serif</option>
                  <option>Space Grotesk</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Builder Canvas */}
        <div className="flex-1 bg-gray-200 overflow-y-auto p-8 flex justify-center pb-32 shadow-inner">
          <div className="w-[800px] flex flex-col gap-4">
            {sections.map(section => (
              <div key={section.id} className="group relative bg-white min-h-[300px] w-full shadow-sm rounded flex items-center justify-center border-2 border-transparent hover:border-indigo-400 transition-colors">

                {/* Visualizer Mock */}
                {section.type === 'hero' && (
                  <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300 mb-2" />
                    <h1 className="text-4xl font-serif text-gray-800">{section.content}</h1>
                  </div>
                )}
                {section.type === 'grid' && (
                  <div className="absolute inset-0 p-8">
                    <h3 className="text-xl font-medium mb-6 text-center">{section.content}</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="aspect-[3/4] bg-gray-100"></div>
                      <div className="aspect-[3/4] bg-gray-100"></div>
                      <div className="aspect-[3/4] bg-gray-100"></div>
                    </div>
                  </div>
                )}

                {/* Toolbar */}
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded flex z-20">
                  <Button variant="ghost" size="sm" className="h-8 px-2 border-r border-gray-100 rounded-none"><LayoutGrid size={14} /></Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-700"><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}

            <button className="w-full py-6 border-2 border-dashed border-gray-300 rounded text-gray-500 font-medium hover:border-black hover:text-black transition-colors flex items-center justify-center">
              <Plus className="mr-2 h-4 w-4" /> Add Section Here
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
