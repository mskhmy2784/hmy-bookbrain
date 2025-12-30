'use client';

import { useState } from 'react';
import { Book } from '@/types/book';
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
} from 'lucide-react';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (updates: Partial<Book>, fieldsToUpdate: string[]) => Promise<void>;
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
  onSave,
}: BulkEditDialogProps) {
  const [saving, setSaving] = useState(false);
  
  // どのフィールドを更新するか
  const [updateFormat, setUpdateFormat] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [updateCategory, setUpdateCategory] = useState(false);
  const [updateLocation, setUpdateLocation] = useState(false);
  const [updateNdc, setUpdateNdc] = useState(false);

  // 更新する値
  const [format, setFormat] = useState<'paper' | 'ebook'>('paper');
  const [status, setStatus] = useState<'unread' | 'reading' | 'completed' | 'sold'>('unread');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [ndc, setNdc] = useState('');

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

    if (fieldsToUpdate.length === 0) {
      alert('更新する項目を選択してください');
      return;
    }

    setSaving(true);
    try {
      await onSave(updates, fieldsToUpdate);
      // リセット
      setUpdateFormat(false);
      setUpdateStatus(false);
      setUpdateCategory(false);
      setUpdateLocation(false);
      setUpdateNdc(false);
      setCategory('');
      setLocation('');
      setNdc('');
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('一括更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
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
