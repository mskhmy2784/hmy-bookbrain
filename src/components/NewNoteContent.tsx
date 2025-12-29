'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addNote } from '@/lib/notes';
import { getBook } from '@/lib/books';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { ArrowLeft, Save, Eye, Edit, BookOpen } from 'lucide-react';
import { Book } from '@/types/book';

export default function NewNoteContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pageRef, setPageRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    const fetchBook = async () => {
      if (!user || !bookId) return;
      const bookData = await getBook(user.uid, bookId);
      setBook(bookData);
    };
    fetchBook();
  }, [user, bookId]);

  const handleSave = async () => {
    if (!user || !bookId || !content.trim()) return;
    setSaving(true);
    try {
      await addNote(user.uid, bookId, {
        title: title || undefined,
        content,
        pageReference: pageRef || undefined,
      });
      router.push(`/books/${bookId}`);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() && !confirm('入力内容が破棄されます。よろしいですか？')) {
      return;
    }
    router.push(`/books/${bookId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
            {book && (
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm truncate max-w-[200px] md:max-w-[400px]">
                  {book.title}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* モード切り替え */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={mode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('edit')}
                className="rounded-none"
              >
                <Edit className="mr-2 h-4 w-4" />
                入力
              </Button>
              <Button
                variant={mode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('preview')}
                className="rounded-none"
              >
                <Eye className="mr-2 h-4 w-4" />
                プレビュー
              </Button>
            </div>
            <Button onClick={handleSave} disabled={!content.trim() || saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto h-full">
          {/* メタ情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="title">タイトル（任意）</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: Chapter 3 のまとめ"
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="pageRef">ページ参照（任意）</Label>
              <Input
                id="pageRef"
                value={pageRef}
                onChange={(e) => setPageRef(e.target.value)}
                placeholder="例: p.45-52"
                className="mt-1 bg-white"
              />
            </div>
          </div>

          {/* エディタ / プレビュー */}
          <div className="bg-white rounded-lg border shadow-sm">
            {mode === 'edit' ? (
              <div className="p-4">
                <Label className="mb-2 block">
                  内容（マークダウン形式で入力できます）
                </Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`マークダウン形式でメモを入力...

例:
## 重要なポイント
- ポイント1
- ポイント2

### 引用
> 本文からの引用

### コード
\`\`\`python
print('Hello')
\`\`\`

### TODO
- [x] 完了したタスク
- [ ] 未完了のタスク`}
                  className="min-h-[calc(100vh-320px)] font-mono text-sm resize-none"
                />
              </div>
            ) : (
              <div className="p-6 min-h-[calc(100vh-320px)]">
                {content.trim() ? (
                  <MarkdownViewer content={content} />
                ) : (
                  <p className="text-gray-400 text-center py-12">
                    プレビューする内容がありません
                  </p>
                )}
              </div>
            )}
          </div>

          {/* マークダウンヘルプ（入力モード時のみ） */}
          {mode === 'edit' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-2">📝 マークダウン記法</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <span><code>## 見出し</code></span>
                <span><code>**太字**</code></span>
                <span><code>*斜体*</code></span>
                <span><code>- リスト</code></span>
                <span><code>1. 番号リスト</code></span>
                <span><code>&gt; 引用</code></span>
                <span><code>`コード`</code></span>
                <span><code>[リンク](URL)</code></span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
