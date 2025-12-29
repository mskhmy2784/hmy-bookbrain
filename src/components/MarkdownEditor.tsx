'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Square,
  Quote,
  Code,
  Bold,
  Italic,
  Link,
  Table,
  Minus,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  insert: string;
  cursorOffset?: number;
}

const slashCommands: SlashCommand[] = [
  {
    id: 'h1',
    label: '見出し1',
    description: '大見出し',
    icon: <Heading1 className="h-4 w-4" />,
    insert: '# ',
  },
  {
    id: 'h2',
    label: '見出し2',
    description: '中見出し',
    icon: <Heading2 className="h-4 w-4" />,
    insert: '## ',
  },
  {
    id: 'h3',
    label: '見出し3',
    description: '小見出し',
    icon: <Heading3 className="h-4 w-4" />,
    insert: '### ',
  },
  {
    id: 'bullet',
    label: '箇条書き',
    description: '・リスト',
    icon: <List className="h-4 w-4" />,
    insert: '- ',
  },
  {
    id: 'number',
    label: '番号リスト',
    description: '1. 2. 3.',
    icon: <ListOrdered className="h-4 w-4" />,
    insert: '1. ',
  },
  {
    id: 'todo',
    label: 'TODOリスト',
    description: '未完了タスク',
    icon: <Square className="h-4 w-4" />,
    insert: '- [ ] ',
  },
  {
    id: 'done',
    label: '完了タスク',
    description: '完了済みタスク',
    icon: <CheckSquare className="h-4 w-4" />,
    insert: '- [x] ',
  },
  {
    id: 'quote',
    label: '引用',
    description: '引用ブロック',
    icon: <Quote className="h-4 w-4" />,
    insert: '> ',
  },
  {
    id: 'code',
    label: 'コードブロック',
    description: 'プログラムコード',
    icon: <Code className="h-4 w-4" />,
    insert: '```\n\n```',
    cursorOffset: -4,
  },
  {
    id: 'bold',
    label: '太字',
    description: '強調テキスト',
    icon: <Bold className="h-4 w-4" />,
    insert: '****',
    cursorOffset: -2,
  },
  {
    id: 'italic',
    label: '斜体',
    description: 'イタリック',
    icon: <Italic className="h-4 w-4" />,
    insert: '**',
    cursorOffset: -1,
  },
  {
    id: 'link',
    label: 'リンク',
    description: 'URLリンク',
    icon: <Link className="h-4 w-4" />,
    insert: '[](URL)',
    cursorOffset: -6,
  },
  {
    id: 'hr',
    label: '区切り線',
    description: '水平線',
    icon: <Minus className="h-4 w-4" />,
    insert: '\n---\n',
  },
  {
    id: 'table',
    label: 'テーブル',
    description: '表を作成',
    icon: <Table className="h-4 w-4" />,
    insert: '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| データ | データ | データ |',
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className = '',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  
  const [showMenu, setShowMenu] = useState(false);
  const [menuFilter, setMenuFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slashPosition, setSlashPosition] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const filteredCommands = slashCommands.filter(
    (cmd) =>
      cmd.id.toLowerCase().includes(menuFilter.toLowerCase()) ||
      cmd.label.toLowerCase().includes(menuFilter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(menuFilter.toLowerCase())
  );

  // カーソル位置を計算
  const calculateCaretPosition = (textarea: HTMLTextAreaElement, position: number) => {
    if (!mirrorRef.current) return { top: 0, left: 0 };

    const mirror = mirrorRef.current;
    const computed = window.getComputedStyle(textarea);

    // ミラー要素にスタイルをコピー
    mirror.style.width = computed.width;
    mirror.style.padding = computed.padding;
    mirror.style.border = computed.border;
    mirror.style.font = computed.font;
    mirror.style.lineHeight = computed.lineHeight;
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.top = '0';
    mirror.style.left = '0';

    // カーソル位置までのテキストを設定
    const textBeforeCursor = textarea.value.substring(0, position);
    mirror.textContent = textBeforeCursor;

    // スパン要素を追加してカーソル位置を取得
    const span = document.createElement('span');
    span.textContent = '|';
    mirror.appendChild(span);

    const textareaRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    // スクロール位置を考慮
    const top = spanRect.top - mirrorRect.top - textarea.scrollTop + 24; // 行の高さ分下に
    const left = spanRect.left - mirrorRect.left;

    return { top, left };
  };

  useEffect(() => {
    if (showMenu) {
      setSelectedIndex(0);
    }
  }, [showMenu, menuFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const closeMenu = () => {
    setShowMenu(false);
    setMenuFilter('');
    setSlashPosition(null);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    if (newValue.length > value.length) {
      const addedChar = newValue[cursorPos - 1];
      
      if (addedChar === '/') {
        const beforeSlash = cursorPos > 1 ? newValue[cursorPos - 2] : '\n';
        if (beforeSlash === '\n' || beforeSlash === ' ' || cursorPos === 1) {
          // カーソル位置を計算してメニューを表示
          const pos = calculateCaretPosition(e.target, cursorPos);
          setMenuPosition(pos);
          setShowMenu(true);
          setSlashPosition(cursorPos - 1);
          setMenuFilter('');
        }
      } else if (showMenu && slashPosition !== null) {
        const filterText = newValue.substring(slashPosition + 1, cursorPos);
        if (filterText.includes(' ') || filterText.includes('\n')) {
          closeMenu();
        } else {
          setMenuFilter(filterText);
        }
      }
    } else if (showMenu && slashPosition !== null) {
      if (cursorPos <= slashPosition) {
        closeMenu();
      } else {
        const filterText = newValue.substring(slashPosition + 1, cursorPos);
        setMenuFilter(filterText);
      }
    }

    onChange(newValue);
  };

  const insertCommand = (command: SlashCommand) => {
    if (slashPosition === null || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    
    const before = value.substring(0, slashPosition);
    const after = value.substring(cursorPos);
    const newValue = before + command.insert + after;
    
    onChange(newValue);
    closeMenu();

    setTimeout(() => {
      const newCursorPos = slashPosition + command.insert.length + (command.cursorOffset || 0);
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMenu) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          insertCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          insertCommand(filteredCommands[selectedIndex]);
        }
        break;
    }
  };

  return (
    <div className="relative">
      {/* カーソル位置計算用のミラー要素 */}
      <div ref={mirrorRef} aria-hidden="true" />
      
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`font-mono text-sm resize-none ${className}`}
      />

      {/* スラッシュコマンドメニュー - カーソル位置に表示 */}
      {showMenu && filteredCommands.length > 0 && (
        <div
          ref={menuRef}
          className="absolute w-72 max-h-80 overflow-y-auto bg-white border rounded-lg shadow-lg z-50"
          style={{
            top: `${menuPosition.top}px`,
            left: `${Math.min(menuPosition.left, 100)}px`, // 左端からはみ出さないよう調整
          }}
        >
          <div className="p-2 border-b bg-gray-50">
            <p className="text-xs text-gray-500">
              マークダウン記法を挿入 • ↑↓で選択 • Enterで確定
            </p>
          </div>
          <div className="py-1">
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                className={`w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-gray-100 ${
                  index === selectedIndex ? 'bg-blue-50 text-blue-700' : ''
                }`}
                onClick={() => insertCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="text-gray-500">{cmd.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{cmd.label}</p>
                  <p className="text-xs text-gray-500 truncate">{cmd.description}</p>
                </div>
                <code className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                  /{cmd.id}
                </code>
              </button>
            ))}
          </div>
        </div>
      )}

      {showMenu && filteredCommands.length === 0 && (
        <div
          ref={menuRef}
          className="absolute w-72 bg-white border rounded-lg shadow-lg z-50 p-4 text-center text-gray-500 text-sm"
          style={{
            top: `${menuPosition.top}px`,
            left: `${Math.min(menuPosition.left, 100)}px`,
          }}
        >
          該当するコマンドがありません
        </div>
      )}
    </div>
  );
}
