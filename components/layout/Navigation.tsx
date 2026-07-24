'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
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
          id="hamburger"
          aria-label="Menu"
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <a href="#what" onClick={closeMenu}>What it does</a>
          <a href="#how" onClick={closeMenu}>How it works</a>
          <a href="#sample" onClick={closeMenu}>Sample certificate</a>
        </div>
        <a href="#contact" className="nav-cta">Get in touch</a>
      </div>
    </nav>
  );
}
