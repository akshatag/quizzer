"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TriviaQuestion {
  question: string;
  choices: string[];
  answer: string;
  difficulty?: string;
  explanation?: string;
}

interface TriviaHistoryEntry {
  question: string;
  correctAnswer: string;
  chosenAnswer: string;
  wasCorrect: boolean;
  difficulty?: string;
}

async function requestQuestion(category: string, history: TriviaHistoryEntry[]) {
  const response = await fetch("/api/trivia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ category, history })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    const message = payload && typeof payload === "object" && "error" in payload ? payload.error : undefined;
    throw new Error((message as string | undefined) ?? "Unable to fetch trivia question");
  }

  const data = payload as TriviaQuestion;
  return data;
}

export default function HomePage() {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "finished">("idle");
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [history, setHistory] = useState<TriviaHistoryEntry[]>([]);
  const [score, setScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const pointsForCurrentQuestion = useMemo(() => 2 ** (history.length + 1), [history.length]);
  const questionCounter = isPlaying ? history.length + 1 : history.length;

  const startGame = useCallback(async () => {
    if (!category.trim()) {
      setErrorMessage("Please enter a category to get started.");
      return;
    }

    setErrorMessage(null);
    setStatus("loading");
    setScore(0);
    setHistory([]);
    setSelectedChoice(null);

    try {
      const nextQuestion = await requestQuestion(category, []);
      setCurrentQuestion(nextQuestion);
      setStatus("playing");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start game.");
      setStatus("idle");
    }
  }, [category]);

  const loadNextQuestion = useCallback(
    async (historyOverride?: TriviaHistoryEntry[]) => {
      if (!category.trim()) {
        return;
      }

      setStatus("loading");
      setSelectedChoice(null);

    try {
      const effectiveHistory = historyOverride ?? history;
      const nextQuestion = await requestQuestion(category, effectiveHistory);
      setCurrentQuestion(nextQuestion);
      setStatus("playing");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load the next question.");
      setCurrentQuestion(null);
      setStatus("finished");
    }
    },
    [category, history]
  );

  const handleChoice = useCallback(
    async (choice: string) => {
      if (!currentQuestion || isLoading) {
        return;
      }

      setSelectedChoice(choice);
      const wasCorrect = choice === currentQuestion.answer;
      const entry: TriviaHistoryEntry = {
        question: currentQuestion.question,
        correctAnswer: currentQuestion.answer,
        chosenAnswer: choice,
        wasCorrect,
        difficulty: currentQuestion.difficulty
      };

      const nextHistory = [...history, entry];
      setHistory(nextHistory);

      if (wasCorrect) {
        const earned = pointsForCurrentQuestion;
        setScore((prev) => prev + earned);

        await loadNextQuestion(nextHistory);
      } else {
        setErrorMessage(`Game over! The correct answer was ${currentQuestion.answer}.`);
        setStatus("finished");
      }
    },
    [currentQuestion, history, isLoading, loadNextQuestion, pointsForCurrentQuestion]
  );

  const resetGame = useCallback(() => {
    setStatus("idle");
    setCurrentQuestion(null);
    setHistory([]);
    setScore(0);
    setSelectedChoice(null);
    setErrorMessage(null);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quizzer</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter a trivia category and challenge yourself with increasingly difficult questions powered by GPT-5.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Science, movies, renaissance art... you decide!"
                disabled={isLoading || isPlaying}
              />
              <Button onClick={startGame} disabled={isLoading || isPlaying} className="sm:w-40">
                {isLoading && !isPlaying ? "Loading..." : "Start"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">Score:</span> {score}
              </div>
              <div>
                <span className="font-semibold text-foreground">Question:</span> {questionCounter}
              </div>
              {isPlaying && (
                <div>
                  <span className="font-semibold text-foreground">Worth:</span> {pointsForCurrentQuestion} pts
                </div>
              )}
            </div>
            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
          </CardContent>
        </Card>

        {currentQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
              {currentQuestion.difficulty && (
                <p className="text-sm text-muted-foreground capitalize">Difficulty: {currentQuestion.difficulty}</p>
              )}
            </CardHeader>
            <CardContent className="grid gap-3">
              {currentQuestion.choices.map((choice) => {
                const isSelected = selectedChoice === choice;
                const isCorrect = currentQuestion.answer === choice;
                const showState = status === "finished" || isLoading;

                return (
                  <Button
                    key={choice}
                    variant="outline"
                    className={
                      showState
                        ? isCorrect
                          ? "border-green-500 text-green-600"
                          : isSelected
                          ? "border-red-400 text-red-600"
                          : undefined
                        : undefined
                    }
                    disabled={isLoading || status !== "playing"}
                    onClick={() => handleChoice(choice)}
                  >
                    {choice}
                  </Button>
                );
              })}
              {currentQuestion.explanation && status !== "playing" && (
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              )}
            </CardContent>
          </Card>
        )}

        {status === "finished" && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-lg font-semibold text-foreground">Final score: {score}</p>
              <p className="text-sm text-muted-foreground">
                Ready for another go? Pick a category and try to beat your streak.
              </p>
            </div>
            <Button onClick={resetGame}>Play again</Button>
          </div>
        )}
      </div>
    </main>
  );
}
