'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface SurveyData {
  debtAmount: string;
  debtType: string;
  unfiled: string;
  enforcement: string;
  income: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  zipCode: string;
  tcpaConsent: boolean;
  tcpaConsentTimestamp: string;
  ipAddress: string;
}

function SurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [userIp, setUserIp] = useState('');

  const [formData, setFormData] = useState<SurveyData>({
    debtAmount: searchParams.get('debt') || '',
    debtType: '',
    unfiled: '',
    enforcement: '',
    income: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    zipCode: '',
    tcpaConsent: false,
    tcpaConsentTimestamp: '',
    ipAddress: '',
  });

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIp(data.ip);
        setFormData(prev => ({ ...prev, ipAddress: data.ip }));
      })
      .catch(() => setUserIp('0.0.0.0'));
  }, []);

  const debtAmounts = [
    'Under $10,000',
    '$10,000 – $24,999',
    '$25,000 – $49,999',
    '$50,000 – $99,999',
    '$100,000 – $249,999',
    '$250,000+',
  ];

  const debtTypes = [
    'IRS (federal)',
    'State tax',
    'Both IRS and State',
  ];

  const unfiledOptions = [
    'Yes, I have unfiled returns',
    'No, all returns are filed',
    'Not sure',
  ];

  const enforcementOptions = [
    'Just received a notice',
    'Tax lien filed',
    'Levy or bank freeze',
    'Wage garnishment',
    'None yet',
  ];

  const incomeTypes = [
    'W-2 employee',
    'Self-employed / 1099',
    'Both W-2 and self-employed',
    'Retired / Social Security',
    'No current income',
  ];

  const handleAnswer = (field: keyof SurveyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (currentStep < 6) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.zipCode) {
      alert('Please fill in all contact fields');
      return;
    }

    if (!formData.tcpaConsent) {
      alert('Please consent to be contacted to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      const tcpaTimestamp = new Date().toISOString();

      // Create FormData for Web3Forms
      const web3FormData = new FormData();
      web3FormData.append('access_key', '34ad3eea-dd7b-47dc-b443-5c3259abd513');
      web3FormData.append('subject', 'New Tax Relief Lead from Cacophiney Survey');
      web3FormData.append('from_name', 'Cacophiney Tax Relief');

      // Lead information
      web3FormData.append('firstName', formData.firstName);
      web3FormData.append('lastName', formData.lastName);
      web3FormData.append('email', formData.email);
      web3FormData.append('phone', formData.phone);
      web3FormData.append('zipCode', formData.zipCode);

      // Survey responses
      web3FormData.append('debtAmount', formData.debtAmount);
      web3FormData.append('debtType', formData.debtType);
      web3FormData.append('unfiled', formData.unfiled);
      web3FormData.append('enforcement', formData.enforcement);
      web3FormData.append('income', formData.income);

      // Consent tracking
      web3FormData.append('tcpaConsent', formData.tcpaConsent ? 'Yes' : 'No');
      web3FormData.append('tcpaConsentTimestamp', tcpaTimestamp);
      web3FormData.append('ipAddress', formData.ipAddress);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: web3FormData
      });

      const result = await response.json();

      if (result.success) {
        setSubmissionSuccess(true);
        setCurrentStep(7);
      } else {
        alert('Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = Math.round((currentStep / 6) * 100);

  return (
    <>
      <style jsx global>{`
        :root {
          --navy: #122a3f;
          --navy-deep: #0b1d2c;
          --copper: #c0622f;
          --paper: #f8f6f2;
          --ink: #182430;
          --muted: #5b6a76;
          --line: #dcd6cc;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Segoe UI", system-ui, sans-serif;
          background: var(--paper);
          color: var(--ink);
          line-height: 1.6;
        }

        header {
          background: var(--navy);
          color: #fff;
          padding: 16px 24px;
          border-bottom: 3px solid var(--copper);
        }

        header a {
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
        }

        header a span {
          color: #e8b98f;
        }

        .survey-container {
          max-width: 680px;
          margin: 40px auto;
          padding: 0 24px 80px;
        }

        .progress-bar {
          background: #e5dfd5;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 36px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--copper) 0%, #d89456 100%);
          transition: width 0.3s ease;
        }

        .question-card {
          background: #fff;
          border: 2px solid var(--line);
          border-radius: 8px;
          padding: 32px 28px;
          box-shadow: 0 2px 8px rgba(18, 42, 63, 0.08);
        }

        .question-card h2 {
          font-family: Georgia, serif;
          font-size: 24px;
          margin-bottom: 22px;
          color: var(--navy);
        }

        .answer-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .answer-btn {
          background: #fff;
          border: 2px solid var(--line);
          padding: 16px 20px;
          border-radius: 6px;
          font-size: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .answer-btn:hover {
          border-color: var(--copper);
          background: #fefcf9;
        }

        .answer-btn.selected {
          border-color: var(--copper);
          background: #fff8f3;
          font-weight: 600;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--navy);
        }

        .form-group input {
          padding: 12px 14px;
          border: 2px solid var(--line);
          border-radius: 6px;
          font-size: 15px;
          font-family: inherit;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--copper);
        }

        .tcpa-box {
          background: #f4f1ed;
          border: 2px solid var(--line);
          border-radius: 6px;
          padding: 18px;
          margin-top: 8px;
        }

        .tcpa-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .tcpa-checkbox input[type="checkbox"] {
          margin-top: 4px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .tcpa-checkbox label {
          font-size: 13px;
          line-height: 1.5;
          color: var(--ink);
          cursor: pointer;
        }

        .submit-btn {
          background: var(--copper);
          color: #fff;
          border: none;
          padding: 16px 28px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
        }

        .submit-btn:hover {
          background: #a85426;
        }

        .submit-btn:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .result-card {
          background: #f0f9f5;
          border: 2px solid #7bc49c;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
        }

        .result-card h2 {
          font-family: Georgia, serif;
          font-size: 28px;
          color: #0e4d3c;
          margin-bottom: 16px;
        }

        .result-card p {
          font-size: 16px;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .back-link {
          display: inline-block;
          margin-top: 24px;
          color: var(--copper);
          text-decoration: none;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .back-link:hover {
          background: rgba(192, 98, 47, 0.1);
        }

        footer {
          background: var(--navy-deep);
          color: #8fa5b5;
          font-size: 12px;
          padding: 26px 24px;
          text-align: center;
        }

        footer a {
          color: #c99a72;
          text-decoration: none;
          margin: 0 10px;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header>
        <Link href="/">Cacophinney <span>Tax Relief</span></Link>
      </header>

      <div className="survey-container">
        {currentStep < 7 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="question-card">
            <h2>How much tax debt do you owe?</h2>
            <div className="answer-grid">
              {debtAmounts.map((amount) => (
                <button
                  key={amount}
                  className={`answer-btn ${formData.debtAmount === amount ? 'selected' : ''}`}
                  onClick={() => handleAnswer('debtAmount', amount)}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="question-card">
            <h2>What type of tax debt?</h2>
            <div className="answer-grid">
              {debtTypes.map((type) => (
                <button
                  key={type}
                  className={`answer-btn ${formData.debtType === type ? 'selected' : ''}`}
                  onClick={() => handleAnswer('debtType', type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="question-card">
            <h2>Do you have unfiled tax returns?</h2>
            <div className="answer-grid">
              {unfiledOptions.map((option) => (
                <button
                  key={option}
                  className={`answer-btn ${formData.unfiled === option ? 'selected' : ''}`}
                  onClick={() => handleAnswer('unfiled', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="question-card">
            <h2>Are you facing IRS enforcement?</h2>
            <div className="answer-grid">
              {enforcementOptions.map((option) => (
                <button
                  key={option}
                  className={`answer-btn ${formData.enforcement === option ? 'selected' : ''}`}
                  onClick={() => handleAnswer('enforcement', option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="question-card">
            <h2>What is your current income type?</h2>
            <div className="answer-grid">
              {incomeTypes.map((type) => (
                <button
                  key={type}
                  className={`answer-btn ${formData.income === type ? 'selected' : ''}`}
                  onClick={() => handleAnswer('income', type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="question-card">
            <h2>Get Your Free Case Review</h2>
            <form onSubmit={handleContactSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Mobile Phone *</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="zipCode">ZIP Code *</label>
                <input
                  id="zipCode"
                  type="text"
                  required
                  pattern="[0-9]{5}"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>

              <div className="tcpa-box">
                <div className="tcpa-checkbox">
                  <input
                    type="checkbox"
                    id="tcpa"
                    required
                    checked={formData.tcpaConsent}
                    onChange={(e) => setFormData(prev => ({ ...prev, tcpaConsent: e.target.checked }))}
                  />
                  <label htmlFor="tcpa">
                    By checking this box and clicking Submit, I provide my express written consent and electronic signature authorizing Cacophiney, LLC and its representatives to contact me at the telephone number and email address I provided above, including by automatic telephone dialing system, artificial or prerecorded voice, SMS/text messages, and email, for marketing purposes and regarding their tax relief services. I understand that my consent is not a condition of purchasing any goods or services and that I may revoke this consent at any time. I agree to the <Link href="/terms" target="_blank">Terms of Service</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>. This page is protected by technology that records my consent, including my IP address ({userIp}), timestamp, and session.
                  </label>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit & Get Results'}
              </button>
            </form>
          </div>
        )}

        {currentStep === 7 && submissionSuccess && (
          <div className="result-card">
            <h2>Thank You for Your Submission!</h2>
            <p>
              Your information has been received. A tax relief specialist will review your case and contact you shortly to discuss your options.
            </p>
            <p>
              We appreciate your interest in our tax relief services and look forward to helping you resolve your tax debt.
            </p>
            <Link href="/" className="back-link">
              Return to Home Page
            </Link>
          </div>
        )}
      </div>

      <footer>
        <Link href="/">Home</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <p style={{ marginTop: '10px' }}>&copy; 2026 Cacophinney, LLC. All rights reserved.</p>
      </footer>
    </>
  );
}

export default function TaxReliefSurvey() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SurveyContent />
    </Suspense>
  );
}
