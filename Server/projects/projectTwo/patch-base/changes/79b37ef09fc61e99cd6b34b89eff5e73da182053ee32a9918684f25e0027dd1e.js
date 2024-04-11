import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Sign = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState({username: "", password: "", rePassword: ""});
    const [pass, setPass] = useState(false)
    const [wrong, setWrong] = useState(0)

    const send = () => {
        if (user.username.length >= 5 && user.username.length <= 8 && user.password === user.rePassword && user.password !== "" && user.rePassword !== "") {
            setPass(true)
        } else {
            setWrong(wrong+1)
        }
    }
    return (
        <div className='background-Sign'>
            {wrong < 3 ?
            <>
            {!pass ? 
            <motion className='form-log'>
                <div onClick={() => navigate('/')}><p className='back'>&#8592;</p></div>
                <h3>התחבר</h3>

                <label for="username">שם משתמש</label>
                <input onChange={(e) => {setUser({...user, username: e.target.value})}} className='input-log' type="text" placeholder="שם משתמש"/>

                <label className='label-log' for="password">סיסמה</label>
                <input onChange={(e) => {setUser({...user, password: e.target.value})}} className='input-log' type="password" placeholder="סיסמה"/>

                
                <label className='label-log' for="password">עוד סיסמה</label>
                <input onChange={(e) => {setUser({...user, rePassword: e.target.value})}} className='input-log' type="password" placeholder="סיסמה"/>
                
                <select className='selectBOG'>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>

                <button onClick={() => send()} className='button-log'>שלח</button>
            </motion>
            : <><div className='signed'><h1>עברת</h1></div></>}
            </>
            : <><div className='signed'><h1>אינך מורשה</h1></div></>}
        </div>
    )
}

export default Sign