

import { useState, useEffect, useRef } from 'react';
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";

import './App.css';
import axios from 'axios';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

function App() {
  const [code, setCode] = useState(`# Enter your Python code here\ndef calculate_sum(numbers):\n    total = 0\n    for num in numbers:\n        total += num\n    return total\n\nresult = calculate_sum([1, 2, 3, 4, 5])\nprint("Sum:", result)`);
  const [review, setReview] = useState("");
  const [editorFocused, setEditorFocused] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const editorRef = useRef();
  const editorAreaRef = useRef();
  const [userInfo, setUserInfo] = useState({ name: '', email: '', mobile: '' });

  useEffect(() => {
    prism.highlightAll();
    try {
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');
      const name = params.get('name');
      const mobile = params.get('mobile');
      if (email) {
        setIsLoggedIn(true);
        setUserInfo({ name: name || email.split('@')[0], email, mobile: mobile || '' });
        if (window.history && window.history.replaceState) {
          const url = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, url);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  async function reviewCode() {
    try {
      const response = await axios.post('http://localhost:3002/ai/get-response', { code })
      setReview(response.data.response || 'No response');
    } catch (e) {
      setReview('Error contacting analysis service.');
    }
  }

  const scrollToEditor = () => {
    setShowEditor(true);
    setTimeout(() => {
      editorAreaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-icon">&lt;/&gt;</div>
            <div className="brand-text">
              <div className="brand-title">CodeCorrector</div>
              <div className="brand-sub">AI-Powered Analysis</div>
            </div>
          </div>

          <nav className="topnav">
            <a href="#">Editor</a>
            <a href="#">History</a>
            <a href="#">Documentation</a>
          </nav>

          <div className="top-actions">
            <button className="link-btn" onClick={() => window.location.href = '/login.html'}>Sign In</button>
            <button className="cta-btn">Get Started</button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge">AI-Powered Code Analysis</div>
            <h1>Fix Your Code<br/><span className="accent">Instantly with AI</span></h1>
            <p className="hero-sub">Detect syntax errors, logical bugs, and runtime issues. Get intelligent corrections, optimization suggestions, and complexity analysis — all in seconds.</p>
            <div className="hero-ctas">
              <button className="primary" onClick={scrollToEditor}>Start Analyzing →</button>
              <button className="outline">View Documentation</button>
            </div>
          </div>

          <div className="hero-decorations" aria-hidden="true">
            <span className="deco deco-left">&lt;/&gt;</span>
            <span className="deco deco-spark">✨</span>
            <span className="deco deco-flash">⚡</span>
            <span className="deco deco-right">🔹</span>
          </div>
        </div>
      </section>
      <section>
         <div className="hero-stats">
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-num">10+</div><div className="stat-label">Languages Supported</div></div>
            <div className="stat-card"><div className="stat-num">AI</div><div className="stat-label">Powered Analysis</div></div>
            <div className="stat-card"><div className="stat-num">Instant</div><div className="stat-label">Code Corrections</div></div>
          </div>
        </div>
      </section>

      {showEditor && (
      <main className="editor-area" ref={editorAreaRef}>
        <div className={`editor-panel ${editorFocused ? 'focused' : ''}`}>
          <div className="editor-toolbar">
            <select className="lang-select"><option>Python</option><option>JavaScript</option></select>
            <div className="editor-actions">
              <button title="Analyze" className="analyze-btn" onClick={reviewCode}>Analyze Code</button>
            </div>
          </div>

          <div className="editor-wrapper">
            <Editor
              ref={editorRef}
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => prism.highlight(code, prism.languages.python || prism.languages.javascript, "python")}
              padding={12}
              textareaId="code-editor"
              style={{
                fontFamily: 'Fira Code, monospace',
                fontSize: 14,
                minHeight: 360,
                color: 'var(--fg)'
              }}
              onFocus={() => setEditorFocused(true)}
              onBlur={() => setEditorFocused(false)}
            />
          </div>
        </div>

        <aside className="result-panel">
          <div className="result-empty">
            <div className="result-icon">&lt;/&gt;</div>
            <h3>Ready to Analyze</h3>
            <p>Write or paste your code in the editor and click "Analyze Code" to detect errors, get corrections, and receive optimization suggestions.</p>
          </div>
          <div className="result-output">
            {review ? <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown> : null}
          </div>
        </aside>
      </main>
      )}

      <section className="features-section">
        <div className="features-header">
          <h2>Powerful Features for <span className="accent">Better Code</span></h2>
          <p>Everything you need to write cleaner, more efficient, and error-free code.</p>
        </div>
        <div className="features-grid">
          <div className="feature"> <div className="ficon">⚠️</div> <h4>Error Detection</h4> <p>Automatically detect syntax, logical, and runtime errors with precise line-by-line analysis.</p> </div>
          <div className="feature highlight"> <div className="ficon">&lt;/&gt;</div> <h4>AI Code Correction</h4> <p>Get intelligent code corrections with detailed explanations for each fix applied.</p> </div>
          <div className="feature"> <div className="ficon">💡</div> <h4>Smart Suggestions</h4> <p>Receive optimization tips, best practices, and cleaner code format recommendations.</p> </div>
          <div className="feature"> <div className="ficon">⏱️</div> <h4>Complexity Analysis</h4> <p>Understand your code's time and space complexity with detailed explanations.</p> </div>
          <div className="feature"> <div className="ficon">⚡</div> <h4>Multi-Language Support</h4> <p>Support for Python, JavaScript, TypeScript, Java, C++, Go, Rust, and more.</p> </div>
          <div className="feature"> <div className="ficon">⏳</div> <h4>Code History</h4> <p>Track all your submissions and improvements over time with detailed reports.</p> </div>
          <div className="feature"> <div className="ficon">📥</div> <h4>Export Options</h4> <p>Download corrected code and analysis reports in multiple formats.</p> </div>
          <div className="feature"> <div className="ficon">🔒</div> <h4>Secure & Private</h4> <p>Your code is analyzed securely and never stored without your permission.</p> </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon small">&lt;/&gt;</div>
            <div>
              <div className="brand-title">CodeCorrector</div>
              <div className="muted">AI-powered code analysis and correction tool for developers.</div>
            </div>
          </div>
          <div className="footer-cols">
            <div>
              <h5>Product</h5>
              <ul><li>Code Editor</li><li>History</li><li>Documentation</li><li>API</li></ul>
            </div>
            <div>
              <h5>Support</h5>
              <ul><li>Help Center</li><li>Contact Us</li><li>Report Bug</li><li>Feedback</li></ul>
            </div>
            <div>
              <h5>Legal</h5>
              <ul><li>Privacy Policy</li><li>Terms of Service</li><li>Cookie Policy</li></ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© 2024 CodeCorrector. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default App;
/*

import { useState, useEffect, useRef } from 'react';
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";

import './App.css';
import axios from 'axios';

const prismLangMap = {
  python: prism.languages.python,
  java: prism.languages.java,
  javascript: prism.languages.javascript,
  typescript: prism.languages.typescript,
  c: prism.languages.c,
  cpp: prism.languages.cpp,
  csharp: prism.languages.csharp,
  go: prism.languages.go,
  rust: prism.languages.rust,
  php: prism.languages.php
};

function App() {
  const [language, setLanguage] = useState("python");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState(`# Enter your Python code here
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

result = calculate_sum([1, 2, 3, 4, 5])
print("Sum:", result)
  `);

  const [editorFocused, setEditorFocused] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const editorRef = useRef();
  const editorAreaRef = useRef();

  useEffect(() => {
    prism.highlightAll();
  }, []);

  async function reviewCode() {
    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/analyze",
        { code, language }
      );

      const data = response.data;

setAnalysis({
  score: data.score ?? data.overallScore ?? 0,
  summary: {
    errors:
      data.summary?.errors ??
      data.errors?.length ??
      0,
    suggestions:
      data.summary?.suggestions ??
      data.suggestions?.length ??
      data.issues?.length ??
      0
  },
  issues: data.issues ?? data.suggestions ?? [],
  correctedCode: data.correctedCode ?? code,
  complexity: data.complexity ?? { time: "Unknown", space: "Unknown" },
  language: data.language ?? language
});

    } catch (error) {
      console.error(error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  function applyAllFixes() {
    if (analysis?.correctedCode) {
      setCode(analysis.correctedCode);
    }
  }

  const scrollToEditor = () => {
    setShowEditor(true);
    setTimeout(() => {
      editorAreaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="app-root">
    }
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-icon">&lt;/&gt;</div>
            <div className="brand-text">
              <div className="brand-title">CodeCorrector</div>
              <div className="brand-sub">AI-Powered Analysis</div>
            </div>
          </div>

          <nav className="topnav">
            <a href="#">Editor</a>
            <a href="#">History</a>
            <a href="#">Documentation</a>
          </nav>

          <div className="top-actions">
            <button className="cta-btn">Get Started</button>
          </div>
        </div>
      </header>

      }
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge">AI-Powered Code Analysis</div>
            <h1>
              Fix Your Code <br />
              <span className="accent">Instantly with AI</span>
            </h1>
            <p className="hero-sub">
              Detect syntax errors, logical bugs, and runtime issues.
            </p>
            <button className="primary" onClick={scrollToEditor}>
              Start Analyzing →
            </button>
          </div>
        </div>
      </section>

    
      {showEditor && (
        <main className="editor-area" ref={editorAreaRef}>
          <div className={`editor-panel ${editorFocused ? 'focused' : ''}`}>
            <div className="editor-toolbar">
              <select
                className="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
              </select>

              <div className="editor-actions">
                <button
                  className="analyze-btn"
                  onClick={reviewCode}
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Analyze Code"}
                </button>

                {analysis && (
                  <button className="apply-btn" onClick={applyAllFixes}>
                    Apply All Fixes
                  </button>
                )}
              </div>
            </div>

            <div className="editor-wrapper">
              <Editor
                ref={editorRef}
                value={code}
                onValueChange={setCode}
                highlight={(code) =>
                  prism.highlight(
                    code,
                    prismLangMap[language] || prism.languages.javascript,
                    language
                  )
                }
                padding={12}
                style={{
                  fontFamily: 'Fira Code, monospace',
                  fontSize: 14,
                  minHeight: 360
                }}
                onFocus={() => setEditorFocused(true)}
                onBlur={() => setEditorFocused(false)}
              />
            </div>
          </div>

          <aside className="result-panel">
            {!analysis && (
              <div className="result-empty">
                <h3>Ready to Analyze</h3>
                <p>Paste code and click “Analyze Code”.</p>
              </div>
            )}

            {analysis && (
              <div className="result-output">
                <h2>Code Quality Score {analysis.score}%</h2>
                <p>
                 {analysis?.summary?.errors ?? 0} errors •{" "}
{analysis?.summary?.suggestions ?? 0} suggestions

                </p>

                {(analysis.issues || []).map((item, i) => (

                  <div key={i} className={`issue ${item.priority}`}>
                    <strong>{item.category}</strong>
                    <span className="badge">{item.priority}</span>
                    <p>{item.message}</p>
                  </div>
                ))}

                <h3>Corrected Code</h3>
                <pre><code>{analysis.correctedCode}</code></pre>

                <h3>Complexity</h3>
                <p>Time: {analysis.complexity.time}</p>
                <p>Space: {analysis.complexity.space}</p>
              </div>
            )}
          </aside>
        </main>
      )}

      {/* ---------- FOOTER ---------- 
      <footer className="site-footer">
        <div className="footer-bottom">
          © 2024 CodeCorrector. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
*/