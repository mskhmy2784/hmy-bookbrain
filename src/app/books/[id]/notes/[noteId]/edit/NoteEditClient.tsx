'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getNote } from '@/lib/notes';
import { Note } from '@/types/book';
import { NoteForm } from '@/components/NoteForm';

export default function NoteEditClient() {
  const params = useParams();
  const { user } = useAuth();
  const bookId = params.id as string;
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !bookId || !noteId) return;
      
      try {
        const noteData = await getNote(user.uid, bookId, noteId);
        setNote(noteData);
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [user, bookId, noteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">メモが見つかりません</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">ログインしてください</p>
      </div>
    );
  }

  return <NoteForm userId={user.uid} bookId={bookId} note={note} isEditing />;
}
