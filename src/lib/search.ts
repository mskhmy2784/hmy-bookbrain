import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Book, Note } from '@/types/book';

export interface SearchResult {
  type: 'book' | 'note';
  book: Book;
  note?: Note;
  matchedField: string;
  matchedText: string;
}

export interface SearchOptions {
  searchTitle: boolean;
  searchAuthor: boolean;
  searchPublisher: boolean;
  searchDescription: boolean;
  searchNotes: boolean;
  searchIsbn: boolean;
  searchStatus: boolean;
}

export const defaultSearchOptions: SearchOptions = {
  searchTitle: true,
  searchAuthor: true,
  searchPublisher: false,
  searchDescription: true,
  searchNotes: true,
  searchIsbn: false,
  searchStatus: false,
};

// ステータスの日本語マッピング
const statusLabels: Record<string, string> = {
  unread: '未読',
  reading: '読書中',
  completed: '読了',
  sold: '売却済み',
};

// キャッシュ
let cachedBooks: Book[] | null = null;
let cachedNotesMap: Map<string, Note[]> | null = null;
let cacheUserId: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分

// キャッシュをクリア
export function clearSearchCache() {
  cachedBooks = null;
  cachedNotesMap = null;
  cacheUserId = null;
  cacheTimestamp = 0;
}

// 書籍データを取得（キャッシュ付き）
async function fetchBooksWithCache(userId: string): Promise<Book[]> {
  const now = Date.now();
  if (cachedBooks && cacheUserId === userId && now - cacheTimestamp < CACHE_TTL) {
    return cachedBooks;
  }

  const booksRef = collection(db, 'users', userId, 'books');
  const booksSnapshot = await getDocs(query(booksRef, orderBy('createdAt', 'desc')));

  const books: Book[] = booksSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Book;
  });

  cachedBooks = books;
  cacheUserId = userId;
  cacheTimestamp = now;

  return books;
}

// 全メモを一括取得（キャッシュ付き）
async function fetchAllNotesWithCache(userId: string, books: Book[]): Promise<Map<string, Note[]>> {
  const now = Date.now();
  if (cachedNotesMap && cacheUserId === userId && now - cacheTimestamp < CACHE_TTL) {
    return cachedNotesMap;
  }

  const notesMap = new Map<string, Note[]>();

  const notePromises = books.map(async (book) => {
    const notesRef = collection(db, 'users', userId, 'books', book.id!, 'notes');
    const notesSnapshot = await getDocs(query(notesRef, orderBy('createdAt', 'desc')));

    const notes: Note[] = notesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        bookId: book.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Note;
    });

    return { bookId: book.id!, notes };
  });

  const results = await Promise.all(notePromises);
  results.forEach(({ bookId, notes }) => {
    notesMap.set(bookId, notes);
  });

  cachedNotesMap = notesMap;

  return notesMap;
}

// 全文検索（キャッシュ使用）
export async function searchAll(
  userId: string,
  searchQuery: string,
  options: SearchOptions = defaultSearchOptions
): Promise<SearchResult[]> {
  if (!searchQuery.trim()) return [];

  const results: SearchResult[] = [];
  const lowerQuery = searchQuery.toLowerCase();

  // 書籍を取得（キャッシュ使用）
  const books = await fetchBooksWithCache(userId);

  // 書籍フィールドを検索
  for (const book of books) {
    // ステータス検索用の日本語ラベル
    const statusLabel = statusLabels[book.readingStatus] || '';

    const bookFields: { field: string; value: string | undefined; enabled: boolean }[] = [
      { field: 'タイトル', value: book.title, enabled: options.searchTitle },
      { field: 'サブタイトル', value: book.subtitle, enabled: options.searchTitle },
      { field: '著者', value: book.author, enabled: options.searchAuthor },
      { field: '出版社', value: book.publisher, enabled: options.searchPublisher },
      { field: '説明', value: book.description, enabled: options.searchDescription },
      { field: 'ISBN', value: book.isbn13, enabled: options.searchIsbn },
      { field: 'ステータス', value: statusLabel, enabled: options.searchStatus },
    ];

    for (const { field, value, enabled } of bookFields) {
      if (enabled && value && value.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'book',
          book,
          matchedField: field,
          matchedText: highlightMatch(value, searchQuery),
        });
        break;
      }
    }
  }

  // メモ検索（オプションが有効な場合のみ）
  if (options.searchNotes) {
    const notesMap = await fetchAllNotesWithCache(userId, books);

    for (const book of books) {
      const notes = notesMap.get(book.id!) || [];

      for (const note of notes) {
        const noteFields = [
          { field: 'メモタイトル', value: note.title },
          { field: 'メモ内容', value: note.content },
        ];

        for (const { field, value } of noteFields) {
          if (value && value.toLowerCase().includes(lowerQuery)) {
            results.push({
              type: 'note',
              book,
              note,
              matchedField: field,
              matchedText: highlightMatch(value, searchQuery, 150),
            });
            break;
          }
        }
      }
    }
  }

  return results;
}

// 事前ロード（ページ表示時に呼ぶ）
export async function preloadSearchData(userId: string): Promise<void> {
  const books = await fetchBooksWithCache(userId);
  await fetchAllNotesWithCache(userId, books);
}

// マッチ部分をハイライト用にテキストを抽出
function highlightMatch(text: string, query: string, maxLength: number = 100): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text.slice(0, maxLength);

  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + query.length + 70);

  let result = text.slice(start, end);
  if (start > 0) result = '...' + result;
  if (end < text.length) result = result + '...';

  return result;
}
