import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty" data-testid="notfound-page" style={{ marginTop: 40 }}>
      <div className="emoji">🍽️</div>
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist.</p>
      <Link className="btn" to="/recipes">Back to recipes</Link>
    </div>
  );
}
