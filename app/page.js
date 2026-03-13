import Link from 'next/link'
import Sidebar from '../components/Sidebar'

const categories = [
  {
    title: 'Email',
    icon: '✉️',
    description: 'AI-powered tools for writing, QA, and audience segmentation.',
    color: 'from-blue-50 to-cyan-50',
    border: 'border-blue-100',
    tools: [
      { name: 'Email Copywriter', desc: 'Generate full email copy from a campaign brief', href: '/email/copywriter' },
      { name: 'Subject Line Generator', desc: 'Get 5–10 subject line variations instantly', href: '/email/subject-lines' },
      { name: 'Campaign QA Checklist', desc: 'Catch issues before you hit send', href: '/email/qa-checklist' },
      { name: 'Segment Brief Generator', desc: 'Translate campaign goals into audience logic', href: '/email/segment-brief' },
    ]
  },
  {
    title: 'Data & BI',
    icon: '🗄️',
    description: 'Query, build, and understand data without needing SQL expertise.',
    color: 'from-teal-50 to-blue-50',
    border: 'border-teal-100',
    tools: [
      { name: 'Natural Language to SQL', desc: 'Describe what you need, get a Redshift query', href: '/data/nl-to-sql' },
      { name: 'Alteryx Assistant', desc: 'Build and troubleshoot Alteryx workflows', href: '/data/alteryx-assistant' },
      { name: 'Data Summarizer', desc: 'Turn raw data output into readable insights', href: '/data/summarizer' },
    ]
  },
  {
    title: 'Performance Analytics',
    icon: '📊',
    description: 'Turn Marketo exports and campaign data into clear reports.',
    color: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-100',
    tools: [
      { name: 'Campaign Recap Generator', desc: 'Auto-generate performance summaries from CSV data', href: '/analytics/campaign-recap' },
      { name: 'Email Analytics Dashboard', desc: 'Visual dashboard with AI-generated insights', href: '/analytics/dashboard' },
    ]
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: '#006699' }}>M</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MABI Hub</h1>
              <p className="text-sm text-gray-500">AI Toolkit · IEEE Marketing Automation & Business Intelligence</p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-blue-200 to-transparent mt-4" />
        </div>

        {/* Welcome */}
        <div className="rounded-2xl p-6 mb-8 border" style={{ background: 'linear-gradient(135deg, #006699 0%, #004466 100%)', borderColor: '#005580' }}>
          <h2 className="text-white text-xl font-semibold mb-1">Welcome to MABI Hub</h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
            Your team's centralized AI toolkit. Pick a tool from any category below — or use the sidebar — to get started. Every tool is powered by AI and built specifically for the MABI team's workflows.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{cat.icon}</span>
                <h2 className="text-lg font-semibold text-gray-800">{cat.title}</h2>
                <span className="text-sm text-gray-400">— {cat.description}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3">
                {cat.tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`tool-card bg-gradient-to-br ${cat.color} border ${cat.border} rounded-xl p-5 block`}
                  >
                    <div className="font-semibold text-gray-800 mb-1 text-sm">{tool.name}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{tool.desc}</div>
                    <div className="mt-3 text-xs font-medium" style={{ color: '#006699' }}>Open tool →</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
