import React from 'react';

const CountryFlag = ({ countryCode, size = 20 }) => {
  const flags = {
    BR: (
      <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <rect width="512" height="512" fill="#009739"/>
        <path d="M256,85.3 L341.3,213.3 L170.7,213.3 Z" fill="#FEDD00"/>
        <circle cx="256" cy="213.3" r="64" fill="#012169"/>
        <path d="M256,149.3 L270.9,193.1 L317.3,193.1 L280.4,220.5 L295.3,264.3 L256,237.9 L216.7,264.3 L231.6,220.5 L194.7,193.1 L241.1,193.1 Z" fill="#FEDD00"/>
      </svg>
    ),
    US: (
      <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <rect width="512" height="512" fill="#B22234"/>
        <rect width="512" height="38.4" fill="#FFFFFF"/>
        <rect y="76.8" width="512" height="38.4" fill="#FFFFFF"/>
        <rect y="153.6" width="512" height="38.4" fill="#FFFFFF"/>
        <rect y="230.4" width="512" height="38.4" fill="#FFFFFF"/>
        <rect y="307.2" width="512" height="38.4" fill="#FFFFFF"/>
        <rect y="384" width="512" height="38.4" fill="#FFFFFF"/>
        <rect y="460.8" width="512" height="38.4" fill="#FFFFFF"/>
        <rect width="204.8" height="268.8" fill="#3C3B6E"/>
      </svg>
    ),
    ES: (
      <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <rect width="512" height="170.7" fill="#AA151B"/>
        <rect y="170.7" width="512" height="170.7" fill="#F1BF00"/>
        <rect y="341.3" width="512" height="170.7" fill="#AA151B"/>
      </svg>
    )
  };

  return flags[countryCode] || null;
};

export default CountryFlag;
