import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExamPage4 = () => {
  const navigate = useNavigate()

  return (
    <div className='backgroundExam4 ExamCenter'>
        <div style={{color: "#ffffff"}} onClick={() => navigate('/exam')}><p className='back'>&#8592;</p></div>
        <h1 className='lo'>לא עברת</h1>
    </div>
  );
}

export default ExamPage4;
