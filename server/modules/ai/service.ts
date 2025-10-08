import OpenAI from "openai";
import { aiRepository } from "./repository";
import type { InsertAiChatMessage, InsertAiCorrection } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Вы - эксперт по расчёту мебели и созданию коммерческих предложений.

Ваша задача:
1. Анализировать чертежи и эскизы мебели
2. Определять материалы, размеры, количество элементов
3. Рассчитывать стоимость на основе прайс-листа материалов
4. Создавать детализированные коммерческие предложения

Формат ответа для расчёта:
{
  "items": [
    {
      "name": "Название изделия",
      "description": "Описание",
      "materials": [
        {"name": "Материал", "quantity": число, "unit": "единица", "price": число}
      ],
      "labor": число,
      "total": число
    }
  ],
  "totalCost": число,
  "notes": "Дополнительные заметки"
}

Используйте предыдущие корректировки для улучшения точности расчётов.`;

export class AiService {
  async analyzePdf(base64Pdf: string, dealId: string, userId: string, userMessage?: string) {
    const corrections = await aiRepository.getCorrections(dealId);
    const materials = await aiRepository.getMaterialPrices();
    
    const materialContext = materials.length > 0 
      ? `\n\nПрайс-лист материалов:\n${materials.map(m => `${m.name}: ${m.price} руб/${m.unit}`).join('\n')}`
      : '';
    
    const correctionContext = corrections.length > 0
      ? `\n\nПредыдущие корректировки:\n${corrections.slice(0, 5).map(c => 
          `- ${c.correction_type}: ${c.corrected_data}`
        ).join('\n')}`
      : '';

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + materialContext + correctionContext },
      {
        role: "user",
        content: [
          { type: "text", text: userMessage || "Проанализируйте чертёж и создайте расчёт КП" },
          { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64Pdf}` } }
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const result = response.choices[0].message.content;
    
    await aiRepository.createChatMessage({
      deal_id: dealId,
      user_id: userId,
      role: "assistant",
      content: result,
    });

    return JSON.parse(result);
  }

  async chat(dealId: string, userId: string, message: string) {
    await aiRepository.createChatMessage({
      deal_id: dealId,
      user_id: userId,
      role: "user",
      content: message,
    });

    const history = await aiRepository.getChatMessages(dealId);
    const corrections = await aiRepository.getCorrections(dealId);
    const materials = await aiRepository.getMaterialPrices();
    
    const materialContext = materials.length > 0 
      ? `\n\nПрайс-лист материалов:\n${materials.map(m => `${m.name}: ${m.price} руб/${m.unit}`).join('\n')}`
      : '';
    
    const correctionContext = corrections.length > 0
      ? `\n\nПредыдущие корректировки:\n${corrections.slice(0, 10).map(c => 
          `- ${c.correction_type}: ${c.corrected_data}`
        ).join('\n')}`
      : '';

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + materialContext + correctionContext },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_completion_tokens: 2048,
    });

    const assistantMessage = response.choices[0].message.content;
    
    await aiRepository.createChatMessage({
      deal_id: dealId,
      user_id: userId,
      role: "assistant",
      content: assistantMessage,
    });

    return { message: assistantMessage, history: await aiRepository.getChatMessages(dealId) };
  }

  async saveCorrection(data: InsertAiCorrection) {
    return await aiRepository.createCorrection(data);
  }

  async getChatHistory(dealId: string) {
    return await aiRepository.getChatMessages(dealId);
  }

  async getMaterialPrices() {
    return await aiRepository.getMaterialPrices();
  }
}

export const aiService = new AiService();
