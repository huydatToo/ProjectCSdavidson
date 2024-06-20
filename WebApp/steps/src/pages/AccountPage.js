import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../utils/WalletContext';
import {ReactComponent as ParticipantsSvg} from '../assets/person-group-svgrepo-com.svg'
import Patch from '../assets/patch_gray.png'
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {ReactComponent as HomeSvg} from '../assets/home.svg';

const AccountPage = () => {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate()
    const { accountAddress } = useParams();
    const { contract  } = useWallet();


    async function isUserParticipateInProject(projectName, addr, changes) {
        for (let index = 0; index < changes.length; index++) {
            const changeMakerAddress = await contract.getChangeMaker(projectName, changes[index]);
            if (addr.toLowerCase() === changeMakerAddress.toLowerCase()) {
                return true;
            }
        }

        return false;
    }


    async function getRecentActivity() {
        const lastProjectsNow = await contract.getLastProjects();
        let projectsParticipatedIn = [];

        for (const projectName of lastProjectsNow) {            
            let changes = await contract.getChangesOrProposals(projectName, true);
            const participate = await isUserParticipateInProject(projectName, accountAddress, changes);

            if (participate) {
                const participants = await contract.getParticipants(projectName);
                projectsParticipatedIn.push({name: projectName, participants: participants.length, changes: changes.length });
            }
        }
        setProjects(projectsParticipatedIn);
    }
    
    
    function getFormatAddress(address, startLength = 6, endLength = 4) {
        if (!address) return '';
      
        const start = address.substring(0, startLength);
        const end = address.substring(address.length - endLength);
      
        return `${start}...${end}`;
    }

    useEffect(() => {
        getRecentActivity()
    }, []);

    return (
    <div className='background center'>
        <div className='DistributionAndDev'>
            <div className='accountDiv'>
                <div className='leftSideAccount'>
                    <div className='accountBox'>
                        <div className='centerSquare'>
                            <img className='square' src={`https://effigy.im/a/${accountAddress}.png`} alt=""/>
                        </div>
                        <div className='addressBox'>
                            <span className='Address'>{getFormatAddress(accountAddress)}</span>
                            <span className='addressSpan'>Address</span>
                        </div>
                    </div>

                    <motion.div whileTap={{y: 6}} whileHover={{y: 3}} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate('/')}} className='projectHeaderAccount'>
                        <HomeSvg width={70} height={70}/>
                    </motion.div>
                </div>

                <div className='accountRecentActivityBox'>
                    <span className='recentActivityHeader'>Recent Activity</span>
                    <div className='projectsBoxesAccount'>
                    {projects.map((project, index) => (
                        <div onClick={() => {navigate(`/project/${project.name}`)}} key={index} className='projectBoxAccount'>
                            <span className='spanProjectName'>{project.name}</span> 
                            <div className="participantsDiv">
                            <ParticipantsSvg className="svgParticipants" width={30} height={30}/> 
                            <span className='spanProjectName'>{project.participants}</span>

                            <img className='patchPngGray' src={Patch} alt="Patches" />
                            <span className='spanProjectName'>{project.changes}</span>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default AccountPage;
