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
  getCountFromServer,
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

  const notes = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      bookId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Note;
  });

  // displayOrderがあればそれでソート、なければcreatedAtの逆順を維持
  return notes.sort((a, b) => {
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      return a.displayOrder - b.displayOrder;
    }
    if (a.displayOrder !== undefined) return -1;
    if (b.displayOrder !== undefined) return 1;
    return 0; // 既にcreatedAtでソート済み
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

// 複数メモの順序を更新
export async function updateNotesOrder(
  userId: string,
  bookId: string,
  noteOrders: { noteId: string; displayOrder: number }[]
): Promise<void> {
  const updatePromises = noteOrders.map(({ noteId, displayOrder }) => {
    const noteRef = doc(db, 'users', userId, 'books', bookId, 'notes', noteId);
    return updateDoc(noteRef, { displayOrder });
  });
  await Promise.all(updatePromises);
}

// 全書籍のメモ数を一括取得
export async function getAllNoteCounts(
  userId: string,
  bookIds: string[]
): Promise<Map<string, number>> {
  const noteCounts = new Map<string, number>();

  // 並列で各書籍のメモ数を取得
  const countPromises = bookIds.map(async (bookId) => {
    try {
      const notesRef = getNotesCollection(userId, bookId);
      const snapshot = await getCountFromServer(notesRef);
      return { bookId, count: snapshot.data().count };
    } catch (error) {
      console.error(`Error getting note count for book ${bookId}:`, error);
      return { bookId, count: 0 };
    }
  });

  const results = await Promise.all(countPromises);
  results.forEach(({ bookId, count }) => {
    noteCounts.set(bookId, count);
  });

  return noteCounts;
}
