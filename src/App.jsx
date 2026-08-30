import { useState } from "react";
import "./App.css";

function App() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!notes.trim()) {
      setStatus("Please enter some study notes before generating.");
      return;
    }

    if (notes.trim().length < 30) {
      setStatus("Please enter at least 30 characters of study notes.");
      return;
    }

    setLoading(true);
    setStatus("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate study guide.");
      }

      setResult(data);
      setStatus("");
    } catch (error) {
      setStatus(
        error.message ||
        "Unable to generate your study guide. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) {
      return;
    }

    const text = `
SUMMARY

${result.summary}

KEY POINTS

${result.keyPoints.map((point) => `• ${point}`).join("\n")}

IMPORTANT TERMS

${result.terms
        .map((item) => `${item.term}: ${item.definition}`)
        .join("\n")}

PRACTICE QUESTIONS

${result.questions
        .map((question, index) => `${index + 1}. ${question}`)
        .join("\n")}
`;

    try {
      await navigator.clipboard.writeText(text);

      setStatus("Study guide copied to clipboard.");
    } catch {
      setStatus("Unable to copy the study guide.");
    }
  };

  const handleReset = () => {
    setNotes("");
    setResult(null);
    setStatus("");
  };

  return (
    <div className="app">
      <header className="site-header">
        <div className="container">
          <a href="/" className="logo" aria-label="StudySpark AI home">
            StudySpark <span>AI</span>
          </a>

          <p className="header-tagline">AI-powered study companion</p>
        </div>
      </header>

      <main className="container main-content">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">STUDY SMARTER</p>

          <h1 id="page-title">
            Turn messy notes into a{" "}
            <span>clear study guide.</span>
          </h1>

          <p className="hero-description">
            Paste your study notes and StudySpark AI will transform them into a
            concise summary, key points, important terms, and practice
            questions.
          </p>
        </section>

        <section className="workspace" aria-label="Study guide generator">
          <form className="input-card" onSubmit={handleSubmit}>
            <div className="card-heading">
              <div>
                <p className="step-label">STEP 01</p>
                <h2>Add your notes</h2>
              </div>

              <span className="character-count" aria-live="polite">
                {notes.length} characters
              </span>
            </div>

            <label htmlFor="notes" className="input-label">
              Study notes
            </label>

            <textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);

                if (status) {
                  setStatus("");
                }
              }}
              placeholder="Paste lecture notes, textbook notes, revision material..."
              rows="12"
              maxLength="12000"
              aria-describedby="notes-help"
              disabled={loading}
            />

            <p id="notes-help" className="helper-text">
              Minimum 30 characters. Do not include sensitive personal
              information.
            </p>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Generating study guide..." : "Generate Study Guide"}
            </button>

            {status && (
              <div className="status-message" role="status" aria-live="polite">
                {status}
              </div>
            )}
          </form>

          <section
            className="result-card"
            aria-labelledby="results-title"
            aria-live="polite"
            aria-busy={loading}
          >
            <div className="card-heading">
              <div>
                <p className="step-label">STEP 02</p>
                <h2 id="results-title">Your study guide</h2>
              </div>

              {result && <span className="ready-badge">Ready</span>}
            </div>

            {loading && (
              <div className="state-container">
                <div className="loader" aria-hidden="true"></div>

                <h3>Analyzing your notes...</h3>

                <p>Creating a structured study guide.</p>
              </div>
            )}

            {!loading && !result && (
              <div className="state-container empty-state">
                <div className="empty-icon" aria-hidden="true">
                  ✦
                </div>

                <h3>Your results will appear here</h3>

                <p>Add your notes and generate a guide to get started.</p>
              </div>
            )}

            {!loading && result && (
              <div className="study-guide">
                <article>
                  <h3>Summary</h3>

                  <p>{result.summary}</p>
                </article>

                <article>
                  <h3>Key Points</h3>

                  {result.keyPoints?.length > 0 ? (
                    <ul>
                      {result.keyPoints.map((point, index) => (
                        <li key={`${point}-${index}`}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No key points were generated.</p>
                  )}
                </article>

                <article>
                  <h3>Important Terms</h3>

                  {result.terms?.length > 0 ? (
                    <dl>
                      {result.terms.map((item, index) => (
                        <div
                          className="term"
                          key={`${item.term}-${index}`}
                        >
                          <dt>{item.term}</dt>

                          <dd>{item.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p>No important terms were found.</p>
                  )}
                </article>

                <article>
                  <h3>Practice Questions</h3>

                  {result.questions?.length > 0 ? (
                    <ol>
                      {result.questions.map((question, index) => (
                        <li key={`${question}-${index}`}>{question}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>No practice questions were generated.</p>
                  )}
                </article>

                <div className="result-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCopy}
                  >
                    Copy Results
                  </button>

                  <button
                    type="button"
                    className="text-button"
                    onClick={handleReset}
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </section>
        </section>
      </main>

      <footer>
        <div className="container">
          <p>
            StudySpark AI · AI-generated study material should be reviewed for
            accuracy.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;