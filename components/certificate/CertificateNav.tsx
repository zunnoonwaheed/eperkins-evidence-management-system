'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CertificateNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav>
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="brand-mark">✓</span>
          Certificate System
        </Link>
        <button
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          aria-label="Menu"
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link href="/#what">What it does</Link>
          <Link href="/#how">How it works</Link>
        </div>
        <Link href="/#contact" className="nav-cta">Get in touch</Link>
      </div>
    </nav>
  );
}
