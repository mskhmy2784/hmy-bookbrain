export interface GoogleBookInfo {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    isbn13?: string;
    isbn10?: string;
  }
  
  export async function searchBookByISBN(isbn: string): Promise<GoogleBookInfo | null> {
    try {
      // ISBNからハイフンを除去
      const cleanIsbn = isbn.replace(/-/g, '');
      
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Google Books API');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null;
      }
      
      const volumeInfo = data.items[0].volumeInfo;
      
      // ISBN情報を抽出
      let isbn13: string | undefined;
      let isbn10: string | undefined;
      
      if (volumeInfo.industryIdentifiers) {
        for (const identifier of volumeInfo.industryIdentifiers) {
          if (identifier.type === 'ISBN_13') {
            isbn13 = identifier.identifier;
          } else if (identifier.type === 'ISBN_10') {
            isbn10 = identifier.identifier;
          }
        }
      }
      
      return {
        title: volumeInfo.title,
        subtitle: volumeInfo.subtitle,
        authors: volumeInfo.authors,
        publisher: volumeInfo.publisher,
        publishedDate: volumeInfo.publishedDate,
        description: volumeInfo.description,
        pageCount: volumeInfo.pageCount,
        categories: volumeInfo.categories,
        imageLinks: volumeInfo.imageLinks,
        isbn13: isbn13 || cleanIsbn,
        isbn10,
      };
    } catch (error) {
      console.error('Error fetching book info:', error);
      return null;
    }
  }
  
  export async function searchBooksByTitle(title: string): Promise<GoogleBookInfo[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=10`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Google Books API');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }
      
      return data.items.map((item: any) => {
        const volumeInfo = item.volumeInfo;
        
        let isbn13: string | undefined;
        let isbn10: string | undefined;
        
        if (volumeInfo.industryIdentifiers) {
          for (const identifier of volumeInfo.industryIdentifiers) {
            if (identifier.type === 'ISBN_13') {
              isbn13 = identifier.identifier;
            } else if (identifier.type === 'ISBN_10') {
              isbn10 = identifier.identifier;
            }
          }
        }
        
        return {
          title: volumeInfo.title,
          subtitle: volumeInfo.subtitle,
          authors: volumeInfo.authors,
          publisher: volumeInfo.publisher,
          publishedDate: volumeInfo.publishedDate,
          description: volumeInfo.description,
          pageCount: volumeInfo.pageCount,
          categories: volumeInfo.categories,
          imageLinks: volumeInfo.imageLinks,
          isbn13,
          isbn10,
        };
      });
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  }
  
  // 表紙画像URLを取得（HTTPSに変換）
  export function getCoverImageUrl(imageLinks?: { thumbnail?: string; smallThumbnail?: string }): string | undefined {
    if (!imageLinks) return undefined;
    
    const url = imageLinks.thumbnail || imageLinks.smallThumbnail;
    if (!url) return undefined;
    
    // HTTPをHTTPSに変換
    return url.replace('http://', 'https://');
  }
  