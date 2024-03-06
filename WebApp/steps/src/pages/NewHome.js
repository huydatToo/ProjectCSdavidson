import React, {useEffect, useState} from 'react';
import BentoGrid from "@bentogrid/core";
import downArrow from '../assets/down-arrow-svgrepo-com.svg';
import newProject from '../assets/create-folder-svgrepo-com.svg';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../utils/WalletContext';

const NewHome = () => {
    const [lastProjects, setLastProjects]  = useState({lastProjects: [], localProjects: []})
    const navigate = useNavigate()
    const { contract } = useWallet();
    const [hoverNewProject, setHoverNewProject] = useState(false);

    useEffect(() => {
        const myBento = new BentoGrid({
            target: '.bentogrid',
            cellGap: 10,
            balanceFillers: false,
            columns: 4,
        });

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
    }
    }
    
    return (
        <div className='backgroundNew center'>
            <div className='boxes'>
                <div class="bentogrid">
                    <div className='box boxCreateNewProject' data-bento="1x1" onMouseLeave={() => setHoverNewProject(false)} onMouseEnter={() => setHoverNewProject(true)}>
                        {!hoverNewProject ? 
                            <div className='boxBox-newProject'>
                                <img src={newProject} alt="" />
                            </div> 
                            : 
                            <h1 className='BoxboxTitle'>Create <br /> New Project</h1>
                        }
                    </div>
                    <div className='box boxBox-search' data-bento="2x1">
                        <h1 className='boxTitle'>Search</h1>
                        <input className='search' type="text"/>
                    </div>
                    <div className='box' data-bento="2x1"></div>
                    <div className='box' data-bento="1x2">
                        <div className='Boxbox-projects'>
                            <h1 className='boxTitle'>Recent activity</h1>
                            {lastProjects.localProjects.map((item, index) => (
                            <div onClick={() => {navigate(`project/${item}`)}} key={index} whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} className='BoxProject-box-load'>
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
