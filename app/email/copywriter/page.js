'use client'
import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout'

export default function EmailCopywriter() {
  const [form, setForm] = useState({
    goal: '',
    audience: '',
    tone: 'professional',
    keyMessage: '',
    length: 'medium',
  })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.goal || !form.audience || !form.keyMessage) {
      setError('Please fill in Campaign Goal, Target Audience, and Key Message.')
      return
    }
    setError('')
    setLoading(true)
    setResult('')

    const prompt = `You are an expert email marketer for IEEE, a global professional organization for technology and engineering professionals. Write a complete marketing email based on the following brief:

Campaign Goal: ${form.goal}
Target Audience: ${form.audience}
Tone: ${form.tone}
Key Message / Offer: ${form.keyMessage}
Email Length: ${form.length} (short = ~100 words, medium = ~200 words, long = ~350 words)

Please provide:
1. THREE subject line options (labeled Subject Line 1, 2, 3)
2. ONE preview text (40-90 characters)
3. Full email body with a clear CTA

Format the output cleanly with clear section labels. Write in the specified tone. The email should feel professional and on-brand for IEEE.`

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
  }

  return (
    <ToolLayout
      title="Email Copywriter Assistant"
      description="Fill in your campaign brief and get a full email draft — subject lines, preview text, and body copy — ready to paste into Knack."
      category="Email"
    >
      <div className="space-y-5">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Goal <span className="text-red-400">*</span></label>
            <input
              name="goal"
              value={form.goal}
              onChange={handleChange}
              placeholder="e.g. Drive renewals for lapsed IEEE members, promote the annual conference, increase student membership"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Audience <span className="text-red-400">*</span></label>
            <input
              name="audience"
              value={form.audience}
              onChange={handleChange}
              placeholder="e.g. Lapsed members aged 30-50, student members in the US, senior engineers with active memberships"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Message / Offer <span className="text-red-400">*</span></label>
            <textarea
              name="keyMessage"
              value={form.keyMessage}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Renew your membership before Dec 31 and save 20%. Access thousands of IEEE publications and connect with 400,000+ global members."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
              <select
                name="tone"
                value={form.tone}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="urgent">Urgent</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Length</label>
              <select
                name="length"
                value={form.length}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="short">Short (~100 words)</option>
                <option value="medium">Medium (~200 words)</option>
                <option value="long">Long (~350 words)</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: '#006699' }}
          >
            {loading ? 'Generating...' : 'Generate Email Copy'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-3">
            <div className="flex gap-1">
              <div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div>
              <div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div>
              <div className="loading-dot w-2 h-2 rounded-full bg-blue-400"></div>
            </div>
            <span className="text-sm text-gray-500">Writing your email...</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="result-box bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">Generated Email</h3>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Copy to clipboard
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
