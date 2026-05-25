import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export const NotFound: React.FC = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-code">404</div>
      <h2 className="notfound-title">Lost in Space</h2>
      <p className="notfound-desc">
        The page you are looking for does not exist or has been moved. Use the button below to
        navigate safely back to base.
      </p>
      <Link to="/" className="btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
        Back to Home
      </Link>
    </div>
  );
};
export default NotFound;
