export function Hero() {
  return (
    <>
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot"></span> DIGITAL & TECHNOLOGY FORENSICS
            </div>
            <h1>
              Discover the
              <br />
              Science Behind
              <br />
              <span>Digital Evidence.</span>
            </h1>
            <p className="lead">
              Explore six specialized internship learning pathways across the
              rapidly evolving world of Digital & Technology Forensics.
            </p>
            <div className="hero-actions">
              <a className="button" href="#internships">
                Explore Internships <span>↗</span>
              </a>
              <a className="text-link" href="#about">
                About the Academy <span>→</span>
              </a>
            </div>
            <div className="hero-note">
              <span className="tiny-cross">+</span> Scientific curiosity.
              Investigative thinking.
            </div>
          </div>
          <div
            className="evidence-visual"
            role="img"
            aria-label="Illustrative digital fingerprint connected to computer, mobile and cloud evidence nodes"
          >
            <div className="visual-top">
              <span>
                <i></i> EVIDENCE ANALYSIS
              </span>
              <span>PFSA / FIG. 01</span>
            </div>
            <svg
              className="evidence-svg"
              viewBox="0 0 600 550"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="grid"
                  width="30"
                  height="30"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M30 0H0V30"
                    fill="none"
                    stroke="#23435b"
                    strokeWidth=".55"
                  />
                </pattern>
                <radialGradient id="wash">
                  <stop stopColor="#22d3ee" stopOpacity=".12" />
                  <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="fp" x2="1" y2="1">
                  <stop stopColor="#22d3ee" />
                  <stop offset="1" stopColor="#4f8ef7" />
                </linearGradient>
              </defs>
              <rect width="600" height="550" fill="url(#grid)" opacity=".6" />
              <circle cx="300" cy="275" r="250" fill="url(#wash)" />
              <g fill="none" stroke="#285067">
                <circle cx="300" cy="275" r="186" strokeDasharray="3 8" />
                <circle cx="300" cy="275" r="152" />
                <path d="M300 60V110M300 440V490M85 275H135M465 275H515" />
                <path d="M157 164L105 112H54M433 177L491 119H549M168 390L110 448H52M426 374L491 436H548" />
              </g>
              <g
                id="hero-fingerprint"
                fill="none"
                stroke="url(#fp)"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path
                  d="M 286.0 322.0 C 294.0 302, 277.0 244.32, 300 244.32 C 329.0 244.32, 317.0 292, 308.0 315 C 304.0 345, 290.0 350.0, 271.0 367.0"
                  opacity="0.95"
                />
                <path
                  d="M 279.2 325.7 C 287.2 302, 270.2 236.704, 300 236.704 C 335.8 236.704, 323.8 292, 314.8 315 C 310.8 345, 296.8 353.7, 277.8 370.7"
                  opacity="0.9149999999999999"
                />
                <path
                  d="M 272.4 329.4 C 280.4 302, 263.4 229.088, 300 229.088 C 342.6 229.088, 330.6 292, 321.6 315 C 317.6 345, 303.6 357.4, 284.6 374.4"
                  opacity="0.8799999999999999"
                />
                <path
                  d="M 265.6 333.1 C 273.6 302, 256.6 221.472, 300 221.472 C 349.4 221.472, 337.4 292, 328.4 315 C 324.4 345, 310.4 361.1, 291.4 378.1"
                  opacity="0.845"
                />
                <path
                  d="M 258.8 336.8 C 266.8 302, 249.8 213.856, 300 213.856 C 356.2 213.856, 344.2 292, 335.2 315 C 331.2 345, 317.2 364.8, 298.2 381.8"
                  opacity="0.8099999999999999"
                />
                <path
                  d="M 252.0 340.5 C 260.0 302, 243.0 206.24, 300 206.24 C 363.0 206.24, 351.0 292, 342.0 315 C 338.0 345, 324.0 368.5, 305.0 385.5"
                  opacity="0.7749999999999999"
                />
                <path
                  d="M 245.2 344.2 C 253.2 302, 236.2 198.624, 300 198.624 C 369.8 198.624, 357.8 292, 348.8 315 C 344.8 345, 330.8 372.2, 311.8 389.2"
                  opacity="0.74"
                />
                <path
                  d="M 238.4 347.9 C 246.4 302, 229.4 191.00799999999998, 300 191.00799999999998 C 376.6 191.00799999999998, 364.6 292, 355.6 315 C 351.6 345, 337.6 375.9, 318.6 392.9"
                  opacity="0.705"
                />
                <path
                  d="M 231.6 351.6 C 239.6 302, 222.6 183.392, 300 183.392 C 383.4 183.392, 371.4 292, 362.4 315 C 358.4 345, 344.4 379.6, 325.4 396.6"
                  opacity="0.6699999999999999"
                />
                <path
                  d="M 224.8 355.3 C 232.8 302, 215.8 175.776, 300 175.776 C 390.2 175.776, 378.2 292, 369.2 315 C 365.2 345, 351.2 383.3, 332.2 400.3"
                  opacity="0.6349999999999999"
                />
                <path
                  d="M 218.0 359.0 C 226.0 302, 209.0 168.16, 300 168.16 C 397.0 168.16, 385.0 292, 376.0 315 C 372.0 345, 358.0 387.0, 339.0 404.0"
                  opacity="0.5999999999999999"
                />
                <path
                  d="M 211.2 362.7 C 219.2 302, 202.2 160.54399999999998, 300 160.54399999999998 C 403.8 160.54399999999998, 391.8 292, 382.8 315 C 378.8 345, 364.8 390.7, 345.8 407.7"
                  opacity="0.565"
                />
                <path
                  d="M 204.4 366.4 C 212.4 302, 195.4 152.928, 300 152.928 C 410.6 152.928, 398.6 292, 389.6 315 C 385.6 345, 371.6 394.4, 352.6 411.4"
                  opacity="0.5299999999999999"
                />
                <path
                  d="M 197.60000000000002 370.1 C 205.60000000000002 302, 188.60000000000002 145.312, 300 145.312 C 417.4 145.312, 405.4 292, 396.4 315 C 392.4 345, 378.4 398.1, 359.4 415.1"
                  opacity="0.4949999999999999"
                />
              </g>
              <g stroke="#22d3ee" fill="#0b1a2a">
                <circle cx="157" cy="164" r="5" />
                <circle cx="433" cy="177" r="5" />
                <circle cx="168" cy="390" r="5" />
                <circle cx="426" cy="374" r="5" />
              </g>
              <g
                fill="#aab8cc"
                fontFamily="monospace"
                fontSize="10"
                letterSpacing="1.5"
              >
                <text x="21" y="97">
                  DEVICE ARTIFACTS
                </text>
                <text x="443" y="103">
                  CLOUD RECORDS
                </text>
                <text x="19" y="470">
                  DATA INTEGRITY
                </text>
                <text x="443" y="460">
                  NETWORK TRACES
                </text>
              </g>
              <g stroke="#22d3ee" strokeWidth="1.4" fill="none">
                <rect x="81" y="200" width="31" height="23" rx="3" />
                <path d="M90 230H104M97 223V230" />
                <rect x="490" y="302" width="18" height="31" rx="3" />
                <path d="M496 328H502M270 81h60M300 73V89" />
              </g>
              <path
                className="scan-line"
                d="M184 275H416"
                stroke="#22d3ee"
                opacity=".7"
              />
              <g fill="#22d3ee">
                <circle cx="300" cy="123" r="3" />
                <circle cx="452" cy="275" r="3" />
                <circle cx="300" cy="427" r="3" />
              </g>
            </svg>
            <div className="evidence-label">
              <span className="focus-corner"></span>
              <div className="mini-print">◎</div>
              <div>
                <strong>Every trace tells a story.</strong>
                <span>Learn to read the evidence.</span>
              </div>
              <span className="label-plus">+</span>
            </div>
            <div className="visual-bottom">
              <span>OBSERVE → ANALYSE → UNDERSTAND</span>
              <span className="cyan">● ILLUSTRATIVE MODEL</span>
            </div>
          </div>
        </div>
        <div className="container highlights">
          <div>
            <strong>06</strong>
            <span>
              Specialized
              <br />
              Domains
            </span>
          </div>
          <div>
            <span className="highlight-icon">⌘</span>
            <span>
              Digital Forensics
              <br />
              Focus
            </span>
          </div>
          <div>
            <span className="highlight-icon">◇</span>
            <span>
              Practical Learning
              <br />
              Approach
            </span>
          </div>
          <a href="#about" className="scroll-cue">
            SCROLL TO DISCOVER <span>↓</span>
          </a>
        </div>
      </section>
    </>
  );
}
