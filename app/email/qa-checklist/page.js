'use client'
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function QAChecklist() {
  const [form, setForm] = useState({ subject: '', previewText: '', body: '', segment: '', cta: '' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.subject || !form.body) { setError('Subject line and email body are required.'); return }
    setError(''); setLoading(true); setResult('')
    const prompt = `You are a senior email marketing QA specialist at IEEE. Review the following email campaign details and provide a thorough pre-send QA report.

Subject Line: ${form.subject}
Preview Text: ${form.previewText || 'Not provided'}
Email Body: ${form.body}
Target Segment: ${form.segment || 'Not specified'}
CTA / Link Destination: ${form.cta || 'Not specified'}

Review for:
1. Subject line effectiveness (length, spam triggers, clarity)
2. Preview text alignment with subject
3. Body copy clarity and grammar
4. CTA strength and clarity
5. Unsubscribe / compliance language presence
6. Audience-message fit
7. Any potential spam trigger words
8. Missing or weak elements

Format your response as a QA Report with:
- An overall risk rating (Low / Medium / High)
- A list of ISSUES FOUND (if any), each with severity (Critical / Warning / Suggestion)
- A list of PASSED CHECKS
- A brief RECOMMENDATION summary

Be specific and actionable.`

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <ToolLayout title="Campaign QA Checklist" description="Paste your email details and get an AI-powered pre-send review that flags issues before you hit send." category="Email">
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line <span className="text-red-400">*</span></label>
              <input name="subject" value={form.subject} onChange={handleChange} placeholder="Your email subject line" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preview Text</label>
              <input name="previewText" value={form.previewText} onChange={handleChange} placeholder="Email preview text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Body <span className="text-red-400">*</span></label>
            <textarea name="body" value={form.body} onChange={handleChange} rows={6} placeholder="Paste your full email body copy here..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Segment</label>
              <input name="segment" value={form.segment} onChange={handleChange} placeholder="e.g. Lapsed members, US engineers" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Destination</label>
              <input name="cta" value={form.cta} onChange={handleChange} placeholder="e.g. IEEE renewal page, conference registration" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#006699' }}>
            {loading ? 'Running QA Review...' : 'Run QA Check'}
          </button>
        </div>
        {loading && <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3"><div className="flex gap-1"><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div></div><span className="text-sm text-gray-500">Reviewing your campaign...</span></div>}
        {result && <div className="result-box bg-white rounded-2xl border border-gray-100 p-6"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-800 text-sm">QA Report</h3><button onClick={() => navigator.clipboard.writeText(result)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Copy report</button></div><pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre></div>}
      </div>
    </ToolLayout>
  )
}
