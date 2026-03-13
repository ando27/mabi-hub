'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'

export default function NLtoSQL() {
  const [form, setForm] = useState({ request: '', tables: '', context: '' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.request) { setError('Please describe what data you need.'); return }
    setError(''); setLoading(true); setResult('')
    const prompt = `You are a senior data engineer at IEEE. The team uses Amazon Redshift as their data warehouse. Data originates from Siebel (member/order records) and is ETL'd into Redshift using Alteryx. Marketo is used for email marketing.

Convert the following natural language request into a clean, production-ready SQL query for Amazon Redshift:

Data Request: ${form.request}
Known Table / Field Names: ${form.tables || 'Not specified — use reasonable assumptions based on standard CRM/membership data structures'}
Additional Context: ${form.context || 'None'}

Provide:
1. THE SQL QUERY — formatted cleanly, with comments explaining key logic
2. PLAIN-ENGLISH EXPLANATION — what the query does in simple terms
3. ASSUMPTIONS MADE — list any table/field names you assumed
4. SUGGESTED NEXT STEPS — how to run or adapt this query in Alteryx or Redshift

Format clearly with labeled sections. If multiple query approaches exist, show the simplest one first.`

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <ToolLayout title="Natural Language to SQL" description="Describe the data you need in plain English and get a Redshift-ready SQL query with a full explanation." category="Data & BI">
      <div className="space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-700 font-medium">💡 Tip: The more context you provide about your tables and fields, the more accurate the query will be. Check with your data team to confirm table names before running.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What data do you need? <span className="text-red-400">*</span></label>
            <textarea name="request" value={form.request} onChange={handleChange} rows={4} placeholder="e.g. Show me all members who purchased a membership in the last 90 days but haven't opened a single email in the past 6 months. Include their email, membership grade, and join date." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Known Table / Field Names</label>
            <input name="tables" value={form.tables} onChange={handleChange} placeholder="e.g. members table, orders table, email_activity table, member_id, email_address, membership_grade" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Context</label>
            <input name="context" value={form.context} onChange={handleChange} placeholder="e.g. Only include US members, exclude student memberships, data is in UTC" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#006699' }}>
            {loading ? 'Generating SQL...' : 'Generate SQL Query'}
          </button>
        </div>
        {loading && <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3"><div className="flex gap-1"><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div></div><span className="text-sm text-gray-500">Writing your query...</span></div>}
        {result && <div className="result-box bg-white rounded-2xl border border-gray-100 p-6"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-800 text-sm">SQL Query + Explanation</h3><button onClick={() => navigator.clipboard.writeText(result)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Copy</button></div><pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono bg-gray-50 rounded-lg p-4">{result}</pre></div>}
      </div>
    </ToolLayout>
  )
}
