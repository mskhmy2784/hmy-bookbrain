export interface Book {
  id?: string;
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  publishedDate?: string;
  isbn13?: string;
  isbn10?: string;
  pageCount?: number;
  description?: string;
  category?: string;
  ndc?: string;
  location?: string;
  coverImage?: string;
  readingStatus: 'unread' | 'reading' | 'completed' | 'sold';  // soldを追加
  rating?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id?: string;
  bookId?: string;
  title?: string;
  content: string;
  pageReference?: string;
  summary?: string;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id?: string;
  name: string;
  color?: string;
  createdAt: Date;
}
