'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { submitTaxReliefForm } from '@/lib/api';

export default function Home() {
  const [selectedDebt, setSelectedDebt] = useState('');
  const [showContactSuccess, setShowContactSuccess] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [customSelectOpen, setCustomSelectOpen] = useState(false);
  const [customSelectValue, setCustomSelectValue] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [certUuid, setCertUuid] = useState('');
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [tcpaTimestamp, setTcpaTimestamp] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Initialize cert UUID and detect IP
  useEffect(() => {
    const uuid = crypto.randomUUID ? crypto.randomUUID() :
      'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    setCertUuid(uuid);

    // Auto-detect IP address
    (async function() {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.log('Could not detect IP address:', error);
        setIpAddress('Unable to detect');
      }
    })();
  }, []);

  const debtAmounts = [
    'Under $10,000',
    '$10,000 – $24,999',
    '$25,000 – $49,999',
    '$50,000 – $99,999',
    '$100,000+',
    'Not sure'
  ];

  const handleDebtSelect = (amount: string) => {
    setSelectedDebt(amount);
  };

  const handleQualifyClick = () => {
    // Navigate to survey page with debt amount
    window.location.href = `/survey?debt=${encodeURIComponent(selectedDebt)}&cert=${encodeURIComponent(certUuid)}`;
  };

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCustomSelectClick = () => {
    setCustomSelectOpen(!customSelectOpen);
  };

  const handleCustomSelectOption = (value: string) => {
    setCustomSelectValue(value);
    setCustomSelectOpen(false);
  };

  const handleTcpaChange = (checked: boolean) => {
    setTcpaConsent(checked);
    if (checked) {
      const ts = new Date().toISOString();
      setTcpaTimestamp(ts);
    } else {
      setTcpaTimestamp('');
    }
  };

  const isContactFormValid = () => {
    return formData.firstName.trim().length > 1 &&
           formData.lastName.trim().length > 1 &&
           /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email) &&
           formData.phone.replace(/\D/g, '').length >= 10 &&
           customSelectValue.trim() !== '' &&
           tcpaConsent;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submissionData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      zipCode: '', // Not collected on homepage contact form
      debtAmount: customSelectValue,
      debtType: '',
      unfiled: '',
      enforcement: '',
      income: '',
      tcpaConsent: tcpaConsent,
      tcpaConsentTimestamp: tcpaTimestamp,
      ipAddress: ipAddress,
      certUuid: certUuid
    };

    try {
      const result = await submitTaxReliefForm(submissionData);

      if (result.success) {
        setShowContactSuccess(true);
        setTimeout(() => {
          setShowContactSuccess(false);
          setFormData({ firstName: '', lastName: '', email: '', phone: '' });
          setCustomSelectValue('');
          setTcpaConsent(false);
          setTcpaTimestamp('');
        }, 3000);
      } else {
        alert('There was an error submitting your request. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an error submitting your request. Please try again.');
    }
  };

  // Close custom select when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setCustomSelectOpen(false);
    };

    if (customSelectOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [customSelectOpen]);

  const faqs = [
    {
      question: 'Do I qualify for tax relief?',
      answer: 'Qualification depends on how much you owe, your income and assets, and your filing history. Generally, taxpayers with $10,000+ in federal or state tax debt have the most options. The eligibility check takes about a minute and tells you which programs fit.'
    },
    {
      question: 'Can you really settle for less than I owe?',
      answer: 'In qualifying hardship cases, yes — the IRS Offer in Compromise program exists for exactly this. Not everyone qualifies, and anyone who guarantees a settlement before reviewing your case isn&apos;t being straight with you. We tell you honestly which path fits after the review.'
    },
    {
      question: 'Will this stop my wage garnishment?',
      answer: 'In many cases active garnishments and levies can be released or reduced once representation is established and a resolution is in motion. The sooner your case starts, the more options exist.'
    },
    {
      question: 'What does the initial review cost?',
      answer: 'Nothing. The eligibility check and initial case review are free with no obligation. If you engage us for resolution work, fees are quoted upfront before anything begins.'
    },
    {
      question: 'I haven&apos;t filed in years. Can you still help?',
      answer: 'Yes — unfiled returns are one of the most common situations we handle. Getting back into filing compliance is usually the required first step before relief programs apply, and we manage that process.'
    }
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="topbar">
        <div className="wrap">
          <span>Free tax debt review — no cost, no obligation</span>
          <span>Call now: <a href="tel:18776370366">(877) 637-0366</a></span>
        </div>
      </div>

      {/* Navigation */}
      <nav>
        <div className="wrap">
          <a className="logo" href="#">
            <span className="logo-mark">C</span>
            <span>
              <span className="logo-name">Cacophinney</span><br />
              <span className="logo-sub">Tax Relief</span>
            </span>
          </a>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#process">How It Works</a>
            <a href="#results">Results</a>
            <a href="#faq">FAQ</a>
            <a className="nav-cta" href="#qualify">Check If You Qualify</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="kicker">IRS &amp; State Tax Debt Resolution</span>
            <h1 className="serif">The IRS has a process.<br /><em>So do we.</em></h1>
            <p>If you owe $10,000 or more in back taxes, federal relief programs exist to reduce, restructure, or pause what you owe. We find the one you qualify for — and handle the IRS so you don&apos;t have to.</p>
            <ul className="hero-points">
              <li>Stop wage garnishments, levies, and lien escalation</li>
              <li>Settlement, penalty relief, and structured payment plans</li>
              <li>One dedicated case specialist from review to resolution</li>
            </ul>
          </div>

          <div className="qualify" id="qualify">
            <h2>60-Second Eligibility Check</h2>
            <div className="sub">How much tax debt do you have?</div>
            <div className="amt-grid">
              {debtAmounts.map((amount, index) => (
                <button
                  key={index}
                  className={`amt ${selectedDebt === amount ? 'sel' : ''}`}
                  onClick={() => handleDebtSelect(amount)}
                >
                  {amount === '$10,000 – $24,999' ? '$10k – $25k' :
                   amount === '$25,000 – $49,999' ? '$25k – $50k' :
                   amount === '$50,000 – $99,999' ? '$50k – $100k' :
                   amount}
                </button>
              ))}
            </div>
            <button
              className="qualify-btn"
              disabled={!selectedDebt}
              onClick={handleQualifyClick}
            >
              See My Relief Options &rarr;
            </button>
            <div className="qualify-note">Free &bull; No obligation &bull; No documents needed to check</div>
          </div>
        </div>

        <div className="trustbar">
          <div className="wrap">
            <div className="trust-item"><div className="n">10+</div><div className="l">Years in business</div></div>
            <div className="trust-item"><div className="n">1,000s</div><div className="l">Taxpayers helped</div></div>
            <div className="trust-item"><div className="n">50</div><div className="l">States served</div></div>
            <div className="trust-item"><div className="n">$0</div><div className="l">Cost for initial review</div></div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services">
        <div className="wrap">
          <div className="sec-kicker">What We Resolve</div>
          <h2 className="sec-title serif">Every tax problem has a relief path.</h2>
          <p className="sec-lead">The IRS offers more resolution programs than most taxpayers ever hear about. We match your situation to the right one and manage the entire process.</p>
          <div className="svc-grid">
            <div className="svc">
              <div className="ico">&#9878;</div>
              <h3>Offer in Compromise</h3>
              <p>Settle eligible tax debt for less than the full balance when full payment would create financial hardship.</p>
            </div>
            <div className="svc">
              <div className="ico">&#9209;</div>
              <h3>Garnishment &amp; Levy Release</h3>
              <p>Stop active wage garnishments and bank levies, and prevent new enforcement while your case is worked.</p>
            </div>
            <div className="svc">
              <div className="ico">&#9998;</div>
              <h3>Penalty Abatement</h3>
              <p>Remove or reduce failure-to-file and failure-to-pay penalties that inflate your balance year after year.</p>
            </div>
            <div className="svc">
              <div className="ico">&#128197;</div>
              <h3>Installment Agreements</h3>
              <p>Structured monthly payment plans negotiated at amounts your budget can actually sustain.</p>
            </div>
            <div className="svc">
              <div className="ico">&#128196;</div>
              <h3>Unfiled Returns</h3>
              <p>Get back into filing compliance — often the required first step before any relief program applies.</p>
            </div>
            <div className="svc">
              <div className="ico">&#127963;</div>
              <h3>State Tax Issues</h3>
              <p>State back taxes, liens, and payment plans handled alongside your federal case in all 50 states.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process" id="process">
        <div className="wrap">
          <div className="sec-kicker">How It Works</div>
          <h2 className="sec-title serif">Three steps between you and resolution.</h2>
          <p className="sec-lead">No mystery, no runaround. Here&apos;s exactly what happens after your eligibility check.</p>
          <div className="steps">
            <div className="step">
              <h3>Free Case Review</h3>
              <p>A specialist reviews your debt amount, tax years, income, and any active enforcement to identify which relief programs you qualify for.</p>
              <span className="dur">Day 1</span>
            </div>
            <div className="step">
              <h3>Protection &amp; Investigation</h3>
              <p>We establish representation, pull your IRS transcripts, verify exactly what you owe, and move to pause active collection.</p>
              <span className="dur">Weeks 1&ndash;4</span>
            </div>
            <div className="step">
              <h3>Negotiation &amp; Resolution</h3>
              <p>Your case is submitted under the best-fit program — settlement, abatement, or structured plan — and worked to final resolution.</p>
              <span className="dur">Varies by program</span>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results">
        <div className="wrap">
          <div className="sec-kicker">Representative Outcomes</div>
          <h2 className="sec-title serif">What resolution can look like.</h2>
          <div className="cases">
            <div className="case">
              <div className="before">Owed $47,500 to the IRS</div>
              <div className="after">Settled for $7,100</div>
              <div className="what">Offer in Compromise accepted after hardship review</div>
            </div>
            <div className="case">
              <div className="before">Owed $28,400 with penalties</div>
              <div className="after">$11,300 removed</div>
              <div className="what">First-time penalty abatement plus interest recalculation</div>
            </div>
            <div className="case">
              <div className="before">IRS demanding $1,150/month</div>
              <div className="after">$240/month</div>
              <div className="what">Installment agreement negotiated to a sustainable payment</div>
            </div>
          </div>
          <p className="cases-note">Representative examples for illustration. Every case is different; individual results depend on your facts, circumstances, and program eligibility, and no specific outcome is guaranteed.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <div className="wrap">
          <div className="sec-kicker">Common Questions</div>
          <h2 className="sec-title serif">Straight answers.</h2>
          <div style={{ maxWidth: '760px' }}>
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaqs.has(index) ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => toggleFaq(index)}>
                  {faq.question}
                </button>
                <div className="faq-a">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="wrap contact-grid">
          <div className="contact-info">
            <div className="sec-kicker">Talk To Us</div>
            <h2 className="sec-title serif">Get your free case review.</h2>
            <p>Call, or send your details and a specialist will reach out. Either way, the review costs nothing and you&apos;ll know your options.</p>
            <div className="cline">
              <span className="ci">&#9742;</span>
              <span><strong>(877) 637-0366</strong><br />Mon&ndash;Fri 8am&ndash;8pm ET &bull; Sat 9am&ndash;3pm ET</span>
            </div>
            <div className="cline">
              <span className="ci">&#9993;</span>
              <span>help@cacophinney.com</span>
            </div>
            <div className="cline">
              <span className="ci">&#127968;</span>
              <span>Cacophinney Tax Relief, a service of Cacophinney, LLC<br />[BUSINESS ADDRESS — PENDING]</span>
            </div>
          </div>

          <form className="cform" onSubmit={handleContactSubmit}>
            <h3>Request a callback</h3>
            <div className="cf-grid">
              <div>
                <label>First name</label>
                <input
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label>Last name</label>
                <input
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <div className="full">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <label>Tax debt amount</label>
                <div className="custom-select" onClick={(e) => { e.stopPropagation(); handleCustomSelectClick(); }}>
                  <div className={`custom-select-trigger ${customSelectOpen ? 'open' : ''}`}>
                    <span className={customSelectValue ? '' : 'placeholder'}>
                      {customSelectValue || 'Select…'}
                    </span>
                    <span className="arrow">▼</span>
                  </div>
                  <div className={`custom-select-options ${customSelectOpen ? 'open' : ''}`}>
                    {debtAmounts.map((amount, index) => (
                      <div
                        key={index}
                        className={`custom-select-option ${customSelectValue === amount ? 'selected' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleCustomSelectOption(amount); }}
                      >
                        {amount}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <label className="consent">
              <input
                type="checkbox"
                checked={tcpaConsent}
                onChange={(e) => handleTcpaChange(e.target.checked)}
                required
              />
              <span>
                By checking this box, I provide my <strong>express written consent</strong> to be contacted by
                <strong> Cacophinney, LLC</strong> regarding tax relief options at the number provided,
                including my wireless number, by live agents, <strong>automatic telephone dialing systems,
                artificial or prerecorded voice, SMS/text</strong>, and email, even if my number is on any
                Do-Not-Call registry. <strong>Consent is not a condition of purchase</strong> — I may call
                (877) 637-0366 instead. Msg &amp; data rates may apply. Reply STOP or email
                optout@cacophinney.com to revoke. Checking this box is my <strong>electronic signature</strong> (E-SIGN).
                I agree to the <Link href="/terms" style={{color: 'var(--copper)'}}>Terms</Link> and
                <Link href="/privacy" style={{color: 'var(--copper)'}}> Privacy Policy</Link>.
              </span>
            </label>
            <div className="consent-meta">
              <span>Consent version: <strong>v2026-07a</strong></span>
              <span>IP: <strong>{ipAddress || '—'}</strong></span>
              <span>{tcpaTimestamp ? `Signed: ${tcpaTimestamp} (UTC)` : 'Not yet signed'}</span>
            </div>

            <button
              type="submit"
              className="send"
              disabled={!isContactFormValid()}
              style={showContactSuccess ? { background: 'var(--ok)' } : {}}
            >
              {showContactSuccess ? 'Request received ✓' : 'Request My Free Review'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="foot-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="#">Do Not Sell My Information</a>
            <a href="#contact">Contact</a>
          </div>
          <p>Cacophinney Tax Relief, a service of Cacophinney, LLC — [BUSINESS ADDRESS — PENDING]. Cacophinney provides tax resolution assistance and connects consumers with tax relief services. Individual results vary based on facts, circumstances, and eligibility; no specific outcome is guaranteed. Estimates are based on information you provide. Program availability varies by state and by IRS/state agency criteria.</p>
          <p style={{ marginTop: '10px' }}>&copy; 2026 Cacophinney, LLC. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
