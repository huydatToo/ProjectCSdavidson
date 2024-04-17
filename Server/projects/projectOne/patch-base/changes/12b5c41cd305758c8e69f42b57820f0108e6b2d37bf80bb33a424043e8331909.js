import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExamPage5 = () => {
  const navigate = useNavigate()

  return (
    <div className='backgroundExam5'>
        <div style={{color: "#ffffff"}} onClick={() => navigate('/exam')}><p className='back'>&#8592;</p></div>
        <h1 className='lo2'>כניסת מנהלים</h1>
    </div>
  );
}

export default ExamPage5;
