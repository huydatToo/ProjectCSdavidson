import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LeftArrowSvg from '../assets/leftArrow.svg';
import { useWallet } from '../utils/WalletContext';
import HomeSvg from '../assets/home.svg';
import ModalChanges from '../components/ModalChanges';


const ProjectDevelopment = () => {
    const navigate = useNavigate()
    const { projectName } = useParams();
    const { contract } = useWallet();
    const [ChangeProposals, setChangeProposals] = useState([]);
    const [myChanges, setMyChanges] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    

    const getChangeProposals = async () => {
        const changeProposalsTemp = await contract.getProjectChangeProposals(projectName);
        setChangeProposals(changeProposalsTemp);
    }

    const openModal = () => {
        setModalOpen(true);
      };
    
    const closeModal = () => {
        setModalOpen(false);
    };

    const getMyChanges = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/get_my_changes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "name": projectName }),
          });
          const data = await response.json(); 
          setMyChanges(data["my_changes"])
          
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const uploadChanges = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/upload_changes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ "name": projectName }),
        });
        const data = await response.json(); 
        await contract.changeProposal(data["ipfsCID"], projectName)
        
      } catch (error) {
          console.error('Error:', error);
      }
  }

    const saveChanges = async () => {
        try {
          await fetch('http://127.0.0.1:8000/api/save_changes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "name": projectName }),
          });

          getMyChanges()
          
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    }    
    

    useEffect(() => {
      getChangeProposals();
      getMyChanges()
    }, [contract]);

    return (
        <div className='background middle center gapLines'>
        <ModalChanges isOpen={isModalOpen} closeModal={closeModal}>
        <div className='modalFlex'>
          <div className=''>
            <h1>My Changes</h1>
            <div className='modalFlex gap'>
            {myChanges.map((myChange, index) => (
              <div className='FileLine centerText' key={index}>
                <label className='CIDtext FileText'>{myChange}</label>
              </div>
            ))}
            </div>
          </div>

          <div className='boxesDownload'>
            <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {closeModal()}} className='projectHeader HomeButtonDiv'>
            <img className="HomeButton" src={LeftArrowSvg } alt="" />
            </motion.div>

            <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {uploadChanges()}} className='projectHeader HomeButtonDiv'>
            <h1>Upload Last Changes</h1>
            </motion.div>

            <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {saveChanges()}} className='projectHeader HomeButtonDiv'>
            <h1>Save Changes</h1>
            </motion.div>

          </div>
        </div>
        </ModalChanges>

            <div className='line projectHeaderLine'>
                <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate('/')}} className='projectHeader HomeButtonDiv'>
                    <img className="HomeButton" src={HomeSvg} alt="" />
                </motion.div>

                <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate(`/project/${projectName}`)}} className='projectHeader HomeButtonDiv'>
                    <img className="HomeButton" src={LeftArrowSvg} alt="" />
                </motion.div>

                <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
                    <h1>Update</h1>
                </motion.div>

                <motion.div onClick={() => {openModal()}} whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
                    <h1>My changes</h1>
                </motion.div>
            </div>

            <div className='line projectListFiles'> 
            {ChangeProposals.map((item, index) => (
                <div className='FileLine'>
                <span className='FileText'>{item}</span>
                <span className='FileText'>|</span>
                <span className='FileText'>Change Proposal</span>
            </div>))}
            </div>

        </div>
    );
}

export default ProjectDevelopment;
