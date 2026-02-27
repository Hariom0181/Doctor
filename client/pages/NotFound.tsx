import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MoveLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nf-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }
        .nf-card {
          text-align: center;
          max-width: 500px;
          animation: fadeIn 0.8s ease-out;
        }
        .nf-404 {
          font-family: 'DM Serif Display', serif;
          font-size: 8rem;
          font-weight: 700;
          line-height: 1;
          color: #0B4F6C;
          margin-bottom: 1rem;
          position: relative;
          display: inline-block;
          animation: float 4s ease-in-out infinite;
        }
        .nf-icon-wrap {
          color: #0B8A6C;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }
        .nf-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          color: #1e293b;
          margin-bottom: 1rem;
        }
        .nf-text {
          color: #64748b;
          font-size: 1.1rem;
          margin-bottom: 2.5rem;
        }
        .nf-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #0B4F6C;
          color: white;
          padding: 12px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(11, 79, 108, 0.2);
        }
        .nf-link:hover {
          background: #093D56;
          transform: translateX(-5px);
          box-shadow: 0 6px 20px rgba(11, 79, 108, 0.3);
        }
      `}</style>

      <div className="nf-container">
        <div className="nf-card">
          <div className="nf-icon-wrap">
            <AlertCircle size={64} strokeWidth={1.5} />
          </div>
          
          <h1 className="nf-404">404</h1>
          
          <h2 className="nf-title">Lost in the System?</h2>
          
          <p className="nf-text">
            The page you are looking for—<code style={{background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9rem'}}>{location.pathname}</code>—doesn't exist or has been moved.
          </p>

          <Link to="/" className="nf-link">
            <MoveLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;