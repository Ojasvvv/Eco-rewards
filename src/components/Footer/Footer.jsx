import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Footer.css';

const Footer = () => {
  const { isDark } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [floatingIcons, setFloatingIcons] = useState([]);

  // Track mouse position for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isHovering) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovering]);

  // Generate floating eco icons
  useEffect(() => {
    const icons = ['🌱', '♻️', '🌍', '🌿', '💚', '🍃'];
    const randomIcons = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4
    }));
    setFloatingIcons(randomIcons);
  }, []);

  const handleEmailClick = () => {
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'email-ripple';
    document.querySelector('.footer-contact-btn').appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);

    // Copy email and show notification
    navigator.clipboard.writeText('teamapatheia@gmail.com');
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'footer-toast';
    toast.textContent = '✓ Email copied to clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  return (
    <footer className={`eco-footer ${isDark ? 'dark' : 'light'}`}>
      {/* Animated background gradient */}
      <div className="footer-gradient-bg"></div>
      
      {/* Floating eco icons */}
      <div className="floating-icons-container">
        {floatingIcons.map((item) => (
          <span
            key={item.id}
            className="floating-icon"
            style={{
              left: `${item.left}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          >
            {item.icon}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div className="footer-content">
        {/* Heart with team name */}
        <div 
          className="footer-heart-section"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="footer-made-with">
            <span className="footer-text">Made with</span>
            <span className="footer-heart">
              <span className="heart-beat">💚</span>
              <span className="heart-particles">
                <span className="particle">✨</span>
                <span className="particle">✨</span>
                <span className="particle">✨</span>
              </span>
            </span>
            <span className="footer-text">by</span>
          </div>
          <div className="footer-team-name">
            <span className="team-text">Team</span>
            <span className="apatheia-text">Apatheia</span>
          </div>
        </div>

        {/* Interactive contact button */}
        <div className="footer-actions">
          <a
            href="mailto:teamapatheia@gmail.com"
            className="footer-contact-btn"
            onClick={(e) => {
              e.preventDefault();
              handleEmailClick();
            }}
          >
            <span className="btn-icon">📧</span>
            <span className="btn-text">Contact Us</span>
            <span className="btn-hover-effect"></span>
            <div className="btn-sparkles">
              <span className="sparkle">✦</span>
              <span className="sparkle">✦</span>
              <span className="sparkle">✦</span>
            </div>
          </a>

          <a
            href="https://github.com/Ojasvvv/Eco-rewards"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-github-btn"
          >
            <span className="btn-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </span>
            <span className="btn-text">Star on GitHub</span>
            <span className="github-stars">⭐</span>
          </a>
        </div>

        {/* Eco tagline */}
        <div className="footer-tagline">
          <span className="tagline-icon">🌍</span>
          <span className="tagline-text">Making the world cleaner, one reward at a time</span>
          <span className="tagline-icon">♻️</span>
        </div>

        {/* Copyright with animation */}
        <div className="footer-copyright">
          <span className="copyright-year">{new Date().getFullYear()}</span>
          <span className="copyright-separator">•</span>
          <span className="copyright-text">EcoRewards</span>
          <span className="copyright-separator">•</span>
          <span className="copyright-winner">🏆 GeeksForGeeks Hackathon Winner</span>
        </div>
      </div>

      {/* Interactive wave effect */}
      <div className="footer-waves">
        <svg className="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
          <defs>
            <path id="wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g className="wave-parallax">
            <use href="#wave" x="48" y="0" fill="rgba(16, 185, 129, 0.1)" />
            <use href="#wave" x="48" y="3" fill="rgba(16, 185, 129, 0.2)" />
            <use href="#wave" x="48" y="5" fill="rgba(16, 185, 129, 0.3)" />
            <use href="#wave" x="48" y="7" fill="rgba(16, 185, 129, 0.5)" />
          </g>
        </svg>
      </div>
    </footer>
  );
};

export default Footer;

