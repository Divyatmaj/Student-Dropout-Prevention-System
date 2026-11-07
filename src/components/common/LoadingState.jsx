import React from 'react';

export default function LoadingState({ message = 'Loading institutional dashboard records...' }) {
  return (
    <div className="state-container">
      <div className="spinner" />
      <h3 className="state-title">Retrieving Data</h3>
      <p className="state-description">{message}</p>
    </div>
  );
}
