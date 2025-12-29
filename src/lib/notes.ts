import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Note } from '@/types/book';

// メモコレクション参照を取得
const getNotesCollection = (userId: string, bookId: string) =>
  collection(db, 'users', userId, 'books', bookId, 'notes');

// undefined 値を除去
const removeUndefined = (obj: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
};

// 書籍のメモを全件取得
export async function getNotes(userId: string, bookId: string): Promise<Note[]> {
  const notesRef = getNotesCollection(userId, bookId);
  const q = query(notesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      bookId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Note;
  });
}

// メモを追加
export async function addNote(
  userId: string,
  bookId: string,
  note: Omit<Note, 'id' | 'bookId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const notesRef = getNotesCollection(userId, bookId);
  const now = Timestamp.now();

  const cleanedNote = removeUndefined({
    ...note,
    createdAt: now,
    updatedAt: now,
  });

  const docRef = await addDoc(notesRef, cleanedNote);
  return docRef.id;
}

// メモを更新
export async function updateNote(
  userId: string,
  bookId: string,
  noteId: string,
  updates: Partial<Note>
): Promise<void> {
  const noteRef = doc(db, 'users', userId, 'books', bookId, 'notes', noteId);
  const cleanedUpdates = removeUndefined({
    ...updates,
    updatedAt: Timestamp.now(),
  });
  await updateDoc(noteRef, cleanedUpdates);
}

// メモを削除
export async function deleteNote(userId: string, bookId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, 'users', userId, 'books', bookId, 'notes', noteId);
  await deleteDoc(noteRef);
}
