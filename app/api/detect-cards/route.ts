import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Card, Rank, Suit, DetectionResult } from "@/lib/poker/types";

// Map various card representations to our format
const RANK_MAP: Record<string, Rank> = {
  "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  "10": "T", "T": "T", "J": "J", "Q": "Q", "K": "K", "A": "A",
  TWO: "2", THREE: "3", FOUR: "4", FIVE: "5", SIX: "6", SEVEN: "7",
  EIGHT: "8", NINE: "9", TEN: "T", JACK: "J", QUEEN: "Q", KING: "K", ACE: "A",
};

const SUIT_MAP: Record<string, Suit> = {
  H: "hearts", HEARTS: "hearts", HEART: "hearts", "♥": "hearts",
  D: "diamonds", DIAMONDS: "diamonds", DIAMOND: "diamonds", "♦": "diamonds",
  C: "clubs", CLUBS: "clubs", CLUB: "clubs", "♣": "clubs",
  S: "spades", SPADES: "spades", SPADE: "spades", "♠": "spades",
};

interface CardJSON {
  rank: string;
  suit: string;
}

function parseCardFromJSON(cardData: CardJSON): Card | null {
  const rankKey = cardData.rank?.toString().toUpperCase();
  const suitKey = cardData.suit?.toString().toUpperCase();

  const rank = RANK_MAP[rankKey];
  const suit = SUIT_MAP[suitKey];

  if (rank && suit) {
    return { rank, suit };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Ensure proper data URL format
    let imageUrl = image;
    if (!image.startsWith("data:")) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low", // Use low detail mode for cost efficiency (85 tokens)
              },
            },
            {
              type: "text",
              text: `Identify all playing cards visible in this image.
Return ONLY a JSON array of objects with "rank" and "suit" properties.
Use these values:
- rank: "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"
- suit: "hearts", "diamonds", "clubs", "spades"

Example response: [{"rank": "A", "suit": "spades"}, {"rank": "K", "suit": "hearts"}]

If no cards are visible, return an empty array: []

IMPORTANT: Return ONLY the JSON array, no other text.`,
            },
          ],
        },
      ],
    });

    const responseText = response.choices[0]?.message?.content || "[]";

    // Parse the JSON response
    let cards: Card[] = [];

    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed: CardJSON[] = JSON.parse(jsonMatch[0]);
        cards = parsed
          .map(parseCardFromJSON)
          .filter((card): card is Card => card !== null);

        // Remove duplicates
        cards = cards.filter(
          (card, index, self) =>
            index === self.findIndex((c) => c.rank === card.rank && c.suit === card.suit)
        );
      }
    } catch (parseError) {
      console.error("Failed to parse card response:", responseText);
    }

    const result: DetectionResult = {
      cards,
      confidence: cards.length > 0 ? 0.85 : 0,
      error: cards.length === 0 ? "No cards detected in image" : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Card detection error:", error);
    return NextResponse.json(
      { cards: [], confidence: 0, error: "Failed to detect cards" },
      { status: 500 }
    );
  }
}
