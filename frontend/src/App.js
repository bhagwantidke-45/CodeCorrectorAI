

import { useState, useEffect, useRef } from 'react';
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";

import './App.css';
import axios from 'axios';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

function App() {
  const [count, setCount] = useState(0);
  const [code, setCode] = useState(`function sum() {\n  return 1 + 1\n}`);
  const [review, setReview] = useState("");
  const [editorFocused, setEditorFocused] = useState(false);
  const editorRef = useRef();

  useEffect(() => {
    prism.highlightAll();
  }, []);

  async function reviewCode() {
    const response = await axios.post('http://localhost:3002/ai/get-response', { code });
    setReview(response.data.response);
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <img src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" alt="Logo" className="navbar-avatar" />
          CodeCorrector
        </div>
        <ul className="navbar-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">Practice</a></li>
          <li><a href="#">About</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <h1>Welcome to CodeCorrector</h1>
          <p>Get instant code reviews and corrections powered by AI. Practice, learn, and improve your coding skills!</p>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="main-content">
        <div className={`editor-section card-container code-editor-container${editorFocused ? ' focused' : ''}`}>
          <div className="code code-editor-auto">
            <div className="code-header">
              <span role="img" aria-label="editor" style={{marginRight: '8px'}}>💻</span>
              <span>Code Editor</span>
            </div>
            <Editor
              ref={editorRef}
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                minHeight: "100px",
                height: "auto",
                overflow: "visible",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
              onFocus={() => setEditorFocused(true)}
              onBlur={() => setEditorFocused(false)}
            />
          </div>
          <div onClick={reviewCode} className="review">
            <span role="img" aria-label="review" style={{marginRight: '8px'}}>📝</span>
            Review
          </div>
        </div>
        <div className="output-section card-container">
          <div className="output-header">
            <span role="img" aria-label="output" style={{marginRight: '8px'}}>✅</span>
            Code Review Output
          </div>
          <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
        </div>
      </main>

      {/* Sample Content Cards Section */}
      <section className="cards-section">
        <h2>Practice Problems</h2>
        <div className="cards-grid">
          <div className="card">
            <h3>Array & Strings</h3>
            <p>Practice coding problems on arrays and strings.</p>
            <button>Explore</button>
          </div>
          <div className="card">
            <h3>Dynamic Programming</h3>
            <p>Challenge yourself with DP problems.</p>
            <button>Explore</button>
          </div>
          <div className="card">
            <h3>Trees & Graphs</h3>
            <p>Learn and solve tree/graph problems.</p>
            <button>Explore</button>
          </div>
        </div>
      </section>
    </>
  );
}
export default App