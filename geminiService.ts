
import { GoogleGenAI, Type } from "@google/genai";
import { ScreenplayState, FinalReport } from "./types";
import { DIRECTOR_TIPS } from "./constants";

export async function generateFinalAudit(state: ScreenplayState): Promise<FinalReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const act4Details = Object.entries(state.act4.entries)
    .filter(([_, content]) => content.trim().length > 0)
    .map(([idx, content]) => `[${DIRECTOR_TIPS[parseInt(idx)].title}] ${content}`)
    .join('\n');

  const prompt = `
    你是一位顶尖的电影制片人和人生教练。请基于以下用户今日的“人生剧本”复盘数据，生成一份极其精炼且具有洞察力的终审报告。
    
    【今日剧本数据】
    - 高光：${state.act1.high1}, ${state.act1.high2}, ${state.act1.high3}
    - 冲突：事实(${state.act2.fact})，思考(${state.act2.notes})
    - 暖意：${state.act3.gratitude}
    - 导演剖析：${act4Details || "（用户未提供特定深挖锦囊，请根据高光和冲突自行推演）"}
    - 明日计划：${state.act5.goal1}, ${state.act5.goal2}, ${state.act5.goal3}

    【输出要求】
    1. 导演剪辑版叙事 (directorsCut): 拒绝空洞的辞藻。用富有张力、扎根于今日事实的短句，将用户的一天串联成一个具有“成长弧光”的电影片段。强调实际的动作和转变。控制在 150 字以内。
    2. 剧本优化建议 (scriptNotes): 严禁使用 Markdown 符号（严禁出现 ** 或 #）。直接输出纯文本。针对今日的“冲突”，提供 2 条极其硬核、可落地的实战策略。每条建议包含[核心词]和1句解释。总字数控制在 150 字以内。
    3. 今日片种标签 (genreTag): 3-5个字的电影类型描述。
    4. 职业生涯点数 (stats): 叙事力、掌控力、洞察力分数 (1-100)。

    注意：输出格式必须为纯 JSON。如果输入数据几乎为空，请以“镜头对准空无一人的片场...”为基调生成一个充满哲学思考和鼓励的叙事。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          directorsCut: { type: Type.STRING },
          scriptNotes: { type: Type.STRING },
          genreTag: { type: Type.STRING },
          stats: {
            type: Type.OBJECT,
            properties: {
              narrative: { type: Type.NUMBER },
              control: { type: Type.NUMBER },
              insight: { type: Type.NUMBER },
            },
            required: ["narrative", "control", "insight"]
          }
        },
        required: ["directorsCut", "scriptNotes", "genreTag", "stats"]
      }
    }
  });

  const jsonStr = response.text;
  if (!jsonStr) {
    throw new Error("AI returned an empty response.");
  }

  try {
    const cleanedJson = jsonStr.trim();
    const parsed = JSON.parse(cleanedJson);
    
    if (parsed.scriptNotes) {
      parsed.scriptNotes = parsed.scriptNotes.replace(/\*\*/g, '');
    }
    if (parsed.directorsCut) {
      parsed.directorsCut = parsed.directorsCut.replace(/\*\*/g, '');
    }
    
    return parsed;
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    throw new Error("生成报告失败，剧本解析出现异常。");
  }
}
