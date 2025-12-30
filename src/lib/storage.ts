import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { NoteImage } from '@/types/book';

// 画像をアップロード
export async function uploadNoteImage(
  userId: string,
  bookId: string,
  noteId: string,
  file: File | Blob,
  fileName?: string
): Promise<NoteImage> {
  const imageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const extension = fileName?.split('.').pop() || 'png';
  const finalFileName = `${imageId}.${extension}`;
  const path = `users/${userId}/books/${bookId}/notes/${noteId}/${finalFileName}`;
  
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/png',
  });
  
  const url = await getDownloadURL(storageRef);
  
  return {
    id: imageId,
    url,
    fileName: finalFileName,
    uploadedAt: new Date(),
  };
}

// Blobから画像をアップロード（クリップボードペースト用）
export async function uploadImageFromBlob(
  userId: string,
  bookId: string,
  noteId: string,
  blob: Blob
): Promise<NoteImage> {
  const extension = blob.type.split('/')[1] || 'png';
  const fileName = `clipboard-${Date.now()}.${extension}`;
  return uploadNoteImage(userId, bookId, noteId, blob, fileName);
}

// 画像を削除
export async function deleteNoteImage(
  userId: string,
  bookId: string,
  noteId: string,
  fileName: string
): Promise<void> {
  const path = `users/${userId}/books/${bookId}/notes/${noteId}/${fileName}`;
  const storageRef = ref(storage, path);
  
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // 画像が存在しない場合はエラーを無視
  }
}

// 複数画像を削除
export async function deleteAllNoteImages(
  userId: string,
  bookId: string,
  noteId: string,
  images: NoteImage[]
): Promise<void> {
  await Promise.all(
    images.map(img => deleteNoteImage(userId, bookId, noteId, img.fileName))
  );
}
