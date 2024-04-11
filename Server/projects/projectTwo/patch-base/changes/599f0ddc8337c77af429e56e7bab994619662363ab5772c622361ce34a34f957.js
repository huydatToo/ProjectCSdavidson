import { useState } from 'react';
import './App.css';
import ReactPlayer from 'react-player'
import { useNavigate } from 'react-router-dom'


function App() {
  const navigate = useNavigate()
  const [number, setNumber] = useState(0)
  const [boomNow, setBoomNow] = useState(false)

  const boom = () => {
      if (number % 7 === 0 && number !== 0) {
        setBoomNow(true)
      }
  }
  
  const end = () => {
    setBoomNow(false)
    setNumber(0)
  }

  return (
    <div className="App">
      {!boomNow ? <>
      <h1 className='toTheRight'>!שבע בום</h1>
      <div onClick={() => navigate('/')}><p className='backtoYOu'>&#8592;</p></div>
      <div onClick={() => boom()} className='button'><input onChange={(e) => setNumber(e.target.value)} className='inputButton' placeholder="מספר"/></div>
      </> : <ReactPlayer
        playing={true}
        onEnded={() => end()}
        url="./video.mp4" 
        controls={false}
        width="100%"
        height="auto"
      />}
    </div>
  );
}

export default App;
