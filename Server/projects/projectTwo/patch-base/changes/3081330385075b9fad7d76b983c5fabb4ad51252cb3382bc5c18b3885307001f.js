import React from 'react';
import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';

const ExamPage3 = () => {
  const navigate = useNavigate()
  return (
    <div className='backgroundExam3 ExamCenter'>
      <div style={{color: "#ffffff"}} onClick={() => navigate('/exam')}><p className='back'>&#8592;</p></div>
      <ReactPlayer
        playing={true}
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
        controls={true}
        width="100%"
        height="70%"
      />

    <div>
      <h1 className='lo2'>כניסה לרשומים</h1>
    </div>

    </div>
  );
}

export default ExamPage3;
