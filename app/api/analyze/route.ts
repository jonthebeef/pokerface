import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getRulesBasedRecommendation,
  buildClaudePrompt,
} from "@/lib/strategy/recommendationEngine";
import { Card, GameStage, HandEvaluation, Recommendation, Position } from "@/lib/poker/types";

interface AnalyzeRequest {
  holeCards: [Card, Card];
  communityCards: Card[];
  stage: GameStage;
  handEvaluation: HandEvaluation;
  position?: Position;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { holeCards, communityCards, stage, handEvaluation, position } = body;

    // Get rules-based recommendation (always works)
    const rulesRec = getRulesBasedRecommendation({
      holeCards,
      communityCards,
      stage,
      handEvaluation,
      position,
    });

    let recommendation: Recommendation = rulesRec;

    // Try to get Claude's advice if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey });

        const prompt = buildClaudePrompt(
          { holeCards, communityCards, stage, handEvaluation },
          rulesRec
        );

        const message = await anthropic.messages.create({
          model: "claude-haiku-3-5-20241022",
          max_tokens: 100,
          messages: [{ role: "user", content: prompt }],
        });

        const claudeAdvice =
          message.content[0].type === "text" ? message.content[0].text : undefined;

        recommendation = {
          ...rulesRec,
          claudeAdvice,
        };
      } catch (error) {
        console.error("Claude API error:", error);
        // Fall back to rules-based recommendation
      }
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze hand" },
      { status: 500 }
    );
  }
}
