import React, { useState } from 'react';
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom';
import { db } from "../firebase-config";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
} from "firebase/firestore";


const Exam = () => {
  const UsersCollectionRef = collection(db, 'users');
  const [user, setUser] = useState({username: "", password: ""});
  const navigate = useNavigate();
  

  const getUser = async (id) => {
    const userDoc = doc(UsersCollectionRef, id);
    return await getDoc(userDoc);
  }

  const checkUserExist = async (username, password) => {
    const q = query(UsersCollectionRef, where('name', '==', username), where('password', '==', password));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userId = querySnapshot.docs[0].id;
        return { exists: true, userId };
    } else {
        return { exists: false, userId: null };
    }
  }


  const send = async () => {
    const userFB = await checkUserExist(user.username, user.password)
    if (userFB.exists) { 
      const userData = await getUser(userFB.userId)
      if (userData.data().admin) {
        navigate("/exam2/page5")
      } else {
      navigate("/exam2/page3", {state: userFB.userId})
      }
    } else {
      navigate("/exam2/login")
    }
  }

  return (
    <div className='backgroundExam ExamCenter'>
        <motion.div transition={{ type: "spring", stiffness: 100 }} initial={{scale: 0.7}} animate={{scale: 1}} exit={{scale: 0}} className='headerPageOne'>
          <h1 className='headerPageOneH1'>מבחן הבית</h1>
          <span className='headerPageOneSpan'>מגיש: איתמר פלג</span>
        </motion.div>

        <motion.div onClick={() => {navigate("login")}} whileTap={{scale: 0.9}} whileHover={{scale: 1.1}} transition={{ type: "spring", stiffness: 300 }} initial={{scale: 0.0}} animate={{scale: 1}} exit={{scale: 0}} className='buttonExamPageOne'>
          <h1>ברוכים הבאים לאפליקציה שלי</h1>
        </motion.div>

        <motion.div onClick={() => send()} transition={{ type: "spring", stiffness: 300 }} initial={{scale: 0.0}} animate={{scale: 1}} exit={{scale: 0}} className='buttonExamPageOne'>
          <h1>הכנס שם וסיסמה</h1>
        </motion.div>

        <motion.div className='buttonExamPageOne'>
          <input onChange={(e) => {setUser({...user, username: e.target.value})}} onClick={(e) => {e.preventDefault()}} placeholder={"username"} type="text" />
          <input onChange={(e) => {setUser({...user, password: e.target.value})}} onClick={(e) => {e.preventDefault()}} placeholder={"password"} type="text" />
        </motion.div>

    </div>
  );
}

export default Exam;
