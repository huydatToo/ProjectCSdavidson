import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LeftArrowSvg from '../assets/leftArrow.svg';
import { useWallet } from '../utils/WalletContext';
import HomeSvg from '../assets/home.svg';
import ModalChanges from '../components/ModalChanges';

// the project development page
const ProjectDevelopment = () => {
    const navigate = useNavigate()
    const { projectName } = useParams();
    const { contract } = useWallet();
    const [ChangeProposals, setChangeProposals] = useState([]);
    const [myChanges, setMyChanges] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [clickedChangeProposal, setClickedChangeProposal] = useState(false);
    const [clickedLocalChange, setClickedLocalChange] = useState(false);
    
    // the function save the change proposals in the project
    const getChangeProposals = async () => {
        const changeProposalsTemp = await contract.getChangesOrProposals(projectName, false);
        setChangeProposals(changeProposalsTemp);
    }


    // the functions open\close the modal
    const openModal = () => {
        setModalOpen(true);
      };
    
    const closeModal = () => {
        setModalOpen(false);
    };

    // the functions save the users changes.
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


    // the function call the vote in favor of a change function on the smart contract
    const voteForChange = async() => {
      await contract.acceptChangeProposal(clickedChangeProposal, projectName)
      navigate(`/project/${projectName}`)
    }

    // the function upload the local changes of a user IPFS and create a new change proposal
    const uploadChange = async () => {
      try {
        if (clickedLocalChange == false) {
          return -1;
        }
        
        const response = await fetch('http://127.0.0.1:8000/api/upload_changes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ "name": projectName, "change_name": clickedLocalChange }),
        });
        const data = await response.json(); 
        await contract.MakeChangeProposal(data["ipfsCID"], projectName)
        closeModal()
         
      } catch (error) {
          console.error('Error:', error);
      }
  }
  
  const deleteChange = async () => {
      try {
        if (clickedLocalChange == false) {
          return -1;
        }
        const response = await fetch('http://127.0.0.1:8000/api/delete_change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ "name": projectName, 'change_name': clickedLocalChange }),
        });
        const data = await response.json(); 
        setMyChanges(data["my_changes"]);
        
      } catch (error) {
          console.error('Error:', error);
      }
  }

    // the functions saves the users local changes
    const saveChanges = async () => {
        try {
          await fetch('http://127.0.0.1:8000/api/save_changes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "name": projectName, "change_name": clickedLocalChange }),
          });

          getMyChanges()
          
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    }    
    
    // initiate the page
    useEffect(() => {
      getChangeProposals();
      getMyChanges()
    }, [contract]);

    // returns the page's react component
    return (
        <div className='background middle center lineGap pageOne'>
        <ModalChanges isOpen={isModalOpen} closeModal={closeModal}>
        <div className='modalFlex'>
          <div className=''>
            <h1>My Changes</h1>
            <div className='modalFlex gap'>
            {myChanges.map((myChange, index) => (
              <div onClick={() => {clickedLocalChange !== myChange ? setClickedLocalChange(myChange) : setClickedLocalChange(false)}} className={`FileLine centerText ${clickedLocalChange === myChange ? "brightBackground" : null}`} key={index}>
                <label className='CIDtext FileText'>{myChange}</label>
              </div>
            ))}
            </div>
          </div>

          <div className='boxesDownload'>
            <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {closeModal()}} className='projectHeader HomeButtonDiv'>
            <img className="HomeButton" src={LeftArrowSvg } alt="" />
            </motion.div>

            <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {uploadChange()}} className='projectHeader HomeButtonDiv'>
            <h1>Upload</h1>
            </motion.div>

            <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {deleteChange()}} className='projectHeader HomeButtonDiv'>
            <h1>Delete</h1>
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

            <div className={ChangeProposals.length > 0 ? "line projectListFiles" : "line projectListFiles ListOfPatchesNo"}> 
            {ChangeProposals.length > 0 ? ChangeProposals.map((item, index) => (
                (item != clickedChangeProposal ?
                <div onClick={() => {setClickedChangeProposal(item)}} className='FileLine'>
                <span className='FileText'>{item}</span>
                <span className='FileText'>|</span>
                <span className='FileText'>Change Proposal</span>
                </div> : 
                <div onClick={() => {setClickedChangeProposal(false)}} className='clickChangeProposal'>
                  <span onClick={(e) => {e.stopPropagation(); voteForChange()}} className='FileText buttonFileLine'>Vote</span>
                  <span onClick={(e) => {e.stopPropagation(); navigate(`/project/${projectName}/changeProposal/${item}`)}} className='FileText buttonFileLine'>Watch the change proposal</span>
                </div>
              ))) : <h1 className='ListOfPatchesNoText'>[ Change Proposals ]</h1>}
            </div>

        </div>
    );
}

export default ProjectDevelopment;
