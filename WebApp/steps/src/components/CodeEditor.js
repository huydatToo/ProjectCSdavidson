import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Import a base theme

const customStyle = {
  backgroundColor: '#00000000', // Background color
  color: '#e6e6e6', // Text color (red)
  padding: '1em', // Padding around the code block
  fontSize: '16px', // Font size of the code
  borderRadius: '4px', // Rounded corners
  height: "56vh",
};

const customTheme = {
  ...duotoneDark, // Start with the base theme
  'code[class*="language-"]': {
    ...duotoneDark['code[class*="language-"]'], // Start with the base theme for code blocks
    backgroundColor: '#00000000', // Background color
    color: '#e6e6e6', // Text color (red)
    padding: '1em', // Padding around the code block
    fontSize: '16px', // Font size of the code
    borderRadius: '4px', // Rounded corners
    height: "56vh",
  },
};


const CodeEditor = (code, language) => {
  return (
    <div className='codeEditor'>
    <SyntaxHighlighter language={"javascript"} style={customTheme} customStyle={customStyle} showLineNumbers={true}>
    {code}
    </SyntaxHighlighter>
    </div>

  );
}

export default CodeEditor;
