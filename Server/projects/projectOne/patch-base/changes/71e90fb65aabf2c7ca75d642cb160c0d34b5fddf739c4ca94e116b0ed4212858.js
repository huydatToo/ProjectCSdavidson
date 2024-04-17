import React, {useState} from 'react'
import ReactPlayer from 'react-player'
import { useNavigate } from 'react-router-dom'

const Circle = () => {
    const [counter, setCounter] = useState(0)
    const navigate = useNavigate()
    const [exist, setExist] = useState(true)

    const end = () => {
        setCounter(0)
        setExist(true)
    }

    const click = () => {
        if (counter === 9) {
            setExist(2)
        } else {
            setCounter(counter+1)
            setExist(false)
            setTimeout(() => {
                setExist(true)
            }, 300);
        }
    }
    return (
    <div className='background-circle center-circle'>
        {exist !== 2 ? <>
        <div className='box-circle-2'>
            <div onClick={() => navigate('/')}><p className='back'>&#8592;</p></div>
            <h1 className='title-circle'>תלחץ 10 פעמים</h1>
        </div>
        <div onClick={() => click()} className='box-circle'>
            <h1 className='text-circle'>{exist ? "תלחץ" : counter}</h1>
        </div>
        </>
        : <ReactPlayer
        playing={true}
        onEnded={() => end()}
        url="./video.mp4" 
        controls={false}
        width="100%"
        height="auto"
        />}
    </div>
)}

export default Circle