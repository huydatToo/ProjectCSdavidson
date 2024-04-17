import React from 'react'
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom'



const Select = () => {
  const navigate = useNavigate()

  return (
    <>
    <div className='selectDiv'>
      <motion.div onClick={() => {navigate("boom")}} initial={{ scale:0 }} animate={{ scale:1 }} className='selectBox'>
        <h1>שבע בום</h1>
      </motion.div>

      <motion.div onClick={() => {navigate("sign")}} initial={{ scale:0 }} animate={{ scale:1 }} className='selectBox'>
        <h1>התחברות</h1>
      </motion.div>

      <motion.div onClick={() => {navigate("circle")}} initial={{ scale:0 }} animate={{ scale:1 }} className='selectBox'>
        <h1>עד 10</h1>
      </motion.div>

      <motion.div onClick={() => {navigate("exam")}} initial={{ scale:0 }} animate={{ scale:1 }} className='selectBox'>
        <h1>מבחן הבית</h1>
      </motion.div>

      <motion.div onClick={() => {navigate("exam2")}} initial={{ scale:0 }} animate={{ scale:1 }} className='selectBox'>
        <h1>2 מבחן הבית</h1>
      </motion.div>

      <motion.div onClick={() => {navigate("poly")}} initial={{ scale:0 }} animate={{ scale:1 }} className='selectBox'>
        <h1>פולינדרום</h1>
      </motion.div>


      <h1 className='bhar'>:בחר פרויקט</h1>

    </div>
    </>
  )
}

export default Select