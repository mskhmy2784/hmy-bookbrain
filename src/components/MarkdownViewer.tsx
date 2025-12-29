'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  onContentChange?: (newContent: string) => void;
}

export function MarkdownViewer({ content, className = '', onContentChange }: MarkdownViewerProps) {
  // チェックボックスの状態をトグルする関数
  const handleCheckboxToggle = (labelText: string, currentChecked: boolean) => {
    if (!onContentChange) return;

    // ラベルテキストをエスケープして正規表現で使用可能にする
    const escapedLabel = labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 現在の状態に基づいてパターンを作成
    const currentPattern = currentChecked 
      ? `- \\[x\\] ${escapedLabel}`
      : `- \\[ \\] ${escapedLabel}`;
    
    const newState = currentChecked ? '- [ ]' : '- [x]';
    
    const regex = new RegExp(currentPattern);
    const newContent = content.replace(regex, `${newState} ${labelText}`);
    
    if (newContent !== content) {
      onContentChange(newContent);
    }
  };

  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="my-2 text-gray-700 leading-relaxed">{children}</p>
          ),
          ul: ({ children, className }) => {
            const hasCheckbox = className?.includes('contains-task-list');
            return (
              <ul className={`my-2 space-y-1 ${hasCheckbox ? 'list-none pl-0' : 'list-disc list-inside'}`}>
                {children}
              </ul>
            );
          },
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          li: ({ children, className, node }) => {
            const isTask = className?.includes('task-list-item');
            
            if (isTask && onContentChange) {
              // タスクリストアイテムの場合、チェックボックスとラベルを分離して処理
              const childArray = Array.isArray(children) ? children : [children];
              
              // 最初の要素がチェックボックス（input）、残りがラベルテキスト
              const checkbox = childArray[0];
              const labelParts = childArray.slice(1);
              
              // ラベルテキストを文字列として抽出
              const extractText = (node: React.ReactNode): string => {
                if (typeof node === 'string') return node;
                if (typeof node === 'number') return String(node);
                if (Array.isArray(node)) return node.map(extractText).join('');
                if (node && typeof node === 'object' && 'props' in node) {
                  const element = node as React.ReactElement<{ children?: React.ReactNode }>;
                  return extractText(element.props.children);
                }
                return '';
              };
              
              const labelText = extractText(labelParts).trim();
              const isChecked = checkbox && typeof checkbox === 'object' && 'props' in checkbox
                ? !!((checkbox as React.ReactElement<{ checked?: boolean }>).props.checked)
                : false;

              return (
                <li className="text-gray-700 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxToggle(labelText, isChecked)}
                    className="cursor-pointer accent-blue-600 mt-1 rounded"
                  />
                  <span>{labelParts}</span>
                </li>
              );
            }
            
            return (
              <li className={`text-gray-700 ${isTask ? 'flex items-start gap-2' : ''}`}>
                {children}
              </li>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className={`block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono ${className}`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2">{children}</td>
          ),
          // 編集不可の場合のみinputコンポーネントを使用
          input: ({ type, checked }) => {
            if (type === 'checkbox' && !onContentChange) {
              return (
                <input
                  type="checkbox"
                  checked={!!checked}
                  readOnly
                  className="rounded cursor-default"
                />
              );
            }
            // 編集可能な場合はliコンポーネントで処理されるので、ここには来ないはず
            return null;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
