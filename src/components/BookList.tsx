'use client';

import { Book, Tag } from '@/types/book';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getTagColorClasses } from '@/lib/tags';
import { BookOpen, StickyNote, Smartphone, BookText } from 'lucide-react';

interface BookListProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  noteCounts?: Map<string, number>;
  allTags?: Tag[];
  // 選択モード用
  selectionMode?: boolean;
  selectedBooks?: Set<string>;
  onSelectionChange?: (bookId: string, selected: boolean) => void;
}

const statusConfig = {
  unread: { label: '未読', color: 'bg-gray-100 text-gray-700' },
  reading: { label: '読書中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '読了', color: 'bg-green-100 text-green-700' },
  sold: { label: '売却済み', color: 'bg-red-100 text-red-700' },
};

export function BookList({ 
  books, 
  onBookClick, 
  noteCounts,
  allTags = [],
  selectionMode = false,
  selectedBooks = new Set(),
  onSelectionChange,
}: BookListProps) {
  if (books.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        書籍がありません
      </p>
    );
  }

  const handleItemClick = (book: Book, e: React.MouseEvent) => {
    if (selectionMode && onSelectionChange) {
      e.preventDefault();
      onSelectionChange(book.id!, !selectedBooks.has(book.id!));
    } else {
      onBookClick(book);
    }
  };

  const getColorForTag = (tagName: string) => {
    const tag = allTags.find(t => t.name === tagName);
    return getTagColorClasses(tag?.color);
  };

  return (
    <div className="divide-y">
      {books.map((book) => {
        const isSold = book.readingStatus === 'sold';
        const noteCount = noteCounts?.get(book.id!) || 0;
        const isSelected = selectedBooks.has(book.id!);
        const displayTags = (book.tags || []).slice(0, 2);
        const remainingTags = (book.tags || []).length - displayTags.length;
        
        return (
          <div
            key={book.id}
            onClick={(e) => handleItemClick(book, e)}
            className={`book-list-item flex items-center gap-3 py-3 px-2 hover:bg-gray-50 cursor-pointer rounded transition-colors select-none ${
              isSold ? 'opacity-60' : ''
            } ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
          >
            {/* チェックボックス（選択モード時のみ） */}
            {selectionMode && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    onSelectionChange?.(book.id!, checked === true);
                  }}
                />
              </div>
            )}

            {/* サムネイル */}
            <div className={`relative w-10 h-14 bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center ${
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
              {/* 形式アイコン（右下に小さく表示） */}
              {book.format && (
                <div className={`absolute -bottom-0.5 -right-0.5 p-0.5 rounded-tl ${
                  book.format === 'ebook' ? 'bg-purple-500' : 'bg-amber-500'
                }`}>
                  {book.format === 'ebook' ? (
                    <Smartphone className="h-2.5 w-2.5 text-white" />
                  ) : (
                    <BookText className="h-2.5 w-2.5 text-white" />
                  )}
                </div>
              )}
            </div>

            {/* タイトル・著者・タグ */}
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
              {/* タグ表示 */}
              {displayTags.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {displayTags.map((tagName) => {
                    const colors = getColorForTag(tagName);
                    return (
                      <Badge
                        key={tagName}
                        className={`${colors.bg} ${colors.text} text-xs px-1.5 py-0`}
                      >
                        {tagName}
                      </Badge>
                    );
                  })}
                  {remainingTags > 0 && (
                    <Badge className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0">
                      +{remainingTags}
                    </Badge>
                  )}
                </div>
              )}
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
