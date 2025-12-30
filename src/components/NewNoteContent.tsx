'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addNote } from '@/lib/notes';
import { uploadNoteImage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { ArrowLeft, Save, Loader2, ImagePlus, Camera, Eye, Edit } from 'lucide-react';

export default function NewNoteContent() {
  const params = useParams();
  const bookId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pageRef, setPageRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 一時的なnoteIdを生成（新規作成時の画像保存用）
  const tempNoteId = useRef(`temp-${Date.now()}`);

  // テキストエリアのカーソル位置に画像Markdownを挿入
  const insertImageAtCursor = useCallback((imageUrl: string, altText: string = '画像') => {
    const textarea = textareaRef.current;
    const imageMarkdown = `![${altText}](${imageUrl})`;
    
    if (!textarea) {
      setContent(prev => prev + `\n${imageMarkdown}\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
    
    const newContent = before + prefix + imageMarkdown + suffix + after;
    setContent(newContent);
    
    setTimeout(() => {
      const newPosition = start + prefix.length + imageMarkdown.length + suffix.length;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [content]);

  // ファイル選択時の処理
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    
    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          alert('画像ファイルのみアップロードできます');
          continue;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          alert('10MB以下の画像を選択してください');
          continue;
        }
        
        const result = await uploadNoteImage(user.uid, bookId, tempNoteId.current, file);
        insertImageAtCursor(result.url, file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user, bookId, insertImageAtCursor]);

  // クリップボードからの貼り付け処理
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !user) return;
    
    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length === 0) return;
    
    e.preventDefault();
    setUploading(true);
    
    try {
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) continue;
        
        const result = await uploadNoteImage(user.uid, bookId, tempNoteId.current, file);
        insertImageAtCursor(result.url, '貼り付け画像');
      }
    } catch (error) {
      console.error('Error uploading pasted image:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  }, [user, bookId, insertImageAtCursor]);

  const handleSave = async () => {
    if (!user) return;
    if (!content.trim()) {
      alert('メモの内容を入力してください');
      return;
    }

    setSaving(true);
    try {
      await addNote(user.uid, bookId, {
        bookId,
        title: title || undefined,
        content,
        pageReference: pageRef || undefined,
      });
      router.push(`/books/${bookId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('メモの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        {/* 横幅を max-w-5xl に拡大 */}
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push(`/books/${bookId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            書籍に戻る
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>新しいメモを追加</CardTitle>
                {/* 入力/プレビュー切り替えボタン */}
                <div className="flex border rounded-md overflow-hidden">
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">タイトル（任意）</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="メモのタイトル"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pageRef">ページ参照（任意）</Label>
                <Input
                  id="pageRef"
                  value={pageRef}
                  onChange={(e) => setPageRef(e.target.value)}
                  placeholder="例: p.42, 第3章"
                  className="mt-1"
                />
              </div>

              <div>
                {mode === 'edit' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">内容</Label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => handleFileSelect(e.target.files)}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <ImagePlus className="h-4 w-4 mr-1" />
                          )}
                          画像挿入
                        </Button>
                        
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          id="camera-input-new"
                          onChange={(e) => handleFileSelect(e.target.files)}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('camera-input-new')?.click()}
                          disabled={uploading}
                          className="sm:hidden"
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          撮影
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      ref={textareaRef}
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="メモの内容を入力（Markdownに対応）&#10;&#10;画像はCtrl+Vで貼り付け、または「画像挿入」ボタンで追加できます"
                      className="mt-1 min-h-[500px] font-mono text-base leading-relaxed"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Markdown記法が使えます。チェックボックスは - [ ] で作成。画像は Ctrl+V で貼り付けるとカーソル位置に挿入されます。
                    </p>
                  </>
                ) : (
                  <div className="border rounded-md p-4 min-h-[500px] bg-white">
                    <Label className="mb-2 block text-gray-500">プレビュー</Label>
                    {content.trim() ? (
                      <MarkdownViewer content={content} />
                    ) : (
                      <p className="text-gray-400 italic">内容がありません</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving || uploading}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/books/${bookId}`)}
                  disabled={saving}
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
