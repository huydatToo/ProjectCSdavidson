import { motion, AnimatePresence  } from 'framer-motion';
import downArrow from '../assets/down-arrow-svgrepo-com.svg';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../utils/WalletContext';
import PageLearn from './PageLearn'
import { Link } from 'react-scroll';


// the home page
function Home() {
  const { contract } = useWallet();
  const scrollRef = useRef(null)
  const navigate = useNavigate()
  const [isButtons, setIsButtons] = useState({new_project: 0, my: 0})
  const [lastProjects, setLastProjects]  = useState({lastProjects: [], localProjects: []})
  const [hoverDown, setHoverDown]  = useState(false)
  const { isConnected, checkWalletConnection, setIsConnected, setAccount } = useWallet();

  // connect smart wallet function
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        setAccount(accounts[0]);
        setIsButtons({new_project: 0, new: 2})
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    }
  };

  // the function check whether a user is connected or not
  const checkConnectedOnButtonPress = (buttonPressed) => {
    if (buttonPressed === "createNewProject" && isConnected === false) {
      if (isButtons.new_project === 1) {
        connectWallet()
      } else if (isButtons.new_project === 0) {
        setIsButtons({...isButtons, new_project: 1})
      }
    } else if (buttonPressed === "createNewProject" && isConnected === true) {
      navigate('/createNewProject')
    }
  }

  // TEMP
  const getLastProjects = async () => {
    let lastProjectsNow = await contract.getLastProjects();
    lastProjectsNow = lastProjectsNow.filter(str => str !== "");
    try {
      const response = await fetch('http://127.0.0.1:8000/api/getLocalProjects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json(); 
      setLastProjects({lastProjects: lastProjectsNow, localProjects: data.projects})
    } catch (error) {
      console.error('Error:', error);
      setLastProjects({lastProjects: lastProjectsNow, localProjects: []})
    }
  }

  // the function initiate the page
  useEffect(() => {
    if (isConnected) {
      setIsButtons({new_project: 0, new: 2})
      getLastProjects()
    }
  }, [checkWalletConnection, isConnected]);

  // returns the page's react component
  return (
    <div className="background">
      <div name="pageOne" className='pageTwo center'>
      <div className='moveUp'>
        <div className='line lineGapHome'>
          <div className='box-search '>
            <h1 className='Title'>Search</h1>
            <input className='search' type="text"/>
          </div>
        </div>

        <div className='line lineGapHome'>
          <div className='box-projects'>
            <h1 className='Title'>Popular Projects</h1>
            {lastProjects.lastProjects.map((item, index) => (
            <motion.div onClick={() => {navigate(`project/${item}`)}} key={index} whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} className='project-box-load'>
              <span className='project-box-header'>{item}</span>
              <span>----------- | -----------</span>
            </motion.div>
            ))}
          </div>

          <div>
            <div onClick={() => {checkConnectedOnButtonPress("createNewProject")}}>
            <AnimatePresence initial={false} mode='wait'>
            {isButtons.new_project === 0 ?
            <motion.div key={"createNewProjectButton"} whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.1 }} className='box-create-project border-step4'>
              <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: 0.9, opacity: 0.2 }} transition={{ type: "spring", duration: 0.1 }}  key={"createNewProjectButtonH1"} className='Title TitleCreatePorject'>Create <br /> New Project</motion.h1>
            </motion.div>
            : 
            <motion.div key={"connectYourWalletNewProjectButton"} whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.1 }} className='box-create-project'>
              <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: 0.9, opacity: 0.2 }} transition={{ type: "spring", duration: 0.1 }}  key={"connectYourWalletNewProjectButtonH1"} className='Title TitleCreatePorject'>Connect <br /> Your wallet</motion.h1>
            </motion.div>
            }
            </AnimatePresence>
            </div>

            <Link to="pageTwo" smooth={true} duration={500}>
            <motion.div onMouseEnter={() => setHoverDown(true)} onMouseLeave={() => setHoverDown(false)}  whileHover={{scale: 1.03}} transition={{ type: "spring", duration: 0.7 }} className='box-arrow-down'>
              <motion.img animate={{ y: hoverDown ? 40 : 0 }} transition={{ type: "spring", duration: 0.7 }} className='arrowDown' src={downArrow} alt="" />
            </motion.div>
            </Link>
          </div>

          <div className='box-projects'>
            <h1 className='Title'>Recent activity</h1>
            {lastProjects.localProjects.map((item, index) => (
            <motion.div onClick={() => {navigate(`project/${item}`)}} key={index} whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} className='project-box-load'>
              <span className='project-box-header'>{item}</span>
              <span>----------- | -----------</span>
            </motion.div>
            ))}

          </div>
        </div>
      </div>
      </div>

      <div name="pageTwo" className='pageTwo background2 centerLearn'>
        <PageLearn scroll={scrollRef}/>
      </div>
    </div>
  );
}

export default Home;
