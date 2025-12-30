import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Note } from '@/types/book';

// メモを追加
export async function addNote(
  userId: string,
  bookId: string,
  note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Note> {
  const notesRef = collection(db, 'users', userId, 'books', bookId, 'notes');
  
  // displayOrderを取得（既存のメモの数）
  const existingNotes = await getDocs(notesRef);
  const displayOrder = existingNotes.size;

  const docData: Record<string, unknown> = {
    bookId: note.bookId,
    content: note.content,
    displayOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // undefined の値は保存しない
  if (note.title) docData.title = note.title;
  if (note.pageReference) docData.pageReference = note.pageReference;
  if (note.images && note.images.length > 0) {
    docData.images = note.images.map(img => ({
      id: img.id,
      url: img.url,
      fileName: img.fileName,
      uploadedAt: img.uploadedAt,
    }));
  }

  const docRef = await addDoc(notesRef, docData);

  return {
    id: docRef.id,
    bookId: note.bookId,
    title: note.title,
    content: note.content,
    pageReference: note.pageReference,
    images: note.images,
    displayOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// メモを更新
export async function updateNote(
  userId: string,
  bookId: string,
  noteId: string,
  updates: Partial<Note>
): Promise<void> {
  const noteRef = doc(db, 'users', userId, 'books', bookId, 'notes', noteId);
  
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  // 各フィールドを個別に設定
  if (updates.title !== undefined) {
    updateData.title = updates.title || null;
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content;
  }
  if (updates.pageReference !== undefined) {
    updateData.pageReference = updates.pageReference || null;
  }
  if (updates.images !== undefined) {
    updateData.images = updates.images && updates.images.length > 0 
      ? updates.images.map(img => ({
          id: img.id,
          url: img.url,
          fileName: img.fileName,
          uploadedAt: img.uploadedAt instanceof Date ? img.uploadedAt : new Date(img.uploadedAt),
        }))
      : null;
  }
  if (updates.displayOrder !== undefined) {
    updateData.displayOrder = updates.displayOrder;
  }

  await updateDoc(noteRef, updateData);
}

// メモを削除
export async function deleteNote(
  userId: string,
  bookId: string,
  noteId: string
): Promise<void> {
  const noteRef = doc(db, 'users', userId, 'books', bookId, 'notes', noteId);
  await deleteDoc(noteRef);
}

// 特定の書籍のメモを全取得
export async function getNotes(userId: string, bookId: string): Promise<Note[]> {
  const notesRef = collection(db, 'users', userId, 'books', bookId, 'notes');
  
  // displayOrderがないドキュメントがあるとorderByでエラーになるため、
  // orderByなしで取得してクライアント側でソート
  const snapshot = await getDocs(notesRef);

  const notes = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      bookId: data.bookId,
      title: data.title || undefined,
      content: data.content,
      pageReference: data.pageReference || undefined,
      images: data.images ? data.images.map((img: Record<string, unknown>) => ({
        id: img.id as string,
        url: img.url as string,
        fileName: img.fileName as string,
        uploadedAt: img.uploadedAt instanceof Timestamp 
          ? img.uploadedAt.toDate() 
          : new Date(img.uploadedAt as string),
      })) : undefined,
      displayOrder: data.displayOrder ?? 9999, // displayOrderがない場合は末尾に
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    } as Note;
  });

  // displayOrder でソート、同じ場合は createdAt でソート
  return notes.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999);
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

// 特定のメモを取得
export async function getNote(
  userId: string,
  bookId: string,
  noteId: string
): Promise<Note | null> {
  const noteRef = doc(db, 'users', userId, 'books', bookId, 'notes', noteId);
  const snapshot = await getDoc(noteRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    bookId: data.bookId,
    title: data.title || undefined,
    content: data.content,
    pageReference: data.pageReference || undefined,
    images: data.images ? data.images.map((img: Record<string, unknown>) => ({
      id: img.id as string,
      url: img.url as string,
      fileName: img.fileName as string,
      uploadedAt: img.uploadedAt instanceof Timestamp 
        ? img.uploadedAt.toDate() 
        : new Date(img.uploadedAt as string),
    })) : undefined,
    displayOrder: data.displayOrder ?? 0,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  } as Note;
}

// メモの順序を一括更新
export async function updateNotesOrder(
  userId: string,
  bookId: string,
  noteOrders: { noteId: string; displayOrder: number }[]
): Promise<void> {
  const batch = writeBatch(db);

  for (const { noteId, displayOrder } of noteOrders) {
    const noteRef = doc(db, 'users', userId, 'books', bookId, 'notes', noteId);
    batch.update(noteRef, { displayOrder, updatedAt: serverTimestamp() });
  }

  await batch.commit();
}

// 複数の書籍のメモ数を一括取得
export async function getAllNoteCounts(
  userId: string,
  bookIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  
  // 初期値を0に設定
  for (const bookId of bookIds) {
    counts.set(bookId, 0);
  }

  // バッチで取得（Firestoreの制限により10件ずつ）
  const batchSize = 10;
  for (let i = 0; i < bookIds.length; i += batchSize) {
    const batchIds = bookIds.slice(i, i + batchSize);
    
    await Promise.all(
      batchIds.map(async (bookId) => {
        const notesRef = collection(db, 'users', userId, 'books', bookId, 'notes');
        const snapshot = await getDocs(notesRef);
        counts.set(bookId, snapshot.size);
      })
    );
  }

  return counts;
}
