'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getBook, updateBook, deleteBook } from '@/lib/books';
import { getNotes, deleteNote } from '@/lib/notes';
import { searchBookByISBN, getCoverImageUrl } from '@/lib/googleBooks';
import { Book, Note } from '@/types/book';
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
} from 'lucide-react';

const statusOptions = [
  { value: 'unread', label: '未読', color: 'bg-gray-100 text-gray-800' },
  { value: 'reading', label: '読書中', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: '読了', color: 'bg-green-100 text-green-800' },
  { value: 'sold', label: '売却済み', color: 'bg-red-100 text-red-800' },
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex gap-6">
                <div className="shrink-0">
                  <div className="w-32 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {(isEditing ? editedBook.coverImage : book.coverImage) ? (
                      <img
                        src={isEditing ? editedBook.coverImage : book.coverImage}
                        alt="表紙"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <BookOpen className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-xs">表紙なし</p>
                      </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={handleFetchCover}
                          disabled={fetchingCover}
                        >
                          {fetchingCover ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <ImageIcon className="h-3 w-3 mr-1" />
                          )}
                          {book.coverImage ? '表紙を再取得' : '表紙を取得'}
                        </Button>
                      )}
                      {!book.isbn13 && !book.coverImage && (
                        <p className="text-xs text-gray-400 text-center">
                          ISBNを登録すると<br/>表紙を取得できます
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={editedBook.title || ''}
                          onChange={(e) => updateField('title', e.target.value)}
                          className="text-2xl font-bold bg-white"
                          placeholder="タイトル"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold">{book.title}</h2>
                      )}
                      {isEditing ? (
                        <Input
                          value={editedBook.subtitle || ''}
                          onChange={(e) => updateField('subtitle', e.target.value)}
                          className="mt-2 bg-white"
                          placeholder="サブタイトル（任意）"
                        />
                      ) : (
                        book.subtitle && <p className="text-gray-600 mt-1">{book.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {statusOptions.map((status) => (
                      <Badge
                        key={status.value}
                        className={`cursor-pointer ${
                          book.readingStatus === status.value
                            ? status.color
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        onClick={() => handleStatusChange(status.value as any)}
                      >
                        {status.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="author">著者</Label>
                      <Input
                        id="author"
                        value={editedBook.author || ''}
                        onChange={(e) => updateField('author', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="著者名"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publisher">出版社</Label>
                      <Input
                        id="publisher"
                        value={editedBook.publisher || ''}
                        onChange={(e) => updateField('publisher', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="出版社名"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publishedDate">出版日</Label>
                      <Input
                        id="publishedDate"
                        value={editedBook.publishedDate || ''}
                        onChange={(e) => updateField('publishedDate', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="例: 2024-01-15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pageCount">ページ数</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        value={editedBook.pageCount || ''}
                        onChange={(e) => updateField('pageCount', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="mt-1 bg-white"
                        placeholder="ページ数"
                      />
                    </div>
                    <div>
                      <Label htmlFor="isbn13">ISBN</Label>
                      <Input
                        id="isbn13"
                        value={editedBook.isbn13 || ''}
                        onChange={(e) => updateField('isbn13', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="ISBN-13"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ndc">NDC（日本十進分類法）</Label>
                      <Input
                        id="ndc"
                        value={editedBook.ndc || ''}
                        onChange={(e) => updateField('ndc', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="例: 913.6"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">カテゴリ</Label>
                      <Input
                        id="category"
                        value={editedBook.category || ''}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="カテゴリ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">保管場所</Label>
                      <Input
                        id="location"
                        value={editedBook.location || ''}
                        onChange={(e) => updateField('location', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="例: 本棚A-3"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={editedBook.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      className="mt-1 bg-white min-h-[100px]"
                      placeholder="書籍の説明や概要"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {book.author && (
                      <div>
                        <span className="text-sm text-gray-500">著者</span>
                        <p className="font-medium">{book.author}</p>
                      </div>
                    )}
                    {book.publisher && (
                      <div>
                        <span className="text-sm text-gray-500">出版社</span>
                        <p className="font-medium">{book.publisher}</p>
                      </div>
                    )}
                    {book.publishedDate && (
                      <div>
                        <span className="text-sm text-gray-500">出版日</span>
                        <p className="font-medium">{book.publishedDate}</p>
                      </div>
                    )}
                    {book.pageCount && book.pageCount > 0 && (
                      <div>
                        <span className="text-sm text-gray-500">ページ数</span>
                        <p className="font-medium">{book.pageCount}ページ</p>
                      </div>
                    )}
                    {book.isbn13 && (
                      <div>
                        <span className="text-sm text-gray-500">ISBN</span>
                        <p className="font-medium">{book.isbn13}</p>
                      </div>
                    )}
                    {book.ndc && (
                      <div>
                        <span className="text-sm text-gray-500">NDC</span>
                        <p className="font-medium">{book.ndc}</p>
                      </div>
                    )}
                    {book.category && (
                      <div>
                        <span className="text-sm text-gray-500">カテゴリ</span>
                        <p className="font-medium">{book.category}</p>
                      </div>
                    )}
                    {book.location && (
                      <div>
                        <span className="text-sm text-gray-500">保管場所</span>
                        <p className="font-medium">{book.location}</p>
                      </div>
                    )}
                  </div>

                  {book.description && (
                    <div className="pt-4 border-t">
                      <span className="text-sm text-gray-500">説明</span>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{book.description}</p>
                    </div>
                  )}

                  {!book.author && !book.publisher && !book.publishedDate && !book.pageCount && !book.isbn13 && !book.ndc && !book.category && !book.location && !book.description && (
                    <p className="text-gray-400 text-center py-4">
                      書籍情報がありません。「編集」ボタンから追加できます。
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">📝 メモ ({notes.length}件)</CardTitle>
                <Button onClick={() => router.push(`/books/${bookId}/notes/new`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  メモを追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  まだメモがありません。「メモを追加」ボタンから追加できます。
                </p>
              ) : (
                <div className="space-y-6">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {note.title && (
                            <h4 className="font-semibold text-lg">{note.title}</h4>
                          )}
                          <div className="text-sm text-gray-500">
                            {note.pageReference && (
                              <span className="mr-4">📄 {note.pageReference}</span>
                            )}
                            <span>
                              {note.createdAt.toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/books/${bookId}/notes/${note.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id!)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        <MarkdownViewer content={note.content} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
