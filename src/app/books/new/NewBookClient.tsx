'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addBook, findBookByISBN } from '@/lib/books';
import { searchBookByISBN, getCoverImageUrl } from '@/lib/googleBooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Search,
  Loader2,
  BookOpen,
  ImageIcon,
  AlertTriangle,
  BookText,
  Smartphone,
} from 'lucide-react';

const formatOptions = [
  { value: 'paper', label: '紙の書籍', icon: BookText, color: 'bg-amber-100 text-amber-800' },
  { value: 'ebook', label: '電子書籍', icon: Smartphone, color: 'bg-purple-100 text-purple-800' },
];

export default function NewBookClient() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [isbn13, setIsbn13] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [ndc, setNdc] = useState('');
  const [location, setLocation] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [format, setFormat] = useState<'paper' | 'ebook'>('paper');

  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ id: string; title: string } | null>(null);

  const checkDuplicate = async (isbn: string): Promise<boolean> => {
    if (!user || !isbn.trim()) return false;
    
    const existingBook = await findBookByISBN(user.uid, isbn);
    if (existingBook) {
      setDuplicateWarning({ id: existingBook.id!, title: existingBook.title });
      return true;
    }
    setDuplicateWarning(null);
    return false;
  };

  const handleIsbnSearch = async () => {
    if (!isbn13.trim()) return;

    setSearching(true);
    setDuplicateWarning(null);
    
    try {
      if (user) {
        const isDuplicate = await checkDuplicate(isbn13);
        if (isDuplicate) {
          setSearching(false);
          return;
        }
      }

      const bookInfo = await searchBookByISBN(isbn13);
      if (bookInfo) {
        setTitle(bookInfo.title || '');
        setSubtitle(bookInfo.subtitle || '');
        setAuthor(bookInfo.authors?.join(', ') || '');
        setPublisher(bookInfo.publisher || '');
        setPublishedDate(bookInfo.publishedDate || '');
        setPageCount(bookInfo.pageCount?.toString() || '');
        setDescription(bookInfo.description || '');
        setCategory(bookInfo.categories?.join(', ') || '');
        setCoverImage(getCoverImageUrl(bookInfo.imageLinks) || '');
        if (bookInfo.isbn13) setIsbn13(bookInfo.isbn13);
      } else {
        alert('書籍情報が見つかりませんでした');
      }
    } catch (error) {
      console.error('Error searching ISBN:', error);
      alert('検索中にエラーが発生しました');
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!user || !title.trim()) {
      alert('タイトルは必須です');
      return;
    }

    if (isbn13.trim()) {
      const existingBook = await findBookByISBN(user.uid, isbn13);
      if (existingBook) {
        const proceed = confirm(
          `同じISBNの書籍「${existingBook.title}」が既に登録されています。\nそれでも登録しますか？`
        );
        if (!proceed) return;
      }
    }

    setSaving(true);
    try {
      const newBook = await addBook(user.uid, {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        publishedDate: publishedDate.trim() || undefined,
        isbn13: isbn13.trim() || undefined,
        pageCount: pageCount ? parseInt(pageCount) : undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        ndc: ndc.trim() || undefined,
        location: location.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        readingStatus: 'unread',
        format: format,
      });

      if (newBook && newBook.id) {
        router.push(`/books/${newBook.id}`);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('書籍の追加中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() && !confirm('入力内容が破棄されます。よろしいですか？')) {
      return;
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">📚 新しい書籍を登録</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ISBNから自動入力</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={isbn13}
                      onChange={(e) => {
                        setIsbn13(e.target.value);
                        setDuplicateWarning(null);
                      }}
                      placeholder="ISBN-13 または ISBN-10 を入力"
                      className="bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleIsbnSearch()}
                    />
                    <Button
                      variant="outline"
                      onClick={handleIsbnSearch}
                      disabled={searching || !isbn13.trim()}
                    >
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ISBNを入力して検索ボタンを押すと、Google Books APIから書籍情報を自動取得します
                  </p>

                  {duplicateWarning && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">
                          このISBNは既に登録されています
                        </p>
                        <p className="text-yellow-700 mt-1">
                          「{duplicateWarning.title}」
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-yellow-700 underline"
                          onClick={() => router.push(`/books/${duplicateWarning.id}`)}
                        >
                          登録済みの書籍を確認する
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">書籍情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="書籍のタイトル"
                      className="mt-1 bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subtitle">サブタイトル</Label>
                    <Input
                      id="subtitle"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="サブタイトル（任意）"
                      className="mt-1 bg-white"
                    />
                  </div>

                  {/* 書籍形式 */}
                  <div>
                    <Label className="mb-2 block">書籍形式</Label>
                    <div className="flex gap-2">
                      {formatOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <Badge
                            key={opt.value}
                            className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 ${
                              format === opt.value
                                ? opt.color
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            onClick={() => setFormat(opt.value as 'paper' | 'ebook')}
                          >
                            <Icon className="h-4 w-4" />
                            {opt.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="author">著者</Label>
                      <Input
                        id="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="著者名"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publisher">出版社</Label>
                      <Input
                        id="publisher"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        placeholder="出版社名"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publishedDate">出版日</Label>
                      <Input
                        id="publishedDate"
                        value={publishedDate}
                        onChange={(e) => setPublishedDate(e.target.value)}
                        placeholder="例: 2024-01-15"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pageCount">ページ数</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        value={pageCount}
                        onChange={(e) => setPageCount(e.target.value)}
                        placeholder="ページ数"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">カテゴリ</Label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="カテゴリ"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ndc">NDC</Label>
                      <Input
                        id="ndc"
                        value={ndc}
                        onChange={(e) => setNdc(e.target.value)}
                        placeholder="例: 913.6"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">保管場所</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="例: 本棚A-3"
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="書籍の説明や概要"
                      className="mt-1 bg-white min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">表紙画像</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="表紙"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">表紙なし</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="coverImage">画像URL</Label>
                    <Input
                      id="coverImage"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://..."
                      className="mt-1 bg-white text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ISBN検索で自動取得、または直接URLを入力
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">ヒント</p>
                      <p>
                        ISBNは書籍の裏表紙や奥付に記載されています。
                        13桁または10桁の番号を入力してください。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
