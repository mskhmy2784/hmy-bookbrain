'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Note, NoteImage } from '@/types/book';
import { addNote, updateNote } from '@/lib/notes';
import { uploadNoteImage, deleteNoteImage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, ImagePlus, X, Camera } from 'lucide-react';

interface NoteFormProps {
  userId: string;
  bookId: string;
  note?: Note;
  isEditing?: boolean;
}

export function NoteForm({ userId, bookId, note, isEditing = false }: NoteFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [pageReference, setPageReference] = useState(note?.pageReference || '');
  const [images, setImages] = useState<NoteImage[]>(note?.images || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 一時的なnoteIdを生成（新規作成時）
  const tempNoteId = useRef(`temp-${Date.now()}`);
  const noteId = note?.id || tempNoteId.current;

  const handleSave = async () => {
    if (!content.trim()) {
      alert('メモの内容を入力してください');
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        title: title.trim() || undefined,
        content: content.trim(),
        pageReference: pageReference.trim() || undefined,
        images: images.length > 0 ? images : undefined,
      };

      if (isEditing && note?.id) {
        await updateNote(userId, bookId, note.id, noteData);
      } else {
        await addNote(userId, bookId, {
          ...noteData,
          bookId,
        } as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>);
      }

      router.push(`/books/${bookId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('メモの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // ファイル選択からアップロード
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: NoteImage[] = [];
      
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        
        const image = await uploadNoteImage(userId, bookId, noteId, file, file.name);
        newImages.push(image);
      }
      
      setImages([...images, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 画像を削除
  const handleDeleteImage = async (image: NoteImage) => {
    setDeletingImageId(image.id);
    try {
      await deleteNoteImage(userId, bookId, noteId, image.fileName);
      setImages(images.filter(img => img.id !== image.id));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('画像の削除に失敗しました');
    } finally {
      setDeletingImageId(null);
    }
  };

  // クリップボードからの貼り付け処理
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          setUploading(true);
          try {
            const image = await uploadNoteImage(userId, bookId, noteId, blob, `paste-${Date.now()}.png`);
            setImages(prev => [...prev, image]);
          } catch (error) {
            console.error('Error uploading pasted image:', error);
            alert('画像の貼り付けに失敗しました');
          } finally {
            setUploading(false);
          }
        }
        break;
      }
    }
  }, [userId, bookId, noteId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => router.push(`/books/${bookId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'メモを編集' : '新規メモ'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <Label htmlFor="pageReference">ページ参照（任意）</Label>
                <Input
                  id="pageReference"
                  value={pageReference}
                  onChange={(e) => setPageReference(e.target.value)}
                  placeholder="例: p.42, 第3章"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  ref={textareaRef}
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="メモの内容を入力（Markdownに対応）&#10;&#10;画像はCtrl+Vで貼り付けできます"
                  className="mt-1 min-h-[400px] font-mono text-base leading-relaxed"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Markdown記法が使えます。チェックボックスは - [ ] で作成できます。
                </p>
              </div>

              {/* 画像アップロード */}
              <div className="space-y-4 pt-4 border-t">
                <Label>画像添付</Label>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4 mr-2" />
                    )}
                    画像を追加
                  </Button>
                  
                  {/* カメラ入力（モバイル用） */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    id="camera-input"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('camera-input')?.click()}
                    disabled={uploading}
                    className="sm:hidden"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    撮影
                  </Button>
                  
                  <span className="text-sm text-gray-500">
                    またはメモ欄に Ctrl+V で貼り付け
                  </span>
                </div>

                {/* 画像プレビュー */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border"
                      >
                        <img
                          src={image.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image)}
                          disabled={deletingImageId === image.id}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                        >
                          {deletingImageId === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
