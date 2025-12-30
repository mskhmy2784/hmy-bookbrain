'use client';

import { useState, useEffect, useRef } from 'react';
import { Tag } from '@/types/book';
import { getTags, addTag, TAG_COLORS, getTagColorClasses } from '@/lib/tags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { X, Plus, Check } from 'lucide-react';

interface TagInputProps {
  userId: string;
  selectedTags: string[];  // タグ名の配列
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({ userId, selectedTags, onChange, disabled }: TagInputProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('blue');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // タグ一覧を取得
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getTags(userId);
        setAllTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    fetchTags();
  }, [userId]);

  // タグを追加
  const handleAddTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onChange([...selectedTags, tagName]);
    }
  };

  // タグを削除
  const handleRemoveTag = (tagName: string) => {
    onChange(selectedTags.filter(t => t !== tagName));
  };

  // 新しいタグを作成
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    // 既存タグのチェック
    const exists = allTags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (exists) {
      handleAddTag(newTagName.trim());
      setNewTagName('');
      setIsCreating(false);
      return;
    }

    try {
      const newTag = await addTag(userId, { name: newTagName.trim(), color: newTagColor });
      setAllTags([...allTags, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      handleAddTag(newTag.name);
      setNewTagName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  // タグの色クラスを取得
  const getColorForTag = (tagName: string) => {
    const tag = allTags.find(t => t.name === tagName);
    return getTagColorClasses(tag?.color);
  };

  // 未選択のタグを取得
  const availableTags = allTags.filter(tag => !selectedTags.includes(tag.name));

  return (
    <div className="space-y-2">
      {/* 選択済みタグ表示 */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tagName) => {
          const colors = getColorForTag(tagName);
          return (
            <Badge
              key={tagName}
              className={`${colors.bg} ${colors.text} pr-1 flex items-center gap-1`}
            >
              {tagName}
              {!disabled && (
                <button
                  onClick={() => handleRemoveTag(tagName)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          );
        })}
        
        {/* タグ追加ボタン */}
        {!disabled && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                タグ追加
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              {!isCreating ? (
                <div className="space-y-2">
                  {/* 既存タグ一覧 */}
                  {availableTags.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {availableTags.map((tag) => {
                        const colors = getTagColorClasses(tag.color);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              handleAddTag(tag.name);
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 flex items-center gap-2"
                          >
                            <span className={`w-3 h-3 rounded-full ${colors.bg} border`} />
                            <span className="text-sm">{tag.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      利用可能なタグがありません
                    </p>
                  )}
                  
                  {/* 新規作成ボタン */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-blue-600"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新しいタグを作成
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Input
                      ref={inputRef}
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="タグ名"
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTag();
                        if (e.key === 'Escape') setIsCreating(false);
                      }}
                      autoFocus
                    />
                  </div>
                  
                  {/* カラー選択 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">色を選択</p>
                    <div className="grid grid-cols-6 gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setNewTagColor(color.name)}
                          className={`w-6 h-6 rounded-full ${color.bg} border-2 flex items-center justify-center ${
                            newTagColor === color.name ? 'border-gray-600' : 'border-transparent'
                          }`}
                        >
                          {newTagColor === color.name && (
                            <Check className={`h-3 w-3 ${color.text}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* ボタン */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsCreating(false);
                        setNewTagName('');
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                    >
                      作成
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {/* タグがない場合 */}
      {selectedTags.length === 0 && disabled && (
        <p className="text-sm text-gray-400">タグなし</p>
      )}
    </div>
  );
}

// タグ表示専用コンポーネント（リスト表示用）
interface TagBadgesProps {
  tags: string[];
  allTags: Tag[];
  maxDisplay?: number;
}

export function TagBadges({ tags, allTags, maxDisplay = 3 }: TagBadgesProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remaining = tags.length - displayTags.length;

  const getColorForTag = (tagName: string) => {
    const tag = allTags.find(t => t.name === tagName);
    return getTagColorClasses(tag?.color);
  };

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tagName) => {
        const colors = getColorForTag(tagName);
        return (
          <Badge
            key={tagName}
            className={`${colors.bg} ${colors.text} text-xs px-1.5 py-0`}
          >
            {tagName}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
