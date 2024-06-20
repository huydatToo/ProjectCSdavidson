import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; 

const customStyle = {
  backgroundColor: '#00000000', 
  color: '#e6e6e6',
  padding: '1em',
  fontSize: '16px',
  borderRadius: '4px',
  height: "56vh",
};

const customTheme = {
  ...duotoneDark, 
  'code[class*="language-"]': {
    ...duotoneDark['code[class*="language-"]'], 
    backgroundColor: '#00000000', 
    color: '#e6e6e6',
    padding: '1em', 
    fontSize: '16px', 
    borderRadius: '4px', 
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
