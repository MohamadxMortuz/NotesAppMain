// src/components/Loader.js
import React, { useEffect, useState } from 'react';
import './Loader.css';

function Loader() {
  const [slow, setSlow] = useState(false);

  // Free hosting puts the backend to sleep when idle; the first request can take up
  // to a minute. After a few seconds, say so instead of looking frozen.
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loader-overlay">
      <div className="loader-content">
        <h1 className="logo">
          <span className="pencil-icon">✏️</span> NOTE.me
        </h1>
        <div className="progress-bar">
          <div className="progress"></div>
        </div>
        <p className="loader-hint" aria-live="polite">
          {slow
            ? 'Waking up the server… the first login after a break can take up to a minute.'
            : ''}
        </p>
      </div>
    </div>
  );
}

export default Loader;
