'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginButton } from '@/components/LoginButton';
import { ImportBooks } from '@/components/ImportBooks';
import { BookList } from '@/components/BookList';
import { SearchBox } from '@/components/SearchBox';
import { SearchResults } from '@/components/SearchResults';
import { getBooks } from '@/lib/books';
import {
  searchAll,
  SearchOptions,
  defaultSearchOptions,
  SearchResult,
  preloadSearchData,
  clearSearchCache,
} from '@/lib/search';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { BookOpen, Library, BookMarked, CheckCircle, Upload, X, Plus, PackageX } from 'lucide-react';

const SEARCH_STATE_KEY = 'bookbrain_search_state';

interface SavedSearchState {
  query: string;
  options: SearchOptions;
  timestamp: number;
}

type FilterType = 'all' | 'reading' | 'completed' | 'sold' | null;

export default function HomeContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const restoredRef = useRef(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showImport, setShowImport] = useState(false);

  // 検索状態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>(defaultSearchOptions);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // 書籍を取得 & 検索データを事前ロード
  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return;
      setLoadingBooks(true);
      try {
        const data = await getBooks(user.uid);
        setBooks(data);
        preloadSearchData(user.uid);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();

    return () => {
      clearSearchCache();
    };
  }, [user]);

  // 検索状態を sessionStorage から復元（初回のみ）
  useEffect(() => {
    if (!user || restoredRef.current) return;
    restoredRef.current = true;

    try {
      const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
      if (saved) {
        const state: SavedSearchState = JSON.parse(saved);
        if (Date.now() - state.timestamp < 5 * 60 * 1000) {
          setSearchQuery(state.query);
          setSearchOptions(state.options);
          performSearchWithState(state.query, state.options);
        } else {
          sessionStorage.removeItem(SEARCH_STATE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore search state:', e);
      sessionStorage.removeItem(SEARCH_STATE_KEY);
    }
  }, [user]);

  const performSearchWithState = async (query: string, options: SearchOptions) => {
    if (!user || !query.trim()) return;

    setSearching(true);
    setSearched(true);

    try {
      const results = await searchAll(user.uid, query, options);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (query: string, options: SearchOptions) => {
    setSearchQuery(query);
    setSearchOptions(options);
    setFilter(null);

    if (!query.trim()) {
      setSearched(false);
      setSearchResults([]);
      sessionStorage.removeItem(SEARCH_STATE_KEY);
      return;
    }

    const state: SavedSearchState = {
      query,
      options,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));

    await performSearchWithState(query, options);
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/books/${result.book.id}`);
  };

  const handleLogoClick = () => {
    setSearched(false);
    setSearchQuery('');
    setSearchResults([]);
    setFilter(null);
    sessionStorage.removeItem(SEARCH_STATE_KEY);
  };

  const handleFilterClick = (newFilter: FilterType) => {
    setSearched(false);
    setSearchQuery('');
    if (filter === newFilter) {
      setFilter(null);
    } else {
      setFilter(newFilter);
    }
  };

  const stats = {
    total: books.length,
    reading: books.filter((b) => b.readingStatus === 'reading').length,
    completed: books.filter((b) => b.readingStatus === 'completed').length,
    sold: books.filter((b) => b.readingStatus === 'sold').length,
  };

  // フィルタリング＆ソートされた書籍
  const filteredBooks = books
    .filter((book) => {
      if (filter === null || filter === 'all') return true;
      return book.readingStatus === filter;
    })
    .sort((a, b) => {
      const isbnA = a.isbn13 || '';
      const isbnB = b.isbn13 || '';
      if (!isbnA && !isbnB) return 0;
      if (!isbnA) return 1;
      if (!isbnB) return -1;
      return isbnA.localeCompare(isbnB);
    });

  // フィルタのラベルを取得
  const getFilterLabel = () => {
    switch (filter) {
      case 'all': return '全ての蔵書';
      case 'reading': return '読書中の書籍';
      case 'completed': return '読了した書籍';
      case 'sold': return '売却済みの書籍';
      default: return '';
    }
  };

  const showBookList = filter !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            {user && (
              <>
                <Button
                  size="sm"
                  onClick={() => router.push('/books/new')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新規登録
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImport(true)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  インポート
                </Button>
              </>
            )}
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* 検索ボックス */}
            <div className="bg-white rounded-lg shadow p-4">
              <SearchBox
                onSearch={handleSearch}
                searching={searching}
                initialQuery={searchQuery}
              />
            </div>

            {/* 検索結果表示 */}
            {searched ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">
                    🔍 検索結果
                    <span className="text-gray-500 font-normal ml-2">
                      ({searchResults.length}件)
                    </span>
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogoClick}
                  >
                    <X className="h-4 w-4 mr-1" />
                    検索をクリア
                  </Button>
                </div>
                <SearchResults
                  results={searchResults}
                  searchQuery={searchQuery}
                  searching={searching}
                  searched={searched}
                  onResultClick={handleResultClick}
                />
              </div>
            ) : (
              <>
                {/* コンパクトな統計 */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-center gap-3 sm:gap-5 text-sm flex-wrap">
                    <button
                      onClick={() => handleFilterClick('all')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                        filter === 'all'
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Library className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-600">総蔵書</span>
                      <span className="font-bold text-lg">{stats.total}</span>
                    </button>
                    <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                    <button
                      onClick={() => handleFilterClick('reading')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                        filter === 'reading'
                          ? 'bg-orange-100 text-orange-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <BookMarked className="h-5 w-5 text-orange-500" />
                      <span className="text-gray-600">読書中</span>
                      <span className="font-bold text-lg">{stats.reading}</span>
                    </button>
                    <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                    <button
                      onClick={() => handleFilterClick('completed')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                        filter === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-600">読了</span>
                      <span className="font-bold text-lg">{stats.completed}</span>
                    </button>
                    <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                    <button
                      onClick={() => handleFilterClick('sold')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                        filter === 'sold'
                          ? 'bg-red-100 text-red-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <PackageX className="h-5 w-5 text-red-500" />
                      <span className="text-gray-600">売却済</span>
                      <span className="font-bold text-lg">{stats.sold}</span>
                    </button>
                  </div>
                </div>

                {/* 書籍がない場合のインポート案内 */}
                {books.length === 0 && !showImport && (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <Library className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">まだ書籍がありません</p>
                    <Button onClick={() => setShowImport(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Excelからインポート
                    </Button>
                  </div>
                )}

                {/* インポートダイアログ */}
                {showImport && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Excelからインポート</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowImport(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ImportBooks
                      onImportComplete={() => {
                        if (user) {
                          getBooks(user.uid).then(setBooks);
                          setShowImport(false);
                        }
                      }}
                    />
                  </div>
                )}

                {/* 書籍一覧（フィルタ選択時のみ表示） */}
                {showBookList && books.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-4 py-3 border-b flex justify-between items-center">
                      <h2 className="font-semibold">
                        📚 {getFilterLabel()}
                        <span className="text-gray-500 font-normal ml-2">
                          ({filteredBooks.length}冊)
                        </span>
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter(null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        閉じる
                      </Button>
                    </div>
                    <div className="p-4">
                      {loadingBooks ? (
                        <p className="text-center py-8 text-gray-500">読み込み中...</p>
                      ) : filteredBooks.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">該当する書籍がありません</p>
                      ) : (
                        <BookList
                          books={filteredBooks}
                          onBookClick={(book) => router.push(`/books/${book.id}`)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-12">
              <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                BookBrain へようこそ
              </h2>
              <p className="text-gray-600 mb-8">
                AIを活用した蔵書管理アプリで、あなたの読書体験を豊かにします。
                <br />
                Googleアカウントでログインして始めましょう。
              </p>
              <LoginButton />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
