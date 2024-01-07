import React from 'react';
import Editor from "@monaco-editor/react";

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
