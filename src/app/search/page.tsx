'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { searchAll, SearchResult } from '@/lib/search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  BookOpen,
  FileText,
  Loader2,
} from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;

    setSearching(true);
    setSearched(true);
    try {
      const searchResults = await searchAll(user.uid, searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <div className="flex-1 flex gap-2 max-w-2xl">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="書籍名、著者、メモ内容を検索..."
              className="flex-1"
              autoFocus
            />
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!searched ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                書籍名、著者、説明、メモ内容を横断検索できます
              </p>
            </div>
          ) : searching ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">検索中...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                「{searchQuery}」に一致する結果が見つかりませんでした
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-6">
                「{searchQuery}」の検索結果: {results.length}件
              </p>

              {results.map((result, index) => (
                <Card
                  key={`${result.type}-${result.book.id}-${result.note?.id || ''}-${index}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/books/${result.book.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {result.type === 'book' ? (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {result.book.title}
                          </h3>
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
          )}
        </div>
      </main>
    </div>
  );
}
