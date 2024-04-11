import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { db } from "../firebase-config";
import {
    getDoc,
    doc,
    collection,
} from "firebase/firestore";
import Game from '../Game';

const ExamPage3 = () => {
  const UsersCollectionRef = collection(db, 'users');
  const navigate = useNavigate()
  const location = useLocation();
  const userID = location.state;
  const [user, setUser] = useState({});

  const getUser = async(id) => {
    const userDoc = doc(UsersCollectionRef, id);
    return (await getDoc(userDoc)).data();
  }

  useEffect(async() => {
    const userData = await getUser(userID)
    setUser(userData)
  }, []);


  return (
    <div className='backgroundExam3 ExamCenter'>
      <div style={{color: "#ffffff"}} onClick={() => navigate('/exam2')}><p className='back'>&#8592;</p></div>
      <ReactPlayer
        playing={true}
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
        controls={true}
        width="100%"
        height="70%"
      />

    <div>
      <h1 onClick={() => {navigate("game")}} className='lo3'>למשחק</h1>
    </div>

    <div>
      <h1 className='lo2'>כניסה לרשומים</h1>
      <h1 className='lo3'>name: {user.name}, password: {user.password}, age: {user.age}, admin: {user.admin}, last name: {user.last_name}</h1>
    </div>
    </div>
  );
}

export default ExamPage3;
