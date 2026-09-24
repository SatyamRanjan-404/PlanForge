import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Detect if children contain any block-level React elements.
 * react-markdown sometimes wraps code blocks inside <p>, causing invalid HTML.
 * When this happens we render a <div> instead of <p> to pass DOM validation.
 */
const hasBlockChild = (children) => {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) return false;
    const blockTags = ['div', 'pre', 'ul', 'ol', 'table', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'];
    return blockTags.includes(child.type) || (typeof child.type === 'function');
  });
};

/**
 * ChatGPT-style Markdown Renderer Component.
 * Parses raw Markdown into richly formatted HTML: headings, code blocks,
 * tables, lists, bold/italics, blockquotes, and inline code.
 */
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="chatgpt-markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Safe <p> — degrades to <div> when it wraps block elements
          p({ children }) {
            if (hasBlockChild(children)) {
              return <div className="chatgpt-p">{children}</div>;
            }
            return <p className="chatgpt-p">{children}</p>;
          },

          // Code — fenced blocks rendered as dark panels, inline as chips
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (!inline) {
              return (
                <div className="chatgpt-code-block">
                  {language && <div className="code-block-header">{language}</div>}
                  <pre className="code-block-body">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="chatgpt-inline-code" {...props}>
                {children}
              </code>
            );
          },

          table({ children }) {
            return (
              <div className="chatgpt-table-wrapper">
                <table className="chatgpt-table">{children}</table>
              </div>
            );
          },

          h1({ children }) { return <h1 className="chatgpt-h1">{children}</h1>; },
          h2({ children }) { return <h2 className="chatgpt-h2">{children}</h2>; },
          h3({ children }) { return <h3 className="chatgpt-h3">{children}</h3>; },

          blockquote({ children }) {
            return <blockquote className="chatgpt-blockquote">{children}</blockquote>;
          },

          ul({ children }) { return <ul className="chatgpt-ul">{children}</ul>; },
          ol({ children }) { return <ol className="chatgpt-ol">{children}</ol>; },
          li({ children })  { return <li className="chatgpt-li">{children}</li>; },
          hr()              { return <hr className="chatgpt-hr" />; },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
