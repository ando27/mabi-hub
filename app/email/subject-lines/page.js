'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'

export default function SubjectLineGenerator() {
  const [form, setForm] = useState({ topic: '', audience: '', tone: 'curiosity', avoid: '' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.topic || !form.audience) { setError('Please fill in Email Topic and Audience.'); return }
    setError(''); setLoading(true); setResult('')
    const prompt = `You are an expert email marketer for IEEE. Generate 10 subject line options for the following email campaign:

Email Topic / Offer: ${form.topic}
Audience: ${form.audience}
Preferred Angle: ${form.tone}
Words/phrases to avoid: ${form.avoid || 'none'}

Provide exactly 10 subject lines. For each one, add a short label in parentheses indicating the angle used (e.g. curiosity, urgency, benefit-driven, personalized, question, bold claim, FOMO, humor, direct, social proof). Keep all subject lines under 60 characters. Format as a numbered list.`

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <ToolLayout title="Subject Line Generator" description="Get 10 subject line variations with different angles — great for A/B testing or when you need options fast." category="Email">
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Topic / Offer <span className="text-red-400">*</span></label>
            <input name="topic" value={form.topic} onChange={handleChange} placeholder="e.g. IEEE membership renewal discount, new publication launch, upcoming conference" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience <span className="text-red-400">*</span></label>
            <input name="audience" value={form.audience} onChange={handleChange} placeholder="e.g. Lapsed IEEE members, active student members, senior engineers" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Angle</label>
              <select name="tone" value={form.tone} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="curiosity">Curiosity</option>
                <option value="urgency">Urgency</option>
                <option value="benefit-driven">Benefit-Driven</option>
                <option value="personalized">Personalized</option>
                <option value="mix">Mix of All</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Words to Avoid</label>
              <input name="avoid" value={form.avoid} onChange={handleChange} placeholder="e.g. free, click here, urgent" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: '#006699' }}>
            {loading ? 'Generating...' : 'Generate Subject Lines'}
          </button>
        </div>
        {loading && <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3"><div className="flex gap-1"><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div><div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div></div><span className="text-sm text-gray-500">Generating subject lines...</span></div>}
        {result && <div className="result-box bg-white rounded-2xl border border-gray-100 p-6"><div className="flex justify-between mb-4"><h3 className="font-semibold text-gray-800 text-sm">Subject Lines</h3><button onClick={() => navigator.clipboard.writeText(result)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Copy all</button></div><pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre></div>}
      </div>
    </ToolLayout>
  )
}
