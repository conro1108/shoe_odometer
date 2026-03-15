import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Shoe Odometer</h1>
      <p className="text-muted-foreground">Track your shoe mileage</p>
      <Link
        href="/closet"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go to Closet
      </Link>
    </div>
  );
}
