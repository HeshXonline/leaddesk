export default function Templates() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Quick Reply Templates
        </h1>
        <p className="text-secondary mt-1">
          Manage saved message templates for quick replies
        </p>
      </div>
      <div className="bg-white rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
          Templates coming soon
        </h2>
        <p className="text-secondary text-sm max-w-sm">
          Create and manage your quick reply templates for faster responses
          to common customer inquiries.
        </p>
      </div>
    </div>
  );
}
