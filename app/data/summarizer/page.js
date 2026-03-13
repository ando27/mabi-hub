'use client'
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function DataSummarizer() {
  const [form, setForm] = useState({ data: '', context: '', audience: 'internal team' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.data || !form.context) { setError('Please paste your data and provide context.'); return }
    setError(''); setLoading(true); setResult('')
    const prompt = `You are a senior business intelligence analyst at IEEE. Analyze the following data and produce a clear, professional summary.

Data: 
${form.data}

What this data represents: ${form.context}
Audience for this summary: ${form.audience}

Provide:
1. EXECUTIVE SUMMARY — 2-3 sentences capturing the most important takeaway
2. KEY FINDINGS — The most significant patterns, trends, or numbers in the data (5-7 bullet points)
3. ANOMALIES OR CONCERNS — Anything that looks unusual or worth investigating
4. RECOMMENDED NEXT STEPS — 2-3 specific, actionable recommendations based on what the data shows

Write in a clear, professional tone appropriate for ${form.audience}. Focus on business impact, not just numbers.`

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <ToolLayout title="Data Summarizer" description="Paste raw data output and get a clean, readable business summary with key findings and recommended next steps." category="Data & BI">
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paste Your Data <span className="text-red-400">*</span></label>
            <textarea name="data" value={form.data} onChange={handleChange} rows={8} placeholder="Paste your data here — CSV rows, query results, a table, numbers, anything." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What does this data represent? <span className="text-red-400">*</span></label>
            <input name="context" value={form.context} onChange={handleChange} placeholder="e.g. Monthly email campaign performance for Q4 2024, membership renewal rates by geography, email engagement by segment" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Who is this summary for?</label>
            <select name="audience" value={form.audience} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="internal team">Internal team (technical, detailed)</option>
              <option value="marketing leadership">Marketing leadership (strategic, high-level)</option>
              <option value="executive stakeholders">Executive stakeholders (brief, business impact focused)</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#006699' }}>
            {loading ? 'Analyzing data...' : 'Summarize Data'}
          </button>
        </div>
        {loading && <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3"><div className="flex gap-1"><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div></div><span className="text-sm text-gray-500">Analyzing your data...</span></div>}
        {result && <div className="result-box bg-white rounded-2xl border border-gray-100 p-6"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-800 text-sm">Data Summary</h3><button onClick={() => navigator.clipboard.writeText(result)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Copy</button></div><pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre></div>}
      </div>
    </ToolLayout>
  )
}
