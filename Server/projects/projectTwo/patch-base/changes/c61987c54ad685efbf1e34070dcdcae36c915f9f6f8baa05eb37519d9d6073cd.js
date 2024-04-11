import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Select from './Select';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sign from './Sign';
import Circle from './Circle';
import Exam from './Exam/Exam';
import LoginExam from './Exam/LoginExam';
import ExamPage4 from './Exam/ExamPage4';
import ExamPage3 from './Exam/ExamPage3';
import ExamPage5 from './Exam/ExamPage5';

import Exam2 from './Exam2/Exam2';
import LoginExam2 from './Exam2/Login2Exam';
import Exam2Page4 from './Exam2/Exam2Page4';
import Exam2Page3 from './Exam2/Exam2Page3';
import Exam2Page5 from './Exam2/Exam2Page5';
import Game from './Game';
import Polyndrom from './Polyndrom';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
      <Routes>
        <Route path="/" element={<Select />} />
        <Route path="/BOOM" element={<App />} />
        <Route path="/circle" element={<Circle />} />
        <Route path="/sign" element={<Sign />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/exam/login" element={<LoginExam />} />
        <Route path="/exam/page4" element={<ExamPage4 />} />
        <Route path="/exam/page3" element={<ExamPage3 />} />
        <Route path="/exam/page5" element={<ExamPage5 />} />

        <Route path="/exam2" element={<Exam2 />} />
        <Route path="/exam2/login" element={<LoginExam2 />} />
        <Route path="/exam2/page4" element={<Exam2Page4 />} />
        <Route path="/exam2/page3" element={<Exam2Page3 />} />
        <Route path="/exam2/page5" element={<Exam2Page5 />} />
        <Route path="/exam2/page3/game" element={<Game />} />
        <Route path="/poly" element={<Polyndrom />} />

      </Routes>
    </Router>
);