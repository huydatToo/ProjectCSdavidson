import React from 'react';
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom';

const Exam = () => {
  const navigate = useNavigate();
  return (
    <div className='backgroundExam ExamCenter'>
        <motion.div transition={{ type: "spring", stiffness: 100 }} initial={{scale: 0.7}} animate={{scale: 1}} exit={{scale: 0}} className='headerPageOne'>
          <h1 className='headerPageOneH1'>מבחן הבית</h1>
          <span className='headerPageOneSpan'>מגיש: איתמר פלג</span>
        </motion.div>

        <motion.div onClick={() => {navigate("login")}} whileTap={{scale: 0.9}} whileHover={{scale: 1.1}} transition={{ type: "spring", stiffness: 300 }} initial={{scale: 0.0}} animate={{scale: 1}} exit={{scale: 0}} className='buttonExamPageOne'>
          <h1>ברוכים הבאים לאפליקציה שלי</h1>
        </motion.div>
    </div>
  );
}

export default Exam;
