import React from 'react';

export function CuteFamilyTreeLogo(props) {
  return (
    <svg 
      id="family-logo-svg" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 300" 
      style={{ backgroundColor: 'transparent', borderRadius: '12px', ...props.style }}
      {...props}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600&display=swap');
            .logo-title {
              font-family: "Fredoka", sans-serif;
              font-weight: 600;
              letter-spacing: 0.1em;
              text-transform: lowercase;
              fill: #2F2E2A;
            }
            .logo-sub {
              font-family: "Inter", sans-serif;
              font-weight: 500;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              fill: #2F2E2A;
              opacity: 0.65;
            }
            .natural-drop-shadow {
              filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.06));
            }
          `}
        </style>
        <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#211F2E" floodOpacity="0.06" />
        </filter>
        <filter id="badge-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#3A322A" floodOpacity="0.1" />
        </filter>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C1E1A6" />
          <stop offset="100%" stopColor="#8BB86E" />
        </linearGradient>
      </defs>
      <g filter="url(#badge-shadow)">
        <circle cx="150" cy="150" r="136" fill="#F3F6F0" stroke="#2F2E2A" strokeWidth="2" strokeDasharray="6,6" className="transition-all duration-300" />
      </g>
      <g id="logo-core-graphic" className="natural-drop-shadow" transform="translate(0, -10)">
        <g>
          <path d="M 134 212 C 134 195, 140 185, 142 165 C 143 150, 145 135, 140 128 L 160 128 C 155 135, 157 150, 158 165 C 160 185, 166 195, 166 212 C 152 215, 148 215, 134 212 Z" fill="#8B5A2B" />
          <path d="M 135 210 C 122 212, 115 198, 108 205" stroke="#8B5A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 165 210 C 178 212, 185 200, 192 206" stroke="#8B5A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
          <g transform="translate(150, 172)">
            <path d="M -3 1 Q 0 3 3 1" stroke="#F3F6F0" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="-5" cy="-2" rx="0.7" ry="1" fill="#F3F6F0" />
            <ellipse cx="5" cy="-2" rx="0.7" ry="1" fill="#F3F6F0" />
            <circle cx="-5" cy="1" r="1.2" fill="#FF8A9A" opacity="0.6" />
            <circle cx="5" cy="1" r="1.2" fill="#FF8A9A" opacity="0.6" />
          </g>
          <path d="M 150 50 C 114 50, 95 68, 95 95 C 95 106, 75 110, 75 130 C 75 160, 105 168, 125 158 C 134 165, 166 165, 175 158 C 195 168, 225 160, 225 130 C 225 110, 205 106, 205 95 C 205 68, 186 50, 150 50 Z" fill="#C1E1A6" opacity="0.9" />
          <path d="M 150 57 C 118 57, 100 73, 100 97 C 100 110, 82 114, 82 131 C 82 154, 108 160, 125 152 C 134 158, 166 158, 175 152 C 192 160, 218 154, 218 131 C 218 114, 200 110, 200 97 C 200 73, 182 57, 150 57 Z" fill="#8BB86E" />
          <g opacity="0.8">
            <circle cx="92" cy="82" r="3" fill="#FF8A9A" />
            <circle cx="208" cy="140" r="4" fill="#FF8A9A" />
            <circle cx="105" cy="143" r="3" fill="#F3F6F0" />
            <circle cx="195" cy="76" r="2.5" fill="#F3F6F0" />
            <path d="M 150 68 L 150 110" stroke="#C1E1A6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3, 10" />
          </g>
        </g>
        <g id="family-members-group">
          <g className="transition-all duration-300">
            <circle cx="128" cy="100" r="17.5" fill="#FCFBF7" opacity="0.95" />
            <circle cx="128" cy="100" r="16" fill="#8BB86E" stroke="#2F2E2A" strokeWidth="1.8" />
            <g transform="translate(128, 101.2)">
              <circle cx="-5" cy="2.5" r="2" fill="#FF8A9A" opacity="0.8" />
              <circle cx="5" cy="2.5" r="2" fill="#FF8A9A" opacity="0.8" />
              <g stroke="#2F2E2A" strokeWidth="1.5" strokeLinecap="round" fill="none">
                <path d="M -6 -1 Q -3.5 -3.5 -1 -1" />
                <path d="M 1 -1 Q 3.5 -3.5 6 -1" />
              </g>
              <path d="M -2 3 Q 0.5 4.8 3 3" stroke="#2F2E2A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </g>
          </g>
          <g className="transition-all duration-300">
            <circle cx="172" cy="102" r="17.5" fill="#FCFBF7" opacity="0.95" />
            <circle cx="172" cy="102" r="16" fill="#8BB86E" stroke="#2F2E2A" strokeWidth="1.8" />
            <g transform="translate(172, 103.2)">
              <circle cx="-5" cy="2.5" r="2" fill="#FF8A9A" opacity="0.8" />
              <circle cx="5" cy="2.5" r="2" fill="#FF8A9A" opacity="0.8" />
              <circle cx="-3" cy="-1" r="1.2" fill="#2F2E2A" />
              <circle cx="3" cy="-1" r="1.2" fill="#2F2E2A" />
              <path stroke="#2F2E2A" strokeWidth="1" strokeLinecap="round" fill="none" d="M -4.5 -3 Q -3 -4 -1.5 -3" />
              <path stroke="#2F2E2A" strokeWidth="1" strokeLinecap="round" fill="none" d="M 1.5 -3 Q 3 -4 4.5 -3" />
              <path d="M -2 3 Q 0.5 4.8 3 3" stroke="#2F2E2A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </g>
          </g>
          <g className="transition-all duration-300">
            <circle cx="142" cy="82" r="14.5" fill="#FCFBF7" opacity="0.95" />
            <circle cx="142" cy="82" r="13" fill="#C1E1A6" stroke="#2F2E2A" strokeWidth="1.8" />
            <g transform="translate(142, 83.2)">
              <circle cx="-3.75" cy="1.5" r="1.5" fill="#FF8A9A" opacity="0.8" />
              <circle cx="3.75" cy="1.5" r="1.5" fill="#FF8A9A" opacity="0.8" />
              <g stroke="#2F2E2A" fill="none" strokeLinecap="round">
                <path strokeWidth="1.05" d="M -4.5 -0.8 Q -2.625 -2.675 -0.75 -0.8" />
                <path strokeWidth="1.35" d="M 1.125 -0.05 L 3.375 -1.925" />
                <path strokeWidth="1.35" d="M 1.125 -1.925 L 3.375 -0.05" />
              </g>
              <path d="M -1.5 2 Q 0.375 3.35 2.25 2" stroke="#2F2E2A" strokeWidth="1.05" strokeLinecap="round" fill="none" />
            </g>
          </g>
          <g className="transition-all duration-300">
            <circle cx="162" cy="85" r="11.5" fill="#FCFBF7" opacity="0.95" />
            <circle cx="162" cy="85" r="10" fill="#FF8A9A" stroke="#2F2E2A" strokeWidth="1.8" />
            <g transform="translate(162, 85.5)">
              <circle cx="-2.75" cy="0.7" r="1.1" fill="#FF8A9A" opacity="0.8" />
              <circle cx="2.75" cy="0.7" r="1.1" fill="#FF8A9A" opacity="0.8" />
              <g fill="#2F2E2A">
                <ellipse cx="-1.925" cy="-0.5" rx="0.495" ry="0.825" />
                <ellipse cx="1.925" cy="-0.5" rx="0.495" ry="0.825" />
              </g>
              <path d="M -1.1 1.2 Q 0.275 2.19 1.65 1.2" stroke="#2F2E2A" strokeWidth="0.77" strokeLinecap="round" fill="none" />
            </g>
          </g>
        </g>
      </g>
      <g>
        <text x="150" y="242" textAnchor="middle" className="logo-title text-2xl transition-all duration-300" style={{ fontSize: '23px' }}>Kinship</text>
        <text x="150" y="262" textAnchor="middle" className="logo-sub select-none transition-all duration-300" style={{ fontSize: '9px', letterSpacing: '0.18em' }}>Our Family Tree</text>
      </g>
    </svg>
  );
}
