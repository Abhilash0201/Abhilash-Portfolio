'use client';

import dynamic from 'next/dynamic';

const VideoIntro = dynamic(() => import('../components/VideoIntro'), {
  ssr: false,
  loading: () => <div style={{ background: '#000', height: '100dvh' }} />,
});

export default function Home() {
  return (
    <main>
      <VideoIntro />
    </main>
  );
}
