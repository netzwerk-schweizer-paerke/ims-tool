import { Badge } from '@/components/Badge';
import { Background } from '@/components/Background';
import Link from 'next/link';
import React from 'react';

const Page = () => {
  return (
    <>
      <main>
        <article>
          <Badge />
          <h1>Payload 3.0</h1>
          <p>
            Payload is running at <Link href="/admin">/admin</Link>. An example of a custom route
            running the Local API can be found at <Link href="/my-route">/my-route</Link>.
          </p>
        </article>
      </main>
      <Background />
    </>
  );
};

export default Page;
