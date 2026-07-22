import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export function StreamedMarkdown({ content, isNew }: { content: string; isNew?: boolean }) {
  const [displayed, setDisplayed] = useState(isNew ? '' : content);

  useEffect(() => {
    if (!isNew) {
      setDisplayed(content);
      return;
    }

    let index = 0;
    const chunkSize = 2; // chars per tick
    const interval = setInterval(() => {
      index += chunkSize;
      if (index >= content.length) {
        setDisplayed(content);
        clearInterval(interval);
      } else {
        setDisplayed(content.slice(0, index));
      }
    }, 10); // fast stream

    return () => clearInterval(interval);
  }, [content, isNew]);

  return <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{displayed.replace(/<!--DISCIPLINE_JSON-->[\s\S]*?(?:<!--\/DISCIPLINE_JSON-->|$)/g, '').trim()}</ReactMarkdown></div>;
}
