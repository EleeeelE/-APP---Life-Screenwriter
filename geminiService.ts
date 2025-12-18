
import { GoogleGenAI, Type } from "@google/genai";
import { ScreenplayState, FinalReport } from "./types.ts";
import { DIRECTOR_TIPS } from "./constants.tsx";

export async function generateFinalAudit(state: ScreenplayState): Promise<FinalReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const entries = state.act4.entries || {};
  const act4Details = Object.entries(entries)
    .filter(([_, content]) => content && (content as string).trim().length > 0)
    .map(([idx, content]) => `[${DIRECTOR_TIPS[parseInt(idx)]?.title || '锦囊'}] ${content}`)
    .join('\n');

  const prompt = `
    你是一位顶尖的电影制片人和人生教练。请基于以下用户今日的“人生剧本”复盘数据，生成一份极其精炼且具有洞察力的终审报告。
    
    【今日剧本数据】
    - 高光：${state.act1.high1}, ${state.act1.high2}, ${state.act1.high3}
    - 冲突：事实(${state.act2.fact})，思考(${state.act2.notes})
    - 暖意：${state.act3.gratitude}
    - 导演剖析：${act4Details || "（用户未提供特定深挖锦囊，请根据高光和冲突自行推演）"}
    - 明日计划：${state.act5.goal1}, ${state.act5.goal2}, ${state.act5.goal3}

    【任务目标】
    请以 JSON 格式输出以下内容：
    1. directorsCut: 一段 150 字左右的感性文字，像电影开场白一样复述主角的一天。
    2. scriptNotes: 基于第一性原理，给主角提供具体的破局建议或优化方向。
    3. genreTag: 一个 2-4 字的电影类型标签（如：热血励志、温馨治愈、硬核烧脑等）。
    4. stats: 一个包含 narrative, control, insight 三项数值（1-100）的对象。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
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
              narrative: { type: Type.INTEGER },
              control: { type: Type.INTEGER },
              insight: { type: Type.INTEGER },
            },
            required: ["narrative", "control", "insight"],
          },
        },
        required: ["directorsCut", "scriptNotes", "genreTag", "stats"],
      },
    },
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text) as FinalReport;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    // 回退逻辑
    return {
      directorsCut: "胶片在一阵晃动后陷入黑暗。今日的叙事似乎在处理过程中遇到了一点干扰，但没关系，剧本总有留白。主角在迷雾中前行，等待下一次清醒的拍摄。",
      scriptNotes: "建议：检查网络连接，或尝试重新生成。即使在技术故障面前，主角也要保持优雅。",
      genreTag: "幕后花絮",
      stats: { narrative: 50, control: 50, insight: 50 }
    };
  }
}
