import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function Flashcards({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards.length) return <p className="muted">No flashcards.</p>;
  const card = cards[index];

  const go = (step) => {
    setFlipped(false);
    setIndex((i) => (i + step + cards.length) % cards.length);
  };

  return (
    <div>
      <div className="flashcard" onClick={() => setFlipped(!flipped)}>
        <small className="muted">{flipped ? 'Answer' : 'Question'} (click to flip)</small>
        <p className="flash-text">{flipped ? card.answer : card.question}</p>
      </div>
      <div className="row">
        <button className="btn btn-small" onClick={() => go(-1)}>Previous</button>
        <span className="muted">{index + 1} / {cards.length}</span>
        <button className="btn btn-small" onClick={() => go(1)}>Next</button>
      </div>
    </div>
  );
}

function Quiz({ questions }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  if (!questions.length) return <p className="muted">No quiz questions.</p>;

  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div>
      {questions.map((q, i) => (
        <div key={i} className="quiz-q">
          <p><strong>{i + 1}. {q.question}</strong></p>
          {q.options.map((opt) => {
            let cls = 'option';
            if (answers[i] === opt) cls += ' selected';
            if (submitted && opt === q.answer) cls += ' correct';
            if (submitted && answers[i] === opt && opt !== q.answer) cls += ' wrong';
            return (
              <label key={opt} className={cls}>
                <input
                  type="radio"
                  name={`q${i}`}
                  disabled={submitted}
                  checked={answers[i] === opt}
                  onChange={() => setAnswers({ ...answers, [i]: opt })}
                />
                {opt}
              </label>
            );
          })}
          {submitted && answers[i] !== q.answer && q.topic && (
            <p className="muted small">Revise topic: {q.topic}</p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          className="btn"
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => setSubmitted(true)}
        >
          Submit quiz
        </button>
      ) : (
        <div className="card">
          <h3>Score: {score} / {questions.length}</h3>
          <button className="btn" onClick={reset}>Try again</button>
        </div>
      )}
    </div>
  );
}

export default function DocumentView() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/documents/${id}`);
        setDoc(res.data);
      } catch (err) {
        setError('Could not load this document');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const generate = async () => {
    setError('');
    setGenerating(true);
    try {
      const res = await api.post(`/documents/${id}/generate`);
      setDoc((d) => ({ ...d, ...res.data }));
      setTab('summary');
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed, please try again');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <p className="muted">Loading...</p>;
  if (!doc) return <p className="error">{error || 'Not found'}</p>;

  const ready = doc.summary && doc.summary.length > 0;

  return (
    <div>
      <Link to="/">&larr; Back</Link>
      <h2>{doc.title}</h2>

      {error && <p className="error">{error}</p>}

      {!ready && (
        <div className="card">
          <p>Create a summary, flashcards and a quiz from these notes.</p>
          <button className="btn" onClick={generate} disabled={generating}>
            {generating ? 'AI is working, about 10-20 seconds...' : 'Generate study material'}
          </button>
        </div>
      )}

      {ready && (
        <>
          <div className="tabs">
            {['summary', 'flashcards', 'quiz'].map((t) => (
              <button
                key={t}
                className={tab === t ? 'tab active' : 'tab'}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
            <button className="tab" onClick={generate} disabled={generating}>
              {generating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>

          <div className="card">
            {tab === 'summary' && <p style={{ lineHeight: 1.7 }}>{doc.summary}</p>}
            {tab === 'flashcards' && <Flashcards cards={doc.flashcards || []} />}
            {tab === 'quiz' && <Quiz questions={doc.quiz || []} />}
          </div>
        </>
      )}
    </div>
  );
}