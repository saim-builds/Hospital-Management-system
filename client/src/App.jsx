import { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(setHealth)
      .catch(() => setError("Cannot reach the API. Is the server running?"));
  }, []);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-extrabold">Medora</h1>
      <p className="mt-2 text-muted">Hospital management system</p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-bold">System check</h2>
        {error && <p className="mt-3 text-red-700">{error}</p>}
        {!error && !health && <p className="mt-3 text-muted">Checking...</p>}
        {health && (
          <ul className="mt-3 space-y-1 text-sm">
            <li>API: <b>{health.status}</b></li>
            <li>Database: <b>{health.database}</b></li>
          </ul>
        )}
      </div>
    </main>
  );
}