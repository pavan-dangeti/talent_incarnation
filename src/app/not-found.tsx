import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">That page does not exist, or it belongs to another account.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Go to the home page
      </Link>
    </main>
  );
}
