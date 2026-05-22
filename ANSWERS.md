# Answers

## 1. How to run

Install Node.js on the machine, clone or download this repo, then run this command from the repo root:

```powershell
git clone https://github.com/HuzaifaAhmedBari/Recall-FlashCard.git
cd Recall-FlashCard
```

```powershell
node server.js
```

Open `http://localhost:3000` in a browser.

## 2. Stack choice

I used plain Node.js with the built-in `http`, `fs`, `path`, and `crypto` modules, plus vanilla HTML, CSS, and JavaScript. This was a good fit because the project is small: it needs static file serving, a tiny JSON-backed API, and simple browser interactions.

A worse choice would have been a full framework stack like Express plus React for this scope. It would add dependency installation, build tooling, and more moving parts without making the core flashcard behavior meaningfully better.

## 3. One real edge case

The API rejects attempts to create a card without both a question and an answer in `server.js:106`.

Without that check, blank or incomplete cards could be saved to `data.json`. Those bad cards would then show up in the review queue with missing content, making the study flow confusing or broken.

## 4. AI usage

I used OpenAI Codex in this workspace to inspect the existing files, create the CSS and guide in debugging the script files.

Codex produced code edits for `server.js`, `public/index.html`, `public/client.js`, and `public/styles.css`. I changed one part of the AI-generated output: the completion icon was made plain text (`Done`) instead of the original emoji-style icon so the files stay simple ASCII and avoid encoding issues that appeared earlier in the HTML.

## 5. Honest gap

The weakest part is that `data.json` is a simple file database with no locking beyond writing through a temporary file. That is fine for a small local demo, but concurrent requests could still cause awkward behavior if multiple users used it at once.

With another day, I would either add SQlite database with WAL for concurrent reader and wrtiers to database or host a postgresSQL database through Supabase.