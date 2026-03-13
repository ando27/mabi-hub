import ToolLayout from '../../components/ToolLayout'

export default function AnalyticsDashboard() {
  return (
    <ToolLayout title="Email Analytics Dashboard" description="Visual dashboard with AI-generated insights powered by your Marketo data." category="Performance Analytics">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          The Email Analytics Dashboard will connect to your Marketo CSV exports and display visual performance charts with AI-generated insights. This will be built in the next phase.
        </p>
      </div>
    </ToolLayout>
  )
}
