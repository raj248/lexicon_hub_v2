function makeInjectedCSS(theme: any, fontSize = 16, lineHeight = 1.45) {
  return `
    html, body {
      background: ${theme.background};
      color: ${theme.foreground};
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: none;
    }

    body {
      font-family: 'System';
      font-size: ${fontSize}px;
      // line-height: ${lineHeight};
      padding: 16px;
    }

    p {
        line-height: ${lineHeight}; /* Sets line height to 1.6 times the font size */
      }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 8px auto;
    }

    pre, code {
      white-space: pre-wrap;
      word-break: break-word;
    }

    a {
      all: unset;
      font-weight: 600;
      cursor: pointer;
    }
  `;
}
export default makeInjectedCSS;
