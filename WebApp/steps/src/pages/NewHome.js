import React, {useEffect, useState} from 'react';
import BentoGrid from "@bentogrid/core";
import downArrow from '../assets/down-arrow-svgrepo-com.svg';
import newProject from '../assets/create-folder-svgrepo-com.svg';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../utils/WalletContext';
import { MetaMaskAvatar } from 'react-metamask-avatar';
import { motion, AnimatePresence  } from 'framer-motion';

const NewHome = () => {
    const [lastProjects, setLastProjects]  = useState({lastProjects: [], localProjects: []})
    const navigate = useNavigate()
    const { contract, account, checkWalletConnection } = useWallet();
    const [hoverNewProject, setHoverNewProject] = useState(false);
        
    useEffect(() => {
        const myBento = new BentoGrid({
            target: '.bentogrid',
            cellGap: 10,
            balanceFillers: false,
            columns: 4,
        });
        checkWalletConnection()
        getLastProjects()
      }, []);
    
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
    }}

    function getFormatAddress(address, startLength = 6, endLength = 4) {
        if (!address) return '';
      
        const start = address.substring(0, startLength);
        const end = address.substring(address.length - endLength);
      
        return `${start}...${end}`;
    }
    
    return (
        <div className='backgroundNew center'>
            <div className='boxes'>
                <div class="bentogrid">
                    <div onClick={() => navigate("/createNewProject")} className='box boxCreateNewProject' data-bento="1x1" onMouseLeave={() => setHoverNewProject(false)} onMouseEnter={() => setHoverNewProject(true)}>
                        <AnimatePresence initial={false} mode='wait'>
                        {!hoverNewProject ? 
                            <motion.div initial={{scale: 0.91}} animate={{scale: 1}} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.1 }} key={"divBoxNewProject"} className='boxBox-newProject'>
                                <motion.img key={"divBoxNewProjectImg"} src={newProject} alt="" />
                            </motion.div> 
                            : 
                            <motion.h1 initial={{scale: 0.91}} animate={{scale: 1}} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.1 }} key={"divBoxNewProjectH1"} className='BoxboxTitle'>Create <br /> New Project</motion.h1>
                        }
                        </AnimatePresence>
                    </div>
                    <div className='box boxBox-search' data-bento="2x1">
                        <h1 className='boxTitle'>Search</h1>
                        <input className='search' type="text"/>
                    </div>
                    <div className='box' data-bento="2x1">
                        <div className='center'>
                            <div className='BoxUserData'>
                                <div className='centerSquare'><MetaMaskAvatar className='square' address={account} size={40} /></div>
                                <h3 className='boxTitle'>{getFormatAddress(account)}</h3>
                            </div>
                        </div>
                    </div>
                    <div className='box' data-bento="1x2">
                        <div className='Boxbox-projects'>
                            <h1 className='boxTitle'>Recent activity</h1>
                            {lastProjects.localProjects.map((item, index) => (
                            <div onClick={() => {navigate(`/project/${item}`)}} key={index} whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} className='BoxProject-box-load'>
                            <span className='project-box-header'>{item}</span>
                            <span>----------- | -----------</span>
                            </div>
                            ))}
                        </div>
                    </div>
                    <div className='box boxBox-arrow-down' data-bento="1x1">
                        <div className='boxBox-arrow-down'>
                            <img src={downArrow} alt="" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewHome;
