import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'

export function PublicShowroomRequestSamplePage() {
  const { slug } = useParams()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', address: '', notes: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return toast.error('Name and email are required')
    setSending(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/public/quote-request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer: { ...form, sampleRequest: true }, showroomSlug: slug, items: [] })
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch { toast.error('Failed to submit — please try again.') }
    setSending(false)
  }

  if (submitted) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="text-5xl">📦</div>
        <h1 className="text-2xl font-bold text-[#2c2420]">Sample Request Submitted</h1>
        <p className="text-[#8c7e72]">Thank you, {form.name}! Our team will review your sample request and contact you with shipping details.</p>
        <Link to={`/s/${slug}`} className="inline-block mt-4 px-6 py-3 bg-[#C47B2B] text-white rounded-lg font-medium hover:bg-[#a86820] transition">Back to Showroom</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[#e8e2da]">
        <div className="max-w-6xl mx-auto px-6 flex items-center h-14">
          <Link to={`/s/${slug}`} className="text-sm font-medium text-[#C47B2B] hover:underline">← Back to Showroom</Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[#2c2420] mb-2">Request a Sample</h1>
        <p className="text-sm text-[#8c7e72] mb-8">Interested in seeing our products in person? Fill in your details and we'll arrange a sample shipment.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#2c2420]">Full Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full h-11 rounded-xl border border-[#e8e2da] px-4 text-sm outline-none focus:ring-2 focus:ring-[#C47B2B] bg-white" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#2c2420]">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="mt-1 w-full h-11 rounded-xl border border-[#e8e2da] px-4 text-sm outline-none focus:ring-2 focus:ring-[#C47B2B] bg-white" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#2c2420]">Company</label>
            <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#e8e2da] px-4 text-sm outline-none focus:ring-2 focus:ring-[#C47B2B] bg-white" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#2c2420]">Shipping Address</label>
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-[#e8e2da] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C47B2B] bg-white resize-none" placeholder="Full shipping address…" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#2c2420]">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-[#e8e2da] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C47B2B] bg-white resize-none" placeholder="Specific sizes, colors, etc." />
          </div>
          <button type="submit" disabled={sending} className="w-full h-12 bg-[#C47B2B] text-white rounded-xl font-semibold hover:bg-[#a86820] transition disabled:opacity-50">
            {sending ? 'Submitting…' : 'Submit Sample Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
