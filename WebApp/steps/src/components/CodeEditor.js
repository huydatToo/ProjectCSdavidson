import React from 'react';
import Editor from "@monaco-editor/react";

// the function returns the component of a code editor
const CodeEditor = (text) => {
  return (
    <div className='editor'>
    <Editor
        language="python"
        theme="vs-dark"
        className='editor'
        value={text}
    />
    </div>
  );
}

export default CodeEditor;
