import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'

const Polyndrom = () => {
    const navigate = useNavigate()
    const [number, setNumber] = useState(0)
    const [boomNow, setBoomNow] = useState(false)

    function isPalindrome(str) {        
        // Compare characters from the center outward
        for (let i = 0; i < Math.floor(str.length / 2); i++) {
          if (str[i] !== str[str.length - 1 - i]) {
            return false; // Not a palindrome
          }
        }
        
        return true; // It's a palindrome
      }
  
    const boom = () => {
        if (isPalindrome(number) && number != "") {
          setBoomNow(true)
        }
    }
    
    const end = () => {
      setBoomNow(false)
      setNumber(0)
    }
  
    return (
      <div className="App2">
        {!boomNow ? <>
        <h1 className='toTheRight'>פילנדרום או לא</h1>
        <div onClick={() => navigate('/')}><p className='backtoYOu'>&#8592;</p></div>
        <div onClick={() => boom()} className='button2'><input onChange={(e) => setNumber(e.target.value)} className='inputButton' placeholder="טקסט"/></div>
        </> : <h1>correct</h1>}
      </div>
    );
  }
  

export default Polyndrom;
