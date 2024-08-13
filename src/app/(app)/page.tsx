import { Background } from '@/components/Background';
import Link from 'next/link';
import React from 'react';

const Page = () => {
  return (
    <>
      <main>
        <article>
          <h1>IMS Tool</h1>
          <p>
            Please log in via <Link href="/admin">/admin</Link>.
          </p>
        </article>
      </main>
      <Background />
    </>
  );
};

export default Page;
