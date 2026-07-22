'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import { submitSurvey as submitToBackend, type SurveySubmission, type ApiResponse } from '@/lib/api';

export default function HomePage() {
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ipAddress, setIpAddress] = useState('');
  const [certUuid, setCertUuid] = useState('');
  const [taxRequiresConsent, setTaxRequiresConsent] = useState(false);
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zip: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const TOTAL_QUESTIONS = 6;

  // Initialize session
  useEffect(() => {
    const uuid = crypto.randomUUID();
    setCertUuid(uuid);

    // Fetch IP address
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('Unable to detect'));
  }, []);

  const startSurvey = () => {
    setShowSurvey(true);
    window.scrollTo({ top: 0 });
  };

  const setProgress = (step: number) => {
    return Math.min(((step - 1) / TOTAL_QUESTIONS) * 100, 100);
  };

  const selectAnswer = (question: string, answer: string, isTaxQuestion = false, taxValue = '') => {
    setAnswers(prev => ({ ...prev, [question]: answer }));

    if (isTaxQuestion) {
      const requiresConsent = ['yes10k', 'yesunder', 'notsure'].includes(taxValue);
      setTaxRequiresConsent(requiresConsent);
      if (!requiresConsent) {
        setTcpaConsent(false);
        setConsentTimestamp('');
      }
    }
  };

  const handleTcpaChange = (checked: boolean) => {
    setTcpaConsent(checked);
    if (checked) {
      const ts = new Date().toISOString();
      setConsentTimestamp(ts);
    } else {
      setConsentTimestamp('');
    }
  };

  const nextStep = () => {
    if (currentStep === 4 && taxRequiresConsent && !tcpaConsent) {
      return; // Block progression if TCPA required but not checked
    }
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateContact = () => {
    return (
      formData.firstName.length > 1 &&
      formData.lastName.length > 1 &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email) &&
      formData.phone.replace(/\D/g, '').length >= 10 &&
      /^\d{5}$/.test(formData.zip)
    );
  };

  const submitSurvey = async () => {
    setIsSubmitting(true);

    try {
      const submission: SurveySubmission = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        zipCode: formData.zip,
        age: answers.age || '',
        homeOwnership: answers.home || '',
        householdIncome: answers.income || '',
        taxDebt: answers.tax || '',
        billReduction: answers.bills || '',
        tcpaConsent: tcpaConsent,
        tcpaConsentTimestamp: consentTimestamp,
        ipAddress: ipAddress,
        certUuid: certUuid,
      };

      const result = await submitToBackend(submission);
      setApiResponse(result);

      if (result.success) {
        setCurrentStep(7);
      } else {
        // Stay on current step and show error
        alert(result.error || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showSurvey) {
    return (
      <>
        <header>
          <div className="brand">
            <div className="brand-mark">S</div>
            <div>
              <div className="brand-name">Savings Check America</div>
              <div className="brand-sub">2026 National Household Savings Survey</div>
            </div>
          </div>
          <div className="header-right">
            Independent consumer survey<br />Est. completion time: 60 seconds
          </div>
        </header>

        <section id="home">
          <div className="hero">
            <span className="eyebrow">2026 Survey Now Open</span>
            <h1 className="display">
              Is your household leaving<br />
              <span className="underline">money on the table?</span>
            </h1>
            <p>
              Answer six quick questions about your household finances. Based on your answers, we identify federal, state, and private programs you may qualify for — including tax relief, debt reduction, and monthly bill savings.
            </p>
            <button className="cta" onClick={startSurvey}>
              Start My Free Survey →
            </button>
            <div className="hero-note">No cost. No obligation. Takes about a minute.</div>
          </div>

          <div className="strip">
            <div className="strip-item">
              <div className="k">6</div>
              <div className="v">Short questions — no documents or account numbers needed</div>
            </div>
            <div className="strip-item">
              <div className="k">60s</div>
              <div className="v">Average time to complete the full survey</div>
            </div>
            <div className="strip-item">
              <div className="k">$0</div>
              <div className="v">Free to take — results matched to available programs</div>
            </div>
          </div>

          <div className="how">
            <h2>How it works</h2>
            <div className="how-grid">
              <div className="how-card">
                <div className="step-tag">Step One</div>
                <h3>Answer the survey</h3>
                <p>Six multiple-choice questions about your household, income, taxes, and monthly bills.</p>
              </div>
              <div className="how-card">
                <div className="step-tag">Step Two</div>
                <h3>Get matched</h3>
                <p>Your answers are matched against savings and relief programs currently accepting applicants.</p>
              </div>
              <div className="how-card">
                <div className="step-tag">Step Three</div>
                <h3>Review your options</h3>
                <p>See your matches instantly. If you request it, a specialist can walk you through next steps.</p>
              </div>
            </div>
          </div>
        </section>

        <footer>
          <div className="footer-inner">
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Do Not Sell My Information</a>
              <a href="#">Contact</a>
            </div>
            <p>
              Savings Check America is an independent consumer survey and marketing platform. We are not a government agency, lender, tax preparer, or law firm, and we do not provide tax, legal, or financial advice. By completing this survey you may be matched with third-party service providers, including Zangara Enterprises, LLC and Cacophinney, LLC, who may contact you as described in the authorization above. Program availability and eligibility vary by state and individual circumstances. Results are not guaranteed.
            </p>
            <p style={{ marginTop: '10px' }}>© 2026 Savings Check America. All rights reserved.</p>
          </div>
        </footer>
      </>
    );
  }

  // Survey view
  return (
    <>
      <header>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">Savings Check America</div>
            <div className="brand-sub">2026 National Household Savings Survey</div>
          </div>
        </div>
      </header>

      <section className="survey-wrap">
        <div className="progress">
          <div className="progress-bar" style={{ width: `${setProgress(currentStep)}%` }}></div>
        </div>
        <div className="progress-label">
          {currentStep <= TOTAL_QUESTIONS ? `Question ${currentStep} of ${TOTAL_QUESTIONS}` : 'Complete'}
        </div>

        {/* Q1 - Age */}
        {currentStep === 1 && (
          <div className="qcard">
            <div className="qnum">Question 1 of 6</div>
            <div className="qtext display">What is your age range?</div>
            <div className="opts">
              {['Under 40', '40 – 54', '55 – 64', '65 or older'].map((option) => (
                <button
                  key={option}
                  className={`opt ${answers.age === option ? 'selected' : ''}`}
                  onClick={() => selectAnswer('age', option)}
                >
                  <span className="dot"></span>
                  {option}
                </button>
              ))}
            </div>
            <div className="nav-row">
              <span></span>
              <button
                className="btn btn-next"
                disabled={!answers.age}
                onClick={nextStep}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Q2 - Home ownership */}
        {currentStep === 2 && (
          <div className="qcard">
            <div className="qnum">Question 2 of 6</div>
            <div className="qtext display">Do you own or rent your home?</div>
            <div className="opts">
              {['Own', 'Rent', 'Other / living with family'].map((option) => (
                <button
                  key={option}
                  className={`opt ${answers.home === option ? 'selected' : ''}`}
                  onClick={() => selectAnswer('home', option)}
                >
                  <span className="dot"></span>
                  {option}
                </button>
              ))}
            </div>
            <div className="nav-row">
              <button className="btn btn-back" onClick={prevStep}>← Back</button>
              <button
                className="btn btn-next"
                disabled={!answers.home}
                onClick={nextStep}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Q3 - Income */}
        {currentStep === 3 && (
          <div className="qcard">
            <div className="qnum">Question 3 of 6</div>
            <div className="qtext display">What is your approximate annual household income?</div>
            <div className="opts">
              {['Under $30,000', '$30,000 – $59,999', '$60,000 – $99,999', '$100,000 or more'].map((option) => (
                <button
                  key={option}
                  className={`opt ${answers.income === option ? 'selected' : ''}`}
                  onClick={() => selectAnswer('income', option)}
                >
                  <span className="dot"></span>
                  {option}
                </button>
              ))}
            </div>
            <div className="nav-row">
              <button className="btn btn-back" onClick={prevStep}>← Back</button>
              <button
                className="btn btn-next"
                disabled={!answers.income}
                onClick={nextStep}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Q4 - Tax question with TCPA */}
        {currentStep === 4 && (
          <div className="qcard">
            <div className="qnum">Question 4 of 6</div>
            <div className="qtext display">Do you currently owe back taxes to the IRS or your state?</div>
            <div className="opts">
              {[
                { label: 'Yes — more than $10,000', value: 'yes10k' },
                { label: 'Yes — less than $10,000', value: 'yesunder' },
                { label: "I'm not sure", value: 'notsure' },
                { label: 'No', value: 'no' }
              ].map((option) => (
                <button
                  key={option.value}
                  className={`opt ${answers.tax === option.label ? 'selected' : ''}`}
                  onClick={() => selectAnswer('tax', option.label, true, option.value)}
                >
                  <span className="dot"></span>
                  {option.label}
                </button>
              ))}
            </div>

            {taxRequiresConsent && (
              <div className="tcpa">
                <div className="tcpa-head">
                  ☢️ Tax Relief Contact Authorization — Required to Match You With a Specialist
                </div>
                <div className="tcpa-body">
                  <label className="tcpa-check">
                    <input
                      type="checkbox"
                      checked={tcpaConsent}
                      onChange={(e) => handleTcpaChange(e.target.checked)}
                    />
                    <span className="tcpa-text">
                      By checking this box, I provide my <strong>express written consent</strong> to be contacted by <strong>Zangara Enterprises, LLC</strong> and/or <strong>Cacophinney, LLC</strong> regarding tax relief and tax resolution options at the telephone number I provide in this survey, including if it is a wireless number. I agree that I may be contacted by live agents, <strong>automatic telephone dialing systems, artificial or prerecorded voice messages, and SMS/text messages</strong>, and by email, even if my number appears on any federal, state, or company Do-Not-Call registry. I understand that <strong>my consent is not a condition of purchasing any goods or services</strong> and that I may instead call <strong>(800) 000-0000</strong> to proceed without consenting. Message and data rates may apply; message frequency varies. I may revoke this consent at any time by replying <strong>STOP</strong> to any text message or by emailing <strong>optout@savingscheckamerica.com</strong>. I agree that checking this box and submitting this survey constitutes my <strong>electronic signature</strong> under the E-SIGN Act, and I agree to the Terms of Use and Privacy Policy.
                    </span>
                  </label>
                  <div className="tcpa-meta">
                    <span>Consent version: <strong>v2026-07a</strong></span>
                    <span>IP address: <strong>{ipAddress || '—'}</strong></span>
                    <span>{consentTimestamp ? `Signed: ${consentTimestamp} (UTC)` : 'Not yet signed'}</span>
                  </div>
                  {taxRequiresConsent && !tcpaConsent && (
                    <div className="tcpa-required show">
                      Please check the authorization box above to continue, or select a different answer.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="nav-row">
              <button className="btn btn-back" onClick={prevStep}>← Back</button>
              <button
                className="btn btn-next"
                disabled={!answers.tax || (taxRequiresConsent && !tcpaConsent)}
                onClick={nextStep}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Q5 - Bills */}
        {currentStep === 5 && (
          <div className="qcard">
            <div className="qnum">Question 5 of 6</div>
            <div className="qtext display">Which monthly bills would you most like to reduce?</div>
            <div className="opts">
              {[
                'Credit cards & loans',
                'Insurance (health, auto, home)',
                'Utilities & phone',
                'None of these'
              ].map((option) => (
                <button
                  key={option}
                  className={`opt ${answers.bills === option ? 'selected' : ''}`}
                  onClick={() => selectAnswer('bills', option)}
                >
                  <span className="dot"></span>
                  {option}
                </button>
              ))}
            </div>
            <div className="nav-row">
              <button className="btn btn-back" onClick={prevStep}>← Back</button>
              <button
                className="btn btn-next"
                disabled={!answers.bills}
                onClick={nextStep}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Q6 - Contact info */}
        {currentStep === 6 && (
          <div className="qcard">
            <div className="qnum">Question 6 of 6</div>
            <div className="qtext display">Where should we send your survey results?</div>
            <div className="fgrid">
              <div className="field">
                <label htmlFor="fname">First name</label>
                <input
                  id="fname"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  autoComplete="given-name"
                />
              </div>
              <div className="field">
                <label htmlFor="lname">Last name</label>
                <input
                  id="lname"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  autoComplete="family-name"
                />
              </div>
              <div className="field full">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  autoComplete="tel"
                  placeholder="(555) 555-5555"
                />
              </div>
              <div className="field">
                <label htmlFor="zip">ZIP code</label>
                <input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  maxLength={5}
                  autoComplete="postal-code"
                />
              </div>
              <div className="field full">
                <label>
                  Submission IP address{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(recorded automatically)</span>
                </label>
                <input
                  value={ipAddress || 'Detecting...'}
                  readOnly
                  tabIndex={-1}
                  style={{
                    background: '#f2f0e8',
                    color: 'var(--muted)',
                    cursor: 'default',
                    fontFamily: 'Courier,monospace',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div className="nav-row">
              <button className="btn btn-back" onClick={prevStep}>← Back</button>
              <button
                className="btn btn-next"
                disabled={!validateContact() || isSubmitting}
                onClick={submitSurvey}
              >
                {isSubmitting ? 'Submitting...' : 'See My Results →'}
              </button>
            </div>
          </div>
        )}

        {/* Thank you */}
        {currentStep === 7 && (
          <div className="qcard">
            <div className="thanks">
              <div className="badge">✓</div>
              <h2>Survey complete</h2>

              {isSubmitting ? (
                <p style={{ marginTop: '20px' }}>
                  <strong>Generating your personalized video...</strong><br />
                  This may take up to 60 seconds. Please do not close this page.
                </p>
              ) : apiResponse && apiResponse.success ? (
                <>
                  <p>
                    Thank you! Your survey has been processed successfully.
                  </p>

                  {apiResponse.video && apiResponse.video.success && (
                    <div style={{ marginTop: '20px', textAlign: 'left', background: '#f0f6f3', padding: '20px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>📹 Your Personalized Video</h3>
                      <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px' }}>
                        Recording ID: {apiResponse.video.recording_id}
                      </p>
                      {apiResponse.video.video_url && (
                        <a
                          href={apiResponse.video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            background: 'var(--green)',
                            color: '#fff',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}
                        >
                          View Your Video →
                        </a>
                      )}
                    </div>
                  )}

                  {apiResponse.certificate && apiResponse.certificate.success && apiResponse.certificate.certificate_url && (
                    <div style={{ marginTop: '16px', textAlign: 'left', background: '#fff8ed', padding: '20px', borderRadius: '8px', border: '1px solid var(--gold)' }}>
                      <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>🏆 Your Certificate</h3>
                      <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px' }}>
                        Certificate ID: {apiResponse.certificate.cert_uuid}
                      </p>
                      <a
                        href={apiResponse.certificate.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          background: 'var(--gold)',
                          color: '#fff',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        View Certificate →
                      </a>
                      {apiResponse.certificate.duplicate && (
                        <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--muted)' }}>
                          Note: This is a duplicate certificate (previous submission found)
                        </p>
                      )}
                    </div>
                  )}

                  {apiResponse.certificate && !apiResponse.certificate.success && apiResponse.certificate.warning && (
                    <div style={{ marginTop: '16px', padding: '16px', background: '#fff4e6', borderRadius: '8px', border: '1px solid #ffb020' }}>
                      <p style={{ fontSize: '13px', color: '#8b5a00' }}>
                        ⚠️ {apiResponse.certificate.warning}
                      </p>
                    </div>
                  )}

                  <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--muted)' }}>
                    A specialist will reach out with your results shortly.
                  </p>
                </>
              ) : (
                <p>
                  Thank you. Your answers have been recorded and matched against programs currently accepting applicants. A specialist will reach out with your results shortly.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Do Not Sell My Information</a>
            <a href="#">Contact</a>
          </div>
          <p>
            Savings Check America is an independent consumer survey and marketing platform. We are not a government agency, lender, tax preparer, or law firm, and we do not provide tax, legal, or financial advice.
          </p>
          <p style={{ marginTop: '10px' }}>© 2026 Savings Check America. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
