import OpenAI from 'openai';
import { analyzeFinance } from './financeAnalyzer.js';

const hasOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key) && key !== 'your_openai_api_key_here';
};

const heuristicResult = (analysis) => ({
  provider: 'heuristic',
  insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8)
});

export const generateAIInsights = async ({ transactions, budget }) => {
  const analysis = analyzeFinance({ transactions, budget });

  if (!hasOpenAIKey()) {
    return heuristicResult(analysis);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const summaryForPrompt = {
      totalIncome: analysis.totalIncome,
      totalExpense: analysis.totalExpense,
      savings: analysis.savings,
      monthlyBudget: analysis.monthlyBudget,
      budgetRemaining: analysis.budgetRemaining,
      categoryBreakdown: analysis.categoryBreakdown,
      monthlyTrend: analysis.monthlyTrend,
      predictedExpense: analysis.predictedExpense
    };

    const prompt = `You are a personal finance assistant. Based on the following JSON summary of a user's income, expenses, budget, and spending trends, generate 5-8 short, specific, actionable insights and recommendations.

Data:
${JSON.stringify(summaryForPrompt)}

Return only a JSON array of strings. No preamble, no markdown, no explanation — just the JSON array.`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    });

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return { provider: 'openai', insights: parsed };
    }

    return heuristicResult(analysis);
  } catch (err) {
    return heuristicResult(analysis);
  }
};

export const predictExpense = async ({ transactions, budget }) => {
  const analysis = analyzeFinance({ transactions, budget });

  return {
    predictedExpense: analysis.predictedExpense,
    confidence: analysis.confidence,
    budgetRisk: analysis.monthlyBudget > 0 && analysis.predictedExpense > analysis.monthlyBudget,
    recommendations: analysis.recommendations
  };
};
