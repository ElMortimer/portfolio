export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">
        Your Name
      </h1>

      <p className="text-xl text-gray-400 mb-8">
        Java Developer • Student • Future Software Engineer
      </p>

      <div className="flex gap-4">
        <a
          href="https://github.com/YOUR_GITHUB"
          className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
        >
          GitHub
        </a>

        <a
          href="https://linkedin.com"
          className="border border-white px-6 py-3 rounded-xl"
        >
          LinkedIn
        </a>
      </div>
    </main>
  );
}