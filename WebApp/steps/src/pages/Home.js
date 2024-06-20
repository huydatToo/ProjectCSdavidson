import { motion, AnimatePresence  } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../utils/WalletContext';
import {ReactComponent as ParticipantsSvg} from '../assets/person-group-svgrepo-com.svg';
import {ReactComponent as ArrowDown} from '../assets/down-arrow-svgrepo-com.svg';
import Patch from '../assets/patch_gray.png'


// the home page
function Home() {
  const { contract } = useWallet();
  const navigate = useNavigate();
  const [isButtons, setIsButtons] = useState({new_project: 0, my: 0})
  const [projectsJump, setProjectsJump] = useState({popular_projects: 0, recent_activity: 0});
  const [projectsHover, setProjectsHover] = useState({popular_projects: false, recent_activity: false});
  const [lastProjects, setLastProjects]  = useState({lastProjects: [], localProjects: []});
  const { isConnected, checkWalletConnection, setIsConnected, setAccount, account } = useWallet();

  // connect smart wallet function
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        setAccount(accounts[0]);
        setIsButtons({new_project: 0, new: 2});
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    }
  };

  function getFormatAddress(address, startLength = 6, endLength = 4) {
      if (!address) return '';
    
      const start = address.substring(0, startLength);
      const end = address.substring(address.length - endLength);
    
      return `${start}...${end}`;
  }

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

  const getLastProjects = async () => {
    try {
      const lastProjectsNow = await contract.getLastProjects();
      const response = await fetch('http://127.0.0.1:8000/api/getLocalProjects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const { projects: localProjects } = await response.json();
      const processProject = async (projectName, projectsArray) => {
        const changes = await contract.getChangesOrProposals(projectName, true);
        const participants = await contract.getParticipants(projectName);
        projectsArray.push({ name: projectName, participants: participants.length, changes: changes.length });
      };
  
      const lastProjectsNowToSet = [];
      const popularProjects = [];
  
      await Promise.all(localProjects.map(async (projectName) => {
        await processProject(projectName, lastProjectsNowToSet);
      }));
  
      await Promise.all(lastProjectsNow.map(async (projectName) => {
        if (!localProjects.includes(projectName)) {
          await processProject(projectName, popularProjects);
        }
      }));
  
      setLastProjects({ lastProjects: popularProjects, localProjects: lastProjectsNowToSet });
    } catch (error) {
      console.error('Error:', error);
      setLastProjects({ lastProjects: [], localProjects: [] });
    }
  };
    


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
            <div onMouseEnter={() => {setProjectsHover({...projectsHover, popular_projects: lastProjects.lastProjects.length > 4 ? true : false})}} onMouseLeave={() => {setProjectsHover({...projectsHover, popular_projects: false, cursor: projectsHover.popular_projects ? "pointer" : "default"})}} className='TitleProjects'>
              <ArrowDown onClick={() => {setProjectsJump({...projectsJump, popular_projects: projectsJump.popular_projects+1 < lastProjects.lastProjects.length && projectsJump.popular_projects+4})}} style={{opacity: projectsHover.popular_projects ? "1" : "0", cursor: projectsHover.popular_projects ? "pointer" : "default"}} className="arrowDown" width={50} height={50}/>
              <h1 className='Title'>Popular Projects</h1>
              <ArrowDown onClick={() => {setProjectsJump({...projectsJump, popular_projects: projectsJump.popular_projects-1 > 0 && projectsJump.popular_projects-4})}} style={{opacity: projectsHover.popular_projects ? "1" : "0", cursor: projectsHover.popular_projects ? "pointer" : "default"}} className="arrowDown arrowUp" width={50} height={50}/>
            </div>
            {lastProjects.lastProjects.slice(projectsJump.popular_projects, projectsJump.popular_projects+4).map((project, index) => (
            <motion.div onClick={() => {navigate(`project/${project.name}`)}} key={index} whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} className='project-box-load'>
              <span className='project-box-header'>{project.name.slice(0, 12)}</span>
              <div className='divProjectsHome'>
                <div className='centerProjectBox'>
                  <ParticipantsSvg className="svgParticipants" width={30} height={30}/> 
                  <span className='spanProjectName'>{project.participants}</span>
                </div>
                <div className='centerProjectBox'>
                  <img className='patchPngGray' src={Patch} alt="Patches" />
                  <span className='spanProjectName'>{project.changes}</span>
                </div>
              </div>
            </motion.div>
            ))}
          </div>

          <div>
            <div onClick={() => {checkConnectedOnButtonPress("createNewProject")}}>
            <AnimatePresence initial={false} mode='wait'>
            {isButtons.new_project === 0 ?
            <motion.div key={"createNewProjectButton"} whileTap={{scale: 0.9}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.1 }} className='box-create-project'>
              <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: 0.9, opacity: 0.2 }} transition={{ type: "spring", duration: 0.1 }}  key={"createNewProjectButtonH1"} className='Title TitleCreatePorject'>Create <br /> New Project</motion.h1>
            </motion.div>
            : 
            <motion.div key={"connectYourWalletNewProjectButton"} whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.1 }} className='box-create-project'>
              <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: 0.9, opacity: 0.2 }} transition={{ type: "spring", duration: 0.1 }}  key={"connectYourWalletNewProjectButtonH1"} className='Title TitleCreatePorject'>Connect <br /> Your wallet</motion.h1>
            </motion.div>
            }
            </AnimatePresence>
            </div>
            

            <motion.div transition={{ type: "spring", duration: 0.7 }} className='box-account'>
              <div onClick={() => navigate("/"+account)} className='centerSquare'>
                  <img className='squareWhite' src={`https://effigy.im/a/${account}.png`} alt=""/>
              </div>
              <div className='addressBox'>
                  <span className='Address'>{getFormatAddress(account)}</span>
                  <span className='addressSpan'>Address</span>
              </div>
            </motion.div>
          </div>

          <div className='box-projects'>
            <div onMouseEnter={() => {setProjectsHover({...projectsHover, recent_activity: lastProjects.localProjects.length > 4 ? true : false})}} onMouseLeave={() => {setProjectsHover({...projectsHover, recent_activity: false})}} className='TitleProjects'>
              <ArrowDown onClick={() => {setProjectsJump({...projectsJump, recent_activity: projectsJump.recent_activity+1 < lastProjects.lastProjects.length && projectsJump.recent_activity+4})}} style={{opacity: projectsHover.recent_activity ? "1" : "0", cursor: projectsHover.recent_activity ? "pointer" : "default"}} className="arrowDown" width={50} height={50}/>
              <h1 className='Title'>Recent Activity</h1>
              <ArrowDown onClick={() => {setProjectsJump({...projectsJump, recent_activity: projectsJump.recent_activity-1 > 0 && projectsJump.recent_activity-4})}} style={{opacity: projectsHover.recent_activity ? "1" : "0", cursor: projectsHover.recent_activity ? "pointer" : "default"}} className="arrowDown arrowUp" width={50} height={50}/>
            </div>
            {lastProjects.localProjects.map((project, index) => (
            <motion.div onClick={() => {navigate(`project/${project.name}`)}} key={index} whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} className='project-box-load'>
              <span className='project-box-header'>{project.name.slice(0, 12)}</span>
              <div className='divProjectsHome'>
                <div className='centerProjectBox'>
                  <ParticipantsSvg className="svgParticipants" width={30} height={30}/> 
                  <span className='spanProjectName'>{project.participants}</span>
                </div>
                <div className='centerProjectBox'>
                  <img className='patchPngGray' src={Patch} alt="Patches" />
                  <span className='spanProjectName'>{project.changes}</span>
                </div>
              </div>
            </motion.div>
            ))}

          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Home;
