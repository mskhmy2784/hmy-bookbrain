import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 環境変数チェック
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured', debug: 'env_missing' },
        { status: 500 }
      );
    }

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

これらのメモを分析し、以下の形式で要約してください。各セクションは見出し（##）を使い、箇条書きは「-」を使ってください。

## この本の要点
- 要点1
- 要点2
- 要点3
（3〜5個）

## キーワード・重要概念
- キーワード1
- キーワード2
（重要な用語や概念を列挙）

## 読者のインサイト
メモから読み取れる、読者が特に注目した点や気づきを2〜3文で記述。

## 総括
全体を2〜3文でまとめる。

---
${notesText}
---

日本語で、上記のフォーマットに従って簡潔に要約してください。番号付きリスト（1. 2. 3.）は使わず、見出しと箇条書きのみを使ってください。`;

    // Claude API を直接呼び出し
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: `Anthropic API error: ${response.status}`,
          debug: errorText
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.content[0];
    
    if (content.type !== 'text') {
      return NextResponse.json(
        { error: 'Unexpected response type', debug: JSON.stringify(data) },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: content.text });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'AI要約の生成中にエラーが発生しました',
        debug: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
