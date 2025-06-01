'use client';

import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Link href="/dashboard">Dashboard</Link>
    </div>
  );
}
