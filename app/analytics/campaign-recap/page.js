'use client'
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function CampaignRecap() {
  const [form, setForm] = useState({ campaignName: '', date: '', goal: '', metrics: '', context: '' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.campaignName || !form.metrics) { setError('Campaign name and metrics are required.'); return }
    setError(''); setLoading(true); setResult('')
    const prompt = `You are a senior email marketing analyst at IEEE. Write a professional campaign performance recap based on the following data.

Campaign Name: ${form.campaignName}
Send Date: ${form.date || 'Not specified'}
Campaign Goal: ${form.goal || 'Not specified'}
Performance Metrics:
${form.metrics}
Additional Context: ${form.context || 'None'}

Industry benchmarks for reference:
- Average open rate: 20-25%
- Average click-to-open rate: 10-15%
- Average unsubscribe rate: <0.5%
- Average bounce rate: <2%

Write a performance recap that includes:
1. CAMPAIGN OVERVIEW — One paragraph summarizing the campaign and its goal
2. PERFORMANCE HIGHLIGHTS — How the key metrics performed vs. benchmarks, written as narrative
3. WHAT WORKED — Specific elements that drove positive results
4. AREAS FOR IMPROVEMENT — What underperformed and why it may have happened
5. RECOMMENDATIONS FOR NEXT SEND — 3 specific, actionable suggestions

Write in a professional, confident tone suitable for sharing with marketing leadership. Use the actual numbers provided.`

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <ToolLayout title="Campaign Recap Generator" description="Enter your campaign metrics and get a polished performance recap ready to share with your team or leadership." category="Performance Analytics">
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Name <span className="text-red-400">*</span></label>
              <input name="campaignName" value={form.campaignName} onChange={handleChange} placeholder="e.g. Q4 Membership Renewal — Wave 1" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Send Date</label>
              <input name="date" value={form.date} onChange={handleChange} placeholder="e.g. November 12, 2024" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Goal</label>
            <input name="goal" value={form.goal} onChange={handleChange} placeholder="e.g. Drive membership renewals for members expiring in Q1" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Performance Metrics <span className="text-red-400">*</span></label>
            <textarea name="metrics" value={form.metrics} onChange={handleChange} rows={6} placeholder={`Paste your metrics here. Example:\nSent: 45,230\nDelivered: 44,891 (99.2%)\nOpens: 10,374 (23.1%)\nClicks: 1,847 (4.1%)\nUnsubscribes: 89 (0.2%)\nBounces: 339 (0.75%)\nRevenue attributed: $12,400`} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Context</label>
            <input name="context" value={form.context} onChange={handleChange} placeholder="e.g. New subject line approach, different send time, segmented by geography for first time" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#006699' }}>
            {loading ? 'Writing recap...' : 'Generate Campaign Recap'}
          </button>
        </div>
        {loading && <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3"><div className="flex gap-1"><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div></div><span className="text-sm text-gray-500">Writing your campaign recap...</span></div>}
        {result && <div className="result-box bg-white rounded-2xl border border-gray-100 p-6"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-800 text-sm">Campaign Recap</h3><button onClick={() => navigator.clipboard.writeText(result)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Copy</button></div><pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre></div>}
      </div>
    </ToolLayout>
  )
}
