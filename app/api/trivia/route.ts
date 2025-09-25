import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const requestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  history: z
    .array(
      z.object({
        question: z.string(),
        correctAnswer: z.string(),
        chosenAnswer: z.string(),
        wasCorrect: z.boolean(),
        difficulty: z.string().optional()
      })
    )
    .default([])
});

const triviaSchema = z.object({
  question: z.string().min(1),
  choices: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
  difficulty: z.string().optional(),
  explanation: z.string().optional()
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    const json = await request.json();
    payload = requestSchema.parse(json);
  } catch (error) {
    const message = error instanceof z.ZodError ? error.flatten().formErrors.join(" ") : "Invalid request.";
    return NextResponse.json({ error: message || "Invalid request." }, { status: 400 });
  }

  const historySummary = payload.history
    .map((entry, index) => {
      const difficulty = entry.difficulty ? ` (difficulty: ${entry.difficulty})` : "";
      const result = entry.wasCorrect ? "correct" : `wrong (answered ${entry.chosenAnswer})`;
      return `${index + 1}. ${entry.question}${difficulty} — ${result}`;
    })
    .join("\n");

  const prompt = `Create a fresh trivia question based on the user's chosen category. The next question must be slightly harder than previous ones and must not repeat earlier content. Respond strictly in JSON with the shape {"question": string, "choices": string[4], "answer": string, "difficulty"?: string, "explanation"?: string}. Ensure the correct answer is exactly one of the four choices.\n\nCategory: ${payload.category}\n\nPrevious questions (most recent last):\n${historySummary || "None yet"}`;

  try {
    console.log("Before OpenAI API call");
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a creative trivia master. Provide concise, factual multiple-choice questions. Each new question should be slightly more difficult than previous questions while remaining answerable."
        },
        { role: "user", content: prompt }
      ]
    });
    console.log("After OpenAI API call");

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("No response from language model");
    }
    console.log("Before JSON.parse");
    const parsed = triviaSchema.parse(JSON.parse(raw));
    console.log("After JSON.parse and schema parsing");

    if (!parsed.choices.includes(parsed.answer)) {
      throw new Error("Model response invalid: answer not among choices");
    }

    console.log("Returning successful response");
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Trivia generation error", error);
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? "Model response was invalid. Please try again."
            : error instanceof Error
            ? error.message
            : "Failed to generate trivia question."
      },
      { status: 500 }
    );
  }
}
