'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getBook, updateBook, deleteBook } from '@/lib/books';
import { getNotes, deleteNote, updateNote, updateNotesOrder } from '@/lib/notes';
import { searchBookByISBN, getCoverImageUrl } from '@/lib/googleBooks';
import { Book, Note } from '@/types/book';
import { TagInput } from '@/components/TagInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  BookOpen,
  Loader2,
  ImageIcon,
  Link2,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  BookText,
  Smartphone,
  Sparkles,
} from 'lucide-react';

const statusOptions = [
  { value: 'unread', label: '未読', color: 'bg-gray-100 text-gray-800' },
  { value: 'reading', label: '読書中', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: '読了', color: 'bg-green-100 text-green-800' },
  { value: 'sold', label: '売却済み', color: 'bg-red-100 text-red-800' },
];

const formatOptions = [
  { value: 'paper', label: '紙の書籍', icon: BookText, color: 'bg-amber-100 text-amber-800' },
  { value: 'ebook', label: '電子書籍', icon: Smartphone, color: 'bg-purple-100 text-purple-800' },
];

export default function BookDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBook, setEditedBook] = useState<Partial<Book>>({});
  const [saving, setSaving] = useState(false);
  const [fetchingCover, setFetchingCover] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  // AI要約
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const fetchData = async () => {
    if (!user || !bookId) return;
    setLoading(true);
    try {
      const [bookData, notesData] = await Promise.all([
        getBook(user.uid, bookId),
        getNotes(user.uid, bookId),
      ]);
      setBook(bookData);
      setNotes(notesData);
      if (bookData) {
        setEditedBook(bookData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, bookId]);

  const handleStartEdit = () => {
    if (book) {
      setEditedBook({ ...book });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (book) {
      setEditedBook({ ...book });
    }
    setIsEditing(false);
  };

  const handleSaveBook = async () => {
    if (!user || !bookId) return;
    setSaving(true);
    try {
      await updateBook(user.uid, bookId, editedBook);
      setBook({ ...book, ...editedBook } as Book);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating book:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!user || !bookId) return;
    if (!confirm('この書籍を削除しますか？メモも全て削除されます。')) return;
    try {
      await deleteBook(user.uid, bookId);
      router.push('/');
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || !bookId) return;
    if (!confirm('このメモを削除しますか？')) return;
    try {
      await deleteNote(user.uid, bookId, noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleStatusChange = async (newStatus: 'unread' | 'reading' | 'completed' | 'sold') => {
    if (!user || !bookId) return;
    try {
      await updateBook(user.uid, bookId, { readingStatus: newStatus });
      setBook({ ...book, readingStatus: newStatus } as Book);
      setEditedBook((prev) => ({ ...prev, readingStatus: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleFormatChange = async (newFormat: 'paper' | 'ebook') => {
    if (!user || !bookId) return;
    try {
      await updateBook(user.uid, bookId, { format: newFormat });
      setBook({ ...book, format: newFormat } as Book);
      setEditedBook((prev) => ({ ...prev, format: newFormat }));
    } catch (error) {
      console.error('Error updating format:', error);
    }
  };

  const handleTagsChange = async (newTags: string[]) => {
    if (!user || !bookId) return;
    try {
      await updateBook(user.uid, bookId, { tags: newTags });
      setBook({ ...book, tags: newTags } as Book);
      setEditedBook((prev) => ({ ...prev, tags: newTags }));
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  };

  const handleFetchCover = async () => {
    if (!user || !bookId || !book?.isbn13) return;
    
    setFetchingCover(true);
    try {
      const bookInfo = await searchBookByISBN(book.isbn13);
      if (bookInfo?.imageLinks) {
        const coverUrl = getCoverImageUrl(bookInfo.imageLinks);
        if (coverUrl) {
          await updateBook(user.uid, bookId, { coverImage: coverUrl });
          setBook({ ...book, coverImage: coverUrl });
          setEditedBook((prev) => ({ ...prev, coverImage: coverUrl }));
        } else {
          alert('表紙画像が見つかりませんでした');
        }
      } else {
        alert('書籍情報が見つかりませんでした');
      }
    } catch (error) {
      console.error('Error fetching cover:', error);
      alert('表紙の取得中にエラーが発生しました');
    } finally {
      setFetchingCover(false);
    }
  };

  const updateField = (field: keyof Book, value: string | number | undefined) => {
    setEditedBook((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // AI要約を生成
  const handleGenerateSummary = async () => {
    if (!book || notes.length === 0) return;
    
    setGeneratingSummary(true);
    setShowSummary(true);
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          bookAuthor: book.author,
          notes: notes.map(n => ({
            title: n.title,
            content: n.content,
            pageReference: n.pageReference,
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('AI要約の生成中にエラーが発生しました');
      setShowSummary(false);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // メモのアコーディオン開閉
  const toggleNote = (noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const expandAllNotes = () => {
    setExpandedNotes(new Set(notes.map((n) => n.id!)));
  };

  const collapseAllNotes = () => {
    setExpandedNotes(new Set());
  };

  // メモのチェックボックス状態を更新
  const handleNoteContentChange = async (noteId: string, newContent: string) => {
    if (!user || !bookId) return;
    
    try {
      await updateNote(user.uid, bookId, noteId, { content: newContent });
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, content: newContent } : n))
      );
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // メモの順序を変更
  const handleMoveNote = async (noteId: string, direction: 'up' | 'down') => {
    if (!user || !bookId) return;

    const currentIndex = notes.findIndex((n) => n.id === noteId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= notes.length) return;

    const newNotes = [...notes];
    [newNotes[currentIndex], newNotes[newIndex]] = [newNotes[newIndex], newNotes[currentIndex]];
    
    const noteOrders = newNotes.map((note, index) => ({
      noteId: note.id!,
      displayOrder: index,
    }));

    setNotes(newNotes);

    try {
      await updateNotesOrder(user.uid, bookId, noteOrders);
    } catch (error) {
      console.error('Error updating note order:', error);
      setNotes(notes);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">書籍が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  <X className="mr-2 h-4 w-4" />
                  キャンセル
                </Button>
                <Button onClick={handleSaveBook} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? '保存中...' : '保存'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className={linkCopied ? 'bg-green-50 border-green-300' : ''}
                >
                  {linkCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      コピー完了
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      リンクをコピー
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleStartEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  編集
                </Button>
                <Button variant="destructive" onClick={handleDeleteBook}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  削除
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex gap-6">
                <div className="shrink-0 w-32">
                  <div className="w-32 h-44 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      value={editedBook.coverImage || ''}
                      onChange={(e) => updateField('coverImage', e.target.value)}
                      placeholder="画像URL"
                      className="mt-2 text-xs bg-white"
                    />
                  ) : (
                    <div className="mt-2 space-y-1">
                      {book.isbn13 && (
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleFetchCover} disabled={fetchingCover}>
                          {fetchingCover ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                          {book.coverImage ? '表紙を再取得' : '表紙を取得'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <>
                      <Input value={editedBook.title || ''} onChange={(e) => updateField('title', e.target.value)} className="text-2xl font-bold bg-white" placeholder="タイトル" />
                      <Input value={editedBook.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} className="mt-2 bg-white" placeholder="サブタイトル（任意）" />
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{book.title}</h2>
                      {book.subtitle && <p className="text-gray-600 mt-1">{book.subtitle}</p>}
                    </>
                  )}
                  
                  <div className="mt-4">
                    <Label className="text-sm text-gray-500 mb-2 block">読書ステータス</Label>
                    <div className="flex gap-2 flex-wrap">
                      {statusOptions.map((status) => (
                        <Badge key={status.value} className={`cursor-pointer ${book.readingStatus === status.value ? status.color : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`} onClick={() => handleStatusChange(status.value as any)}>
                          {status.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="text-sm text-gray-500 mb-2 block">書籍形式</Label>
                    <div className="flex gap-2 flex-wrap">
                      {formatOptions.map((format) => {
                        const Icon = format.icon;
                        return (
                          <Badge key={format.value} className={`cursor-pointer flex items-center gap-1 ${book.format === format.value ? format.color : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`} onClick={() => handleFormatChange(format.value as 'paper' | 'ebook')}>
                            <Icon className="h-3 w-3" />
                            {format.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="text-sm text-gray-500 mb-2 block">タグ</Label>
                    {user && <TagInput userId={user.uid} selectedTags={book.tags || []} onChange={handleTagsChange} />}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="author">著者</Label><Input id="author" value={editedBook.author || ''} onChange={(e) => updateField('author', e.target.value)} className="mt-1 bg-white" placeholder="著者名" /></div>
                    <div><Label htmlFor="publisher">出版社</Label><Input id="publisher" value={editedBook.publisher || ''} onChange={(e) => updateField('publisher', e.target.value)} className="mt-1 bg-white" placeholder="出版社名" /></div>
                    <div><Label htmlFor="publishedDate">出版日</Label><Input id="publishedDate" value={editedBook.publishedDate || ''} onChange={(e) => updateField('publishedDate', e.target.value)} className="mt-1 bg-white" placeholder="例: 2024-01-15" /></div>
                    <div><Label htmlFor="pageCount">ページ数</Label><Input id="pageCount" type="number" value={editedBook.pageCount || ''} onChange={(e) => updateField('pageCount', e.target.value ? parseInt(e.target.value) : undefined)} className="mt-1 bg-white" placeholder="ページ数" /></div>
                    <div><Label htmlFor="isbn13">ISBN</Label><Input id="isbn13" value={editedBook.isbn13 || ''} onChange={(e) => updateField('isbn13', e.target.value)} className="mt-1 bg-white" placeholder="ISBN-13" /></div>
                    <div><Label htmlFor="ndc">NDC</Label><Input id="ndc" value={editedBook.ndc || ''} onChange={(e) => updateField('ndc', e.target.value)} className="mt-1 bg-white" placeholder="例: 913.6" /></div>
                    <div><Label htmlFor="category">カテゴリ</Label><Input id="category" value={editedBook.category || ''} onChange={(e) => updateField('category', e.target.value)} className="mt-1 bg-white" placeholder="カテゴリ" /></div>
                    <div><Label htmlFor="location">保管場所</Label><Input id="location" value={editedBook.location || ''} onChange={(e) => updateField('location', e.target.value)} className="mt-1 bg-white" placeholder="例: 本棚A-3" /></div>
                  </div>
                  <div><Label htmlFor="description">説明</Label><Textarea id="description" value={editedBook.description || ''} onChange={(e) => updateField('description', e.target.value)} className="mt-1 bg-white min-h-[100px]" placeholder="書籍の説明や概要" /></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {book.author && <div><span className="text-sm text-gray-500">著者</span><p className="font-medium">{book.author}</p></div>}
                    {book.publisher && <div><span className="text-sm text-gray-500">出版社</span><p className="font-medium">{book.publisher}</p></div>}
                    {book.publishedDate && <div><span className="text-sm text-gray-500">出版日</span><p className="font-medium">{book.publishedDate}</p></div>}
                    {book.pageCount && book.pageCount > 0 && <div><span className="text-sm text-gray-500">ページ数</span><p className="font-medium">{book.pageCount}ページ</p></div>}
                    {book.isbn13 && <div><span className="text-sm text-gray-500">ISBN</span><p className="font-medium">{book.isbn13}</p></div>}
                    {book.ndc && <div><span className="text-sm text-gray-500">NDC</span><p className="font-medium">{book.ndc}</p></div>}
                    {book.category && <div><span className="text-sm text-gray-500">カテゴリ</span><p className="font-medium">{book.category}</p></div>}
                    {book.location && <div><span className="text-sm text-gray-500">保管場所</span><p className="font-medium">{book.location}</p></div>}
                  </div>
                  {book.description && <div className="pt-4 border-t"><span className="text-sm text-gray-500">説明</span><p className="mt-1 text-gray-700 whitespace-pre-wrap">{book.description}</p></div>}
                </div>
              )}
            </CardContent>
          </Card>

          {showSummary && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-600" />AI要約</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSummary(false)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {generatingSummary ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" /><span className="text-gray-600">AI要約を生成中...</span></div>
                ) : aiSummary ? (
                  <div className="prose prose-sm max-w-none"><MarkdownViewer content={aiSummary} /></div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">📝 メモ ({notes.length}件)</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {notes.length > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={generatingSummary} className="text-purple-600 border-purple-200 hover:bg-purple-50">
                        {generatingSummary ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}AI要約
                      </Button>
                      <Button variant="outline" size="sm" onClick={expandAllNotes} disabled={expandedNotes.size === notes.length}><ChevronDown className="h-4 w-4 mr-1" />すべて開く</Button>
                      <Button variant="outline" size="sm" onClick={collapseAllNotes} disabled={expandedNotes.size === 0}><ChevronUp className="h-4 w-4 mr-1" />すべて閉じる</Button>
                    </>
                  )}
                  <Button onClick={() => router.push(`/books/${bookId}/notes/new`)}><Plus className="mr-2 h-4 w-4" />メモを追加</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">まだメモがありません。「メモを追加」ボタンから追加できます。</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note, noteIndex) => {
                    const isExpanded = expandedNotes.has(note.id!);
                    return (
                      <div key={note.id} className="border rounded-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleNote(note.id!)}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />}
                            <div className="min-w-0">
                              <h4 className="font-semibold truncate">{note.title || '無題のメモ'}</h4>
                              <div className="text-sm text-gray-500">
                                {note.pageReference && <span className="mr-4">📄 {note.pageReference}</span>}
                                <span>{note.createdAt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleMoveNote(note.id!, 'up')} disabled={noteIndex === 0} title="上に移動"><ArrowUp className={`h-4 w-4 ${noteIndex === 0 ? 'text-gray-300' : 'text-gray-500'}`} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleMoveNote(note.id!, 'down')} disabled={noteIndex === notes.length - 1} title="下に移動"><ArrowDown className={`h-4 w-4 ${noteIndex === notes.length - 1 ? 'text-gray-300' : 'text-gray-500'}`} /></Button>
                            <div className="w-px h-6 bg-gray-200 mx-1" />
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/books/${bookId}/notes/${note.id}/edit`)}><Edit className="h-4 w-4 text-gray-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id!)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </div>
                        {isExpanded && <div className="p-4 border-t bg-white"><MarkdownViewer content={note.content} onContentChange={(newContent) => handleNoteContentChange(note.id!, newContent)} /></div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
