'use client';

import { Book } from '@/types/book';
import { Badge } from '@/components/ui/badge';
import { BookOpen, StickyNote } from 'lucide-react';

interface BookListProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  noteCounts?: Map<string, number>;
}

const statusConfig = {
  unread: { label: '未読', color: 'bg-gray-100 text-gray-700' },
  reading: { label: '読書中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '読了', color: 'bg-green-100 text-green-700' },
  sold: { label: '売却済み', color: 'bg-red-100 text-red-700' },
};

export function BookList({ books, onBookClick, noteCounts }: BookListProps) {
  if (books.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        書籍がありません
      </p>
    );
  }

  return (
    <div className="divide-y">
      {books.map((book) => {
        const isSold = book.readingStatus === 'sold';
        const noteCount = noteCounts?.get(book.id!) || 0;
        
        return (
          <div
            key={book.id}
            onClick={() => onBookClick(book)}
            className={`book-list-item flex items-center gap-3 py-3 px-2 hover:bg-gray-50 cursor-pointer rounded transition-colors select-none ${
              isSold ? 'opacity-60' : ''
            }`}
          >
            {/* サムネイル */}
            <div className={`w-10 h-14 bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center ${
              isSold ? 'grayscale' : ''
            }`}>
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <BookOpen className="h-5 w-5 text-gray-300" />
              )}
            </div>

            {/* タイトル・著者 */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium truncate ${isSold ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {book.title}
              </h3>
              <div className="flex items-center gap-2">
                {book.author && (
                  <p className="text-sm text-gray-500 truncate">
                    {book.author}
                  </p>
                )}
                {/* メモ数表示 */}
                {noteCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-600 shrink-0">
                    <StickyNote className="h-3 w-3" />
                    {noteCount}
                  </span>
                )}
              </div>
            </div>

            {/* ステータス */}
            <Badge className={`shrink-0 ${statusConfig[book.readingStatus].color}`}>
              {statusConfig[book.readingStatus].label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
