import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, bookAuthor, notes } = await request.json();

    if (!notes || notes.length === 0) {
      return NextResponse.json(
        { error: 'メモがありません' },
        { status: 400 }
      );
    }

    // メモの内容を整形
    const notesText = notes
      .map((note: { title?: string; content: string; pageReference?: string }, index: number) => {
        const header = note.title || `メモ ${index + 1}`;
        const page = note.pageReference ? ` (p.${note.pageReference})` : '';
        return `### ${header}${page}\n${note.content}`;
      })
      .join('\n\n');

    const prompt = `以下は「${bookTitle}」${bookAuthor ? `（著者: ${bookAuthor}）` : ''}という書籍に関するメモです。

これらのメモを分析し、以下の形式で要約してください：

1. **この本の要点**（3〜5個の箇条書き）
2. **キーワード・重要概念**（重要な用語や概念を列挙）
3. **読者のインサイト**（メモから読み取れる、読者が特に注目した点や気づき）
4. **総括**（2〜3文で全体をまとめる）

---
${notesText}
---

日本語で、簡潔かつ分かりやすく要約してください。`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return NextResponse.json({ summary: content.text });
  } catch (error) {
    console.error('AI Summary error:', error);
    return NextResponse.json(
      { error: 'AI要約の生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
