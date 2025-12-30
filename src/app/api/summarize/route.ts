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

    // APIキーの形式チェック（最初と最後の数文字だけ表示）
    const keyPreview = `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`;

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

    // Claude API を直接呼び出し
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
          debug: errorText,
          keyPreview: keyPreview
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
