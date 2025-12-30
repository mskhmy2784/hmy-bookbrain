import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Tag } from '@/types/book';

// 定義済みのタグカラー
export const TAG_COLORS = [
  { name: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', hex: '#6b7280' },
  { name: 'red', bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
  { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', hex: '#f97316' },
  { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  { name: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#eab308' },
  { name: 'lime', bg: 'bg-lime-100', text: 'text-lime-700', hex: '#84cc16' },
  { name: 'green', bg: 'bg-green-100', text: 'text-green-700', hex: '#22c55e' },
  { name: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981' },
  { name: 'teal', bg: 'bg-teal-100', text: 'text-teal-700', hex: '#14b8a6' },
  { name: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-700', hex: '#06b6d4' },
  { name: 'sky', bg: 'bg-sky-100', text: 'text-sky-700', hex: '#0ea5e9' },
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6' },
  { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', hex: '#6366f1' },
  { name: 'violet', bg: 'bg-violet-100', text: 'text-violet-700', hex: '#8b5cf6' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', hex: '#a855f7' },
  { name: 'fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', hex: '#d946ef' },
  { name: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', hex: '#ec4899' },
  { name: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', hex: '#f43f5e' },
];

export function getTagColorClasses(colorName?: string) {
  const color = TAG_COLORS.find(c => c.name === colorName) || TAG_COLORS[0];
  return { bg: color.bg, text: color.text };
}

// タグを追加
export async function addTag(userId: string, tag: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
  const tagsRef = collection(db, 'users', userId, 'tags');
  
  const docRef = await addDoc(tagsRef, {
    name: tag.name,
    color: tag.color || 'gray',
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    name: tag.name,
    color: tag.color || 'gray',
    createdAt: new Date(),
  };
}

// 全タグを取得
export async function getTags(userId: string): Promise<Tag[]> {
  const tagsRef = collection(db, 'users', userId, 'tags');
  const q = query(tagsRef, orderBy('name', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      color: data.color,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    } as Tag;
  });
}

// タグを更新
export async function updateTag(userId: string, tagId: string, updates: Partial<Tag>): Promise<void> {
  const tagRef = doc(db, 'users', userId, 'tags', tagId);
  await updateDoc(tagRef, updates);
}

// タグを削除
export async function deleteTag(userId: string, tagId: string): Promise<void> {
  const tagRef = doc(db, 'users', userId, 'tags', tagId);
  await deleteDoc(tagRef);
}

// タグ名で検索（重複チェック用）
export async function findTagByName(userId: string, name: string): Promise<Tag | null> {
  const tagsRef = collection(db, 'users', userId, 'tags');
  const q = query(tagsRef, where('name', '==', name));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    color: data.color,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  } as Tag;
}

// タグ名からタグを取得（なければ作成）
export async function getOrCreateTag(userId: string, name: string, color?: string): Promise<Tag> {
  const existing = await findTagByName(userId, name);
  if (existing) return existing;
  
  return await addTag(userId, { name, color: color || 'gray' });
}
