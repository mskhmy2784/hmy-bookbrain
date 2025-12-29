'use client';

import dynamic from 'next/dynamic';

const NewNoteContent = dynamic(() => import('@/components/NewNoteContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">読み込み中...</p>
    </div>
  ),
});

export default function NewNoteClient() {
  return <NewNoteContent />;
}
