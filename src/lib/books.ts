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
} from 'firebase/firestore';
import { db } from './firebase';
import { Book } from '@/types/book';

// 書籍を追加
export async function addBook(userId: string, book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<Book> {
  const booksRef = collection(db, 'users', userId, 'books');
  const docRef = await addDoc(booksRef, {
    ...book,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...book,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 書籍を取得
export async function getBook(userId: string, bookId: string): Promise<Book | null> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);
  const bookSnap = await getDoc(bookRef);

  if (!bookSnap.exists()) {
    return null;
  }

  const data = bookSnap.data();
  return {
    id: bookSnap.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  } as Book;
}

// 全書籍を取得
export async function getBooks(userId: string): Promise<Book[]> {
  const booksRef = collection(db, 'users', userId, 'books');
  const q = query(booksRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    } as Book;
  });
}

// 書籍を更新
export async function updateBook(userId: string, bookId: string, updates: Partial<Book>): Promise<void> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);
  await updateDoc(bookRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// 書籍を削除
export async function deleteBook(userId: string, bookId: string): Promise<void> {
  const bookRef = doc(db, 'users', userId, 'books', bookId);
  await deleteDoc(bookRef);
}

// 複数の書籍を一括追加（インポート用）
export async function addBooks(userId: string, books: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
  const booksRef = collection(db, 'users', userId, 'books');

  for (const book of books) {
    await addDoc(booksRef, {
      ...book,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return books.length;
}

// importBooks のエイリアス
export const importBooks = addBooks;

// ISBNで書籍を検索（重複チェック用）
export async function findBookByISBN(userId: string, isbn: string): Promise<Book | null> {
  if (!isbn) return null;
  
  const cleanIsbn = isbn.replace(/-/g, '');
  const booksRef = collection(db, 'users', userId, 'books');
  const snapshot = await getDocs(booksRef);
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const bookIsbn = (data.isbn13 || '').replace(/-/g, '');
    if (bookIsbn && bookIsbn === cleanIsbn) {
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      } as Book;
    }
  }
  
  return null;
}
