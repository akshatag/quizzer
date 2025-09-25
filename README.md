# Quizzer

Quizzer is a minimal AI-powered trivia game built with Next.js, Tailwind CSS, and shadcn-inspired UI components. Enter a category, and the app will ask increasingly difficult questions sourced from OpenAI GPT-5. Correct answers are rewarded exponentially—2 points for the first question, 4 for the next, and so on—until you miss a question and the streak resets.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `OPENAI_API_KEY` environment variable.
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser and start quizzing yourself.

## Environment Variables

- `OPENAI_API_KEY`: Required for generating questions via the OpenAI API.

## Scripts

- `npm run dev` – Start the development server.
- `npm run build` – Build the production bundle.
- `npm run start` – Run the production server.
- `npm run lint` – Lint the project with ESLint.
