'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'

export default function AlteryxAssistant() {
  const [form, setForm] = useState({ goal: '', currentSteps: '', error: '', experience: 'intermediate' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.goal) { setFormError('Please describe what your workflow needs to do.'); return }
    setFormError(''); setLoading(true); setResult('')
    const prompt = `You are an Alteryx expert consultant. The team uses Alteryx to ETL data from Amazon Redshift for use in Marketo email marketing campaigns at IEEE.

Help with the following Alteryx workflow request:

Workflow Goal: ${form.goal}
Current Workflow Steps (if applicable): ${form.currentSteps || 'None provided — building from scratch'}
Error Message (if troubleshooting): ${form.error || 'No error — building new workflow'}
User Experience Level: ${form.experience}

Provide:
1. RECOMMENDED WORKFLOW — Step-by-step list of Alteryx tools to use in order, with a brief description of what each tool does in this context
2. KEY CONFIGURATION NOTES — Important settings to configure for the main tools
3. COMMON PITFALLS — What to watch out for with this type of workflow
4. TROUBLESHOOTING (if an error was provided) — Specific guidance on fixing the error

Tailor the explanation to a ${form.experience} Alteryx user. Be practical and specific to IEEE's use case (Redshift data, membership records, Marketo uploads).`

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch { setFormError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <ToolLayout title="Alteryx Workflow Assistant" description="Describe what you need your Alteryx workflow to do and get step-by-step tool recommendations and configuration guidance." category="Data & BI">
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What does your workflow need to do? <span className="text-red-400">*</span></label>
            <textarea name="goal" value={form.goal} onChange={handleChange} rows={4} placeholder="e.g. Pull all active IEEE members from Redshift, filter to US-only, join with email engagement data from the last 60 days, and output a CSV for Marketo upload." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Workflow Steps (optional)</label>
            <textarea name="currentSteps" value={form.currentSteps} onChange={handleChange} rows={3} placeholder="e.g. Input Data (Redshift) → Filter → Join → Output. Describe what you have so far if troubleshooting." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Error Message (if troubleshooting)</label>
            <input name="error" value={form.error} onChange={handleChange} placeholder="Paste the Alteryx error message here" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Alteryx Experience Level</label>
            <select name="experience" value={form.experience} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="beginner">Beginner — explain everything step by step</option>
              <option value="intermediate">Intermediate — familiar with basic tools</option>
              <option value="advanced">Advanced — just give me the technical details</option>
            </select>
          </div>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#006699' }}>
            {loading ? 'Analyzing...' : 'Get Workflow Guidance'}
          </button>
        </div>
        {loading && <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3"><div className="flex gap-1"><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div></div><span className="text-sm text-gray-500">Building your workflow guide...</span></div>}
        {result && <div className="result-box bg-white rounded-2xl border border-gray-100 p-6"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-800 text-sm">Workflow Guidance</h3><button onClick={() => navigator.clipboard.writeText(result)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Copy</button></div><pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre></div>}
      </div>
    </ToolLayout>
  )
}
