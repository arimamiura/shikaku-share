import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { answers, ownedNames, candidates } = await req.json();

    const ownedList = ownedNames.length > 0
      ? `【保有済み資格】\n${ownedNames.map((n: string) => `・${n}`).join("\n")}`
      : "【保有済み資格】なし";

    const answerList = answers
      .map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`)
      .join("\n\n");

    const candidateList = candidates
      .map((q: { name: string; level: string; category: string; description: string; fromOwned?: string[] }) =>
        `・${q.name}（${q.level} / ${q.category}）${q.fromOwned?.length ? ` ※${q.fromOwned.join("・")}の次のステップ` : ""}\n  ${q.description}`
      )
      .join("\n");

    const prompt = `あなたはIT資格のキャリアアドバイザーです。
ユーザーの診断結果をもとに、おすすめ資格とその理由を日本語で簡潔に説明してください。

${ownedList}

【診断回答】
${answerList}

【おすすめ候補】
${candidateList}

上記の候補からTop5を選び、以下のJSON形式で返してください。
理由は2〜3文で、ユーザーの回答内容や保有資格を踏まえた具体的な文にしてください。

{
  "results": [
    {
      "name": "資格名（候補と完全一致）",
      "reason": "おすすめ理由（2〜3文）",
      "catchcopy": "キャッチコピー（10文字以内）"
    }
  ]
}

JSONのみ返してください。説明文は不要です。`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response from AI");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "AI診断に失敗しました" }, { status: 500 });
  }
}
