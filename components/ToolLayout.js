import Sidebar from './Sidebar'

export default function ToolLayout({ children, title, description, category }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 max-w-4xl">
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{category}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
          <div className="h-px bg-gradient-to-r from-blue-200 to-transparent mt-4" />
        </div>
        {children}
      </main>
    </div>
  )
}
