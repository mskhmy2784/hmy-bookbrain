'use client';

import { useRouter } from 'next/navigation';
import { SearchResult } from '@/lib/search';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Search, Loader2 } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  searchQuery: string;
  searching: boolean;
  searched: boolean;
  onResultClick?: (result: SearchResult) => void;
}

export function SearchResults({
  results,
  searchQuery,
  searching,
  searched,
  onResultClick,
}: SearchResultsProps) {
  const router = useRouter();

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      router.push(`/books/${result.book.id}`);
    }
  };

  if (!searched) {
    return null;
  }

  if (searching) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">検索中...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">
          「{searchQuery}」に一致する結果が見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        「{searchQuery}」の検索結果: {results.length}件
      </p>

      {results.map((result, index) => (
        <Card
          key={`${result.type}-${result.book.id}-${result.note?.id || ''}-${index}`}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleClick(result)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* 表紙画像 */}
              <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center relative">
                <BookOpen className="h-5 w-5 text-gray-300" />
                {result.book.coverImage && (
                  <img
                    src={result.book.coverImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              {/* 検索結果タイプアイコン */}
              <div className="mt-1">
                {result.type === 'book' ? (
                  <BookOpen className="h-5 w-5 text-blue-600" />
                ) : (
                  <FileText className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{result.book.title}</h3>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {result.matchedField}
                  </Badge>
                </div>

                {result.type === 'note' && result.note?.title && (
                  <p className="text-sm text-gray-600 mb-1">
                    📝 {result.note.title}
                  </p>
                )}

                <p className="text-sm text-gray-700 line-clamp-2">
                  {highlightText(result.matchedText, searchQuery)}
                </p>

                {result.book.author && (
                  <p className="text-xs text-gray-500 mt-2">
                    著者: {result.book.author}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
