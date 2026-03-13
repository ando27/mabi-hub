'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {
    category: 'Email',
    icon: '✉️',
    color: '#006699',
    tools: [
      { name: 'Email Copywriter', href: '/email/copywriter' },
      { name: 'Subject Line Generator', href: '/email/subject-lines' },
      { name: 'Campaign QA Checklist', href: '/email/qa-checklist' },
      { name: 'Segment Brief Generator', href: '/email/segment-brief' },
    ]
  },
  {
    category: 'Data & BI',
    icon: '🗄️',
    color: '#006699',
    tools: [
      { name: 'Natural Language to SQL', href: '/data/nl-to-sql' },
      { name: 'Alteryx Assistant', href: '/data/alteryx-assistant' },
      { name: 'Data Summarizer', href: '/data/summarizer' },
    ]
  },
  {
    category: 'Performance Analytics',
    icon: '📊',
    color: '#006699',
    tools: [
      { name: 'Campaign Recap Generator', href: '/analytics/campaign-recap' },
      { name: 'Email Analytics Dashboard', href: '/analytics/dashboard' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#006699' }}>
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-none text-sm">MABI Hub</div>
            <div className="text-xs text-gray-400 leading-none mt-0.5">IEEE Marketing AI</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {nav.map((section) => (
          <div key={section.category} className="mb-5">
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="text-sm">{section.icon}</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.category}</span>
            </div>
            <ul className="space-y-0.5">
              {section.tools.map((tool) => {
                const isActive = pathname === tool.href
                return (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      className={`sidebar-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 ${isActive ? 'active' : ''}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0"></span>
                      {tool.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">IEEE · MABI Team · Internal Use</p>
      </div>
    </aside>
  )
}
