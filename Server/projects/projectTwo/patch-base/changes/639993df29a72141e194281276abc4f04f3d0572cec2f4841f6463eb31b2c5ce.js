import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebase-config";
import {
    collection,
    getDocs,
} from "firebase/firestore";


const ExamPage5 = () => {
  const navigate = useNavigate()
  const UsersCollectionRef = collection(db, 'users');
  const [allUsers, setAllUsers] = useState([]);
  
  const getAllUsers = async () => {
    try {
      const allUsersDocs = await getDocs(UsersCollectionRef);
      const usersData = allUsersDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData);
    } catch (error) {
      console.error('Error getting all users:', error);
    }
  };

  useEffect(() => {
    getAllUsers()
  }, []);

  return (
    <div className='backgroundExam5'>
        <div style={{color: "#ffffff"}} onClick={() => navigate('/exam2')}><p className='back'>&#8592;</p></div>
        <h1 className='lo2'>כניסת מנהלים</h1>
        <h1 className='lo2'>{`${allUsers.length} - משתמשים`}</h1>
        {allUsers.map((user) => (
          <div className='lo3' key={user.id}>
            <p>User ID: {user.id}</p>
            <p>User Name: {user.name}</p>
          </div>
        ))}
    </div>
  );
}

export default ExamPage5;
