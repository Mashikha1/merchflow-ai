import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, ShoppingBag, Plus, Minus, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { toast } from 'sonner'

export function PublicShowroomCartPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', company: '', phone: '', address: ''
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(`cart_${slug}`) || '[]')
      setCart(stored)
    } catch {}
  }, [slug])

  const saveCart = (newCart) => {
    setCart(newCart)
    localStorage.setItem(`cart_${slug}`, JSON.stringify(newCart))
  }

  const updateQty = (id, delta) => {
    const next = cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta)
        return { ...item, qty: newQty }
      }
      return item
    })
    saveCart(next)
  }

  const removeItem = (id) => {
    const next = cart.filter(item => item.id !== id)
    saveCart(next)
  }

  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * item.qty), 0)

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return toast.error('Name and Email are required')
    if (cart.length === 0) return toast.error('Your cart is empty')

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/public/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer: form,
          items: cart,
          showroomSlug: slug
        })
      })

      if (!res.ok) throw new Error('Failed to place order')
      
      setSuccess(true)
      saveCart([]) // Clear cart on success
    } catch (err) {
      toast.error('Could not place order', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={64} className="text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-[#2c2420] mb-2">Order Placed Successfully!</h1>
        <p className="text-[#8c7e72] max-w-md mb-8">Thank you for your order. We have received your request and will contact you shortly with the next steps.</p>
        <Link to={`/s/${slug}`} className="px-6 py-3 bg-[#C47B2B] text-white rounded-xl font-bold hover:bg-[#a86820] transition">
          Return to Showroom
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[#e8e2da]">
        <div className="max-w-4xl mx-auto px-6 flex items-center h-16">
          <button onClick={() => navigate(-1)} className="text-[#8c7e72] hover:text-[#2c2420] transition flex items-center gap-2 font-medium">
            <ArrowLeft size={18} /> Back to Showroom
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        <h1 className="text-3xl font-bold text-[#2c2420] flex items-center gap-3 mb-8">
          <ShoppingBag className="text-[#C47B2B]" size={28} /> Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e8e2da] p-12 text-center shadow-sm">
            <div className="text-5xl mb-4 opacity-50">🛒</div>
            <h2 className="text-xl font-bold text-[#2c2420]">Your cart is empty</h2>
            <p className="text-[#8c7e72] mt-2 mb-6">Looks like you haven't added anything yet.</p>
            <Link to={`/s/${slug}`} className="inline-block px-6 py-3 bg-[#2c2420] text-white rounded-xl font-bold hover:bg-[#4a3d36] transition">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1fr_350px]">
            {/* Cart Items */}
            <div className="space-y-4">
              {cart.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e8e2da] p-4 flex gap-4 items-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2c2420] truncate">{item.name}</h3>
                    <p className="text-xs text-[#8c7e72] uppercase tracking-wider mt-1">SKU: {item.sku || 'N/A'}</p>
                    <div className="text-sm font-bold text-[#C47B2B] mt-2">${item.price || 0}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-500 hover:text-black hover:bg-white rounded"><Minus size={16} /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-500 hover:text-black hover:bg-white rounded"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl ml-2 transition">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-2xl border border-[#C47B2B]/30 p-6 shadow-md h-fit sticky top-24">
              <h2 className="text-xl font-bold text-[#2c2420] mb-6">Order Summary</h2>
              
              <div className="flex justify-between items-end mb-6 pb-6 border-b border-[#e8e2da]">
                <span className="text-[#8c7e72]">Subtotal ({cart.reduce((a,c)=>a+c.qty, 0)} items)</span>
                <span className="text-2xl font-bold text-[#2c2420]">${subtotal.toFixed(2)}</span>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <h3 className="font-bold text-[#2c2420] text-sm">Shipping & Contact</h3>
                <Input placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="bg-gray-50" />
                <Input type="email" placeholder="Email Address *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="bg-gray-50" />
                <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-gray-50" />
                <Input placeholder="Company Name (Optional)" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="bg-gray-50" />
                <Input placeholder="Delivery Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-gray-50" />

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-[#C47B2B] hover:bg-[#a86820] text-white py-6 text-lg rounded-xl mt-4"
                >
                  {loading ? 'Processing...' : 'Place Order Now'}
                </Button>
                <p className="text-xs text-center text-[#8c7e72] mt-4">By placing this order, you agree to our terms of service.</p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
