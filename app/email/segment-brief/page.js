'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'

export default function SegmentBrief() {
  const [form, setForm] = useState({ campaign: '', goal: '', product: '', filters: '' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.campaign || !form.goal) { setError('Campaign description and goal are required.'); return }
    setError(''); setLoading(true); setResult('')
    const prompt = `You are a senior marketing operations strategist at IEEE, a global professional organization for engineers and technology professionals with over 4 million contacts in their database (stored in Marketo, sourced from Siebel CRM and Amazon Redshift).

Help define the audience segmentation strategy for the following campaign:

Campaign Description: ${form.campaign}
Campaign Goal: ${form.goal}
Product / Membership Being Promoted: ${form.product || 'Not specified'}
Known Audience Filters Available: ${form.filters || 'None specified'}

Provide:
1. RECOMMENDED SEGMENT — A clear plain-English description of who should receive this email
2. INCLUSION CRITERIA — Specific filter logic to build this segment in Marketo (membership status, purchase history, engagement, geography, grade level, etc.)
3. EXCLUSION CRITERIA — Who to suppress (recent purchasers, unsubscribes, already engaged, etc.)
4. ESTIMATED AUDIENCE CONSIDERATIONS — What to think about regarding list size and deliverability
5. SEGMENT RATIONALE — Why this audience is the right fit for this campaign

Be specific and practical. Format clearly with labeled sections.`

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <ToolLayout title="Segment Brief Generator" description="Describe your campaign and get a recommended audience segmentation strategy with Marketo filter logic." category="Email">
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Description <span className="text-red-400">*</span></label>
            <textarea name="campaign" value={form.campaign} onChange={handleChange} rows={3} placeholder="e.g. End-of-year membership renewal push targeting members whose memberships expire in Q1. We want to remind them of benefits and offer a discount." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Goal <span className="text-red-400">*</span></label>
            <input name="goal" value={form.goal} onChange={handleChange} placeholder="e.g. Drive membership renewals, increase event registrations, upsell to higher membership grade" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product / Membership Type</label>
              <input name="product" value={form.product} onChange={handleChange} placeholder="e.g. IEEE Senior Member, Student Membership" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Known Filters / Constraints</label>
              <input name="filters" value={form.filters} onChange={handleChange} placeholder="e.g. US only, expiry date in Jan-Mar, not emailed in 30 days" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#006699' }}>
            {loading ? 'Building segment strategy...' : 'Generate Segment Brief'}
          </button>
        </div>
        {loading && <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3"><div className="flex gap-1"><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div></div><span className="text-sm text-gray-500">Building your segment strategy...</span></div>}
        {result && <div className="result-box bg-white rounded-2xl border border-gray-100 p-6"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-800 text-sm">Segment Brief</h3><button onClick={() => navigator.clipboard.writeText(result)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Copy</button></div><pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre></div>}
      </div>
    </ToolLayout>
  )
}
