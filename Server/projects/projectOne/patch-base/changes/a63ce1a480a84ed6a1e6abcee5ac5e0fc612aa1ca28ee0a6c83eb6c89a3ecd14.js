import { db } from "../firebase-config";
import {
    collection,
    getDocs,
    addDoc,
    doc,
    query,
    where,
} from "firebase/firestore";

const UsersCollectionRef = collection(db, 'users');

const addUser = (newUser) => {
    return addDoc(UsersCollectionRef, newUser);
}

const getAllUsers = () => {
    return getDocs(UsersCollectionRef);
}

const getUser = (id) => {
    const userDoc = doc(UsersCollectionRef, id);
    return getDocs(userDoc);
}

const checkUserExist = async (username, password) => {
    const q = query(UsersCollectionRef, where('username', '==', username), where('password', '==', password));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const userId = querySnapshot.docs[0].id;
        return { exists: true, userId };
    } else {
        return { exists: false, userId: null };
    }
}

export { addUser, getAllUsers, getUser, checkUserExist };
