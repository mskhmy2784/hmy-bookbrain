'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchOptions, defaultSearchOptions } from '@/lib/search';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string, options: SearchOptions) => void;
  searching?: boolean;
  initialQuery?: string;
}

export function SearchBox({ onSearch, searching = false, initialQuery = '' }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [options, setOptions] = useState<SearchOptions>(defaultSearchOptions);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = () => {
    onSearch(query, options);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('', options);
  };

  const toggleOption = (key: keyof SearchOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full">
      {/* 検索入力欄 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="書籍名、著者、メモ内容を検索..."
            className="pr-10"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowOptions(!showOptions)}
          className={showOptions ? 'bg-blue-50 border-blue-300' : ''}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <Button onClick={handleSearch} disabled={searching || !query.trim()}>
          <Search className="h-4 w-4 mr-2" />
          検索
        </Button>
      </div>

      {/* 検索オプション */}
      {showOptions && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm font-medium text-gray-700 mb-3">検索対象</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchTitle"
                checked={options.searchTitle}
                onCheckedChange={() => toggleOption('searchTitle')}
              />
              <Label htmlFor="searchTitle" className="text-sm cursor-pointer">
                タイトル
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchAuthor"
                checked={options.searchAuthor}
                onCheckedChange={() => toggleOption('searchAuthor')}
              />
              <Label htmlFor="searchAuthor" className="text-sm cursor-pointer">
                著者
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchPublisher"
                checked={options.searchPublisher}
                onCheckedChange={() => toggleOption('searchPublisher')}
              />
              <Label htmlFor="searchPublisher" className="text-sm cursor-pointer">
                出版社
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchDescription"
                checked={options.searchDescription}
                onCheckedChange={() => toggleOption('searchDescription')}
              />
              <Label htmlFor="searchDescription" className="text-sm cursor-pointer">
                説明
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchNotes"
                checked={options.searchNotes}
                onCheckedChange={() => toggleOption('searchNotes')}
              />
              <Label htmlFor="searchNotes" className="text-sm cursor-pointer">
                メモ
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchIsbn"
                checked={options.searchIsbn}
                onCheckedChange={() => toggleOption('searchIsbn')}
              />
              <Label htmlFor="searchIsbn" className="text-sm cursor-pointer">
                ISBN
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchStatus"
                checked={options.searchStatus}
                onCheckedChange={() => toggleOption('searchStatus')}
              />
              <Label htmlFor="searchStatus" className="text-sm cursor-pointer">
                ステータス
              </Label>
            </div>
          </div>
          {options.searchStatus && (
            <p className="text-xs text-gray-500 mt-2">
              ※ ステータス検索: 「読書中」「読了」「未読」で検索できます
            </p>
          )}
        </div>
      )}
    </div>
  );
}
