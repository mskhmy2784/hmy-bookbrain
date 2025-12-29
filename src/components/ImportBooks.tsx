'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { importBooks } from '@/lib/books';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Book } from '@/types/book';

export function ImportBooks({ onImportComplete }: { onImportComplete?: () => void }) {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Excel データを Book 型に変換
      const books: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>[] = jsonData.map((row: any) => ({
        title: row['タイトル'] || '不明',
        subtitle: row['サブタイトル'] || undefined,
        series: row['シリーズ'] || undefined,
        author: row['著者'] || undefined,
        publisher: row['出版社'] || undefined,
        publishedDate: row['出版日'] ? String(row['出版日']) : undefined,
        language: row['言語'] || 'ja',
        category: row['カテゴリ'] || undefined,
        ndc: row['NDC'] || undefined,
        price: row['価格'] ? Number(row['価格']) : undefined,
        isbn10: row['ISBN-10'] ? String(row['ISBN-10']) : undefined,
        isbn13: row['ISBN-13'] ? String(row['ISBN-13']) : undefined,
        pageCount: row['ページ数'] ? Number(row['ページ数']) : undefined,
        description: row['説明'] || undefined,
        readingStatus: 'unread' as const,
      }));

      const count = await importBooks(user.uid, books);
      setResult({ success: true, count });
      onImportComplete?.();
    } catch (error) {
      console.error('Import error:', error);
      setResult({ success: false, error: 'インポートに失敗しました' });
    } finally {
      setImporting(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">📥 Excel からインポート</h3>
      <p className="text-sm text-gray-600 mb-4">
        既存の蔵書一覧（Excel）をインポートできます。
      </p>

      <div className="flex items-center gap-4">
        <Button asChild disabled={importing}>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {importing ? 'インポート中...' : 'ファイルを選択'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={importing}
            />
          </label>
        </Button>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {result.success ? (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>{result.count}冊の書籍をインポートしました！</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5" />
              <span>{result.error}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
