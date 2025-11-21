import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center">
          SaaS Starter Kit
        </h1>
        <p className="text-lg text-gray-600 text-center max-w-2xl">
          A clean foundation for your next project. Built with Next.js 14, Tailwind CSS, and TypeScript.
        </p>

        <div className="flex gap-4">
          <Button variant="primary">Get Started</Button>
          <Button variant="outline">Documentation</Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Authentication</h3>
            <p className="text-gray-500">JWT-based auth ready to go.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">API Routes</h3>
            <p className="text-gray-500">Server-side logic in /app/api.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Components</h3>
            <p className="text-gray-500">Organized in /components.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
