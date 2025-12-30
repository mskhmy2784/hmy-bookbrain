'use client';

import { useState, useEffect } from 'react';
import { Book, Tag } from '@/types/book';
import { getTags, addTag, TAG_COLORS, getTagColorClasses } from '@/lib/tags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookText,
  Smartphone,
  Loader2,
  Plus,
  X,
  Check,
} from 'lucide-react';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  userId: string;
  onSave: (updates: Partial<Book>, fieldsToUpdate: string[], tagsToAdd?: string[]) => Promise<void>;
}

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

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  userId,
  onSave,
}: BulkEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  
  // どのフィールドを更新するか
  const [updateFormat, setUpdateFormat] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [updateCategory, setUpdateCategory] = useState(false);
  const [updateLocation, setUpdateLocation] = useState(false);
  const [updateNdc, setUpdateNdc] = useState(false);
  const [updateTags, setUpdateTags] = useState(false);

  // 更新する値
  const [format, setFormat] = useState<'paper' | 'ebook'>('paper');
  const [status, setStatus] = useState<'unread' | 'reading' | 'completed' | 'sold'>('unread');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [ndc, setNdc] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  
  // 新規タグ作成
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('blue');

  // タグ一覧を取得
  useEffect(() => {
    if (open && userId) {
      getTags(userId).then(setAllTags).catch(console.error);
    }
  }, [open, userId]);

  const handleSave = async () => {
    const updates: Partial<Book> = {};
    const fieldsToUpdate: string[] = [];

    if (updateFormat) {
      updates.format = format;
      fieldsToUpdate.push('format');
    }
    if (updateStatus) {
      updates.readingStatus = status;
      fieldsToUpdate.push('readingStatus');
    }
    if (updateCategory) {
      updates.category = category || undefined;
      fieldsToUpdate.push('category');
    }
    if (updateLocation) {
      updates.location = location || undefined;
      fieldsToUpdate.push('location');
    }
    if (updateNdc) {
      updates.ndc = ndc || undefined;
      fieldsToUpdate.push('ndc');
    }

    if (fieldsToUpdate.length === 0 && (!updateTags || tagsToAdd.length === 0)) {
      alert('更新する項目を選択してください');
      return;
    }

    setSaving(true);
    try {
      await onSave(updates, fieldsToUpdate, updateTags ? tagsToAdd : undefined);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('一括更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setUpdateFormat(false);
    setUpdateStatus(false);
    setUpdateCategory(false);
    setUpdateLocation(false);
    setUpdateNdc(false);
    setUpdateTags(false);
    setCategory('');
    setLocation('');
    setNdc('');
    setTagsToAdd([]);
    setIsCreatingTag(false);
    setNewTagName('');
  };

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleToggleTag = (tagName: string) => {
    setTagsToAdd(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !userId) return;
    
    const exists = allTags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (exists) {
      handleToggleTag(newTagName.trim());
      setNewTagName('');
      setIsCreatingTag(false);
      return;
    }

    try {
      const newTag = await addTag(userId, { name: newTagName.trim(), color: newTagColor });
      setAllTags([...allTags, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      handleToggleTag(newTag.name);
      setNewTagName('');
      setIsCreatingTag(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>一括編集</DialogTitle>
          <DialogDescription>
            選択した {selectedCount} 冊の書籍を一括で更新します。
            更新したい項目にチェックを入れてください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 書籍形式 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-format"
                checked={updateFormat}
                onCheckedChange={(checked) => setUpdateFormat(checked === true)}
              />
              <Label htmlFor="update-format" className="font-medium">
                書籍形式を変更
              </Label>
            </div>
            {updateFormat && (
              <div className="ml-6 flex gap-2">
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
            )}
          </div>

          {/* 読書ステータス */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-status"
                checked={updateStatus}
                onCheckedChange={(checked) => setUpdateStatus(checked === true)}
              />
              <Label htmlFor="update-status" className="font-medium">
                読書ステータスを変更
              </Label>
            </div>
            {updateStatus && (
              <div className="ml-6 flex gap-2 flex-wrap">
                {statusOptions.map((opt) => (
                  <Badge
                    key={opt.value}
                    className={`cursor-pointer px-3 py-1.5 ${
                      status === opt.value
                        ? opt.color
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    onClick={() => setStatus(opt.value as any)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* タグ追加 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-tags"
                checked={updateTags}
                onCheckedChange={(checked) => setUpdateTags(checked === true)}
              />
              <Label htmlFor="update-tags" className="font-medium">
                タグを追加
              </Label>
            </div>
            {updateTags && (
              <div className="ml-6 space-y-3">
                {/* 選択済みタグ */}
                {tagsToAdd.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tagsToAdd.map((tagName) => {
                      const tag = allTags.find(t => t.name === tagName);
                      const colors = getTagColorClasses(tag?.color);
                      return (
                        <Badge
                          key={tagName}
                          className={`${colors.bg} ${colors.text} pr-1 flex items-center gap-1`}
                        >
                          {tagName}
                          <button
                            onClick={() => handleToggleTag(tagName)}
                            className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                
                {/* タグ選択 */}
                {!isCreatingTag ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {allTags.filter(tag => !tagsToAdd.includes(tag.name)).map((tag) => {
                        const colors = getTagColorClasses(tag.color);
                        return (
                          <Badge
                            key={tag.id}
                            className={`cursor-pointer ${colors.bg} ${colors.text} opacity-60 hover:opacity-100`}
                            onClick={() => handleToggleTag(tag.name)}
                          >
                            + {tag.name}
                          </Badge>
                        );
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600"
                      onClick={() => setIsCreatingTag(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新しいタグを作成
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="タグ名"
                      className="h-8 text-sm bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTag();
                        if (e.key === 'Escape') setIsCreatingTag(false);
                      }}
                      autoFocus
                    />
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">色を選択</p>
                      <div className="grid grid-cols-9 gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setNewTagColor(color.name)}
                            className={`w-5 h-5 rounded-full ${color.bg} border-2 flex items-center justify-center ${
                              newTagColor === color.name ? 'border-gray-600' : 'border-transparent'
                            }`}
                          >
                            {newTagColor === color.name && <Check className={`h-2.5 w-2.5 ${color.text}`} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setIsCreatingTag(false); setNewTagName(''); }}>
                        キャンセル
                      </Button>
                      <Button size="sm" className="flex-1" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                        作成
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* カテゴリ */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-category"
                checked={updateCategory}
                onCheckedChange={(checked) => setUpdateCategory(checked === true)}
              />
              <Label htmlFor="update-category" className="font-medium">
                カテゴリを変更
              </Label>
            </div>
            {updateCategory && (
              <div className="ml-6">
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="カテゴリ（空欄で削除）"
                  className="bg-white"
                />
              </div>
            )}
          </div>

          {/* 保管場所 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-location"
                checked={updateLocation}
                onCheckedChange={(checked) => setUpdateLocation(checked === true)}
              />
              <Label htmlFor="update-location" className="font-medium">
                保管場所を変更
              </Label>
            </div>
            {updateLocation && (
              <div className="ml-6">
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="保管場所（空欄で削除）"
                  className="bg-white"
                />
              </div>
            )}
          </div>

          {/* NDC */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="update-ndc"
                checked={updateNdc}
                onCheckedChange={(checked) => setUpdateNdc(checked === true)}
              />
              <Label htmlFor="update-ndc" className="font-medium">
                NDCを変更
              </Label>
            </div>
            {updateNdc && (
              <div className="ml-6">
                <Input
                  value={ndc}
                  onChange={(e) => setNdc(e.target.value)}
                  placeholder="NDC（空欄で削除）"
                  className="bg-white"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              `${selectedCount}冊を更新`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
