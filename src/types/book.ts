export interface Book {
  id?: string;
  // 基本情報
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  
  // ISBN
  isbn13?: string;
  isbn10?: string;
  
  // 分類
  category?: string;
  ndc?: string; // 日本十進分類法
  
  // 物理情報
  pageCount?: number;
  coverImage?: string;
  
  // 管理情報
  readingStatus: 'unread' | 'reading' | 'completed' | 'sold';
  location?: string; // 保管場所
  format?: 'paper' | 'ebook'; // 書籍形式
  tags?: string[]; // タグ
  
  // AI要約（永続化）
  aiSummary?: string;
  aiSummaryUpdatedAt?: Date;
  
  // メタデータ
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id?: string;
  bookId: string;
  title?: string;
  content: string;
  pageReference?: string; // ページ番号や章の参照
  images?: NoteImage[]; // 添付画像
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteImage {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: Date;
}

export interface Tag {
  id?: string;
  name: string;
  color?: string;
  createdAt: Date;
}
