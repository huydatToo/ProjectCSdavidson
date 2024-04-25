import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'
import { useWallet } from '../utils/WalletContext';
import { motion } from 'framer-motion';
import HomeSvg from '../assets/home.svg';
import LeftArrowSvg from '../assets/leftArrow.svg';
import CompleteSvg from '../assets/complete-svgrepo-com.svg';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import ModalDetails from '../components/ModalDetails';
import {ReactComponent as DocumentSvg} from '../assets/document-svgrepo-com.svg';
import {ReactComponent as FolderSvg} from '../assets/folder-svgrepo-com.svg';
import {ReactComponent as DownloadSvg} from '../assets/download-svgrepo-com.svg';
import "../css/spinner.css"
import {ReactComponent as Show} from '../assets/show.svg';
import {ReactComponent as Accept} from '../assets/complete-svgrepo-com.svg';


// the project page
const ProjectPage = () => {
    // data save on the page
    const { contract, account } = useWallet();
    const navigate = useNavigate()
    const [project, setProject] = useState({changes: [], projectName: "", state: -1, files: [], path: ''});
    const { projectName, changeProposalOrGoBack, value } = useParams();
    const [fileContent, setFileContent] = useState({content: false, fileName: ""})
    const [isModalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState({path: "", openPathInput: false})
    const [pressedChange, setPressedChange] = useState({cid: "", changeMaker: ""})

    // modal control functions
    const openModal = () => {
      setModalOpen(true);
    };
  
    const closeModal = () => {
      setModalOpen(false);
      if (path.openPathInput === true) {
        setPath({path: "", openPathInput: false})
      }  
    };
    
    // control folder ui
    const ClosePathInput = () => {
      if (path.openPathInput === true) {
      setPath({path: "", openPathInput: false})
      }
    };

    function comparePaths(path1) {
      const dir1 = path1.substring(0, path1.lastIndexOf('\\') + 1);
      const dir2 = project.path.substring(0, project.path.lastIndexOf('\\') + 1);
    
      return dir1 === dir2;
    }

    function getFileNameFromPath(filePath) {
      const pathComponents = filePath.split('\\');
      return pathComponents[pathComponents.length - 1];
    }

    function goBackOneLevel(path) {
      path = path.endsWith('\\') ? path.slice(0, -1) : path;
      const lastIndex = path.lastIndexOf('\\');
      if (lastIndex === -1) {
        return '';
      }
      return path.slice(0, lastIndex + 1);
    }

    // the files and folders react component
    const getFilesHtml = () => {
      let folder_files = project.files.filter(comparePaths)
      if (folder_files.length > 0) {
      return folder_files.map((fileName, index) => (
        fileName.includes(".") ? (
            <div onClick={() => {getFileContent(fileName)}} className='FileLine' key={index}>
                <div className='centerFileLine'>
                  <DocumentSvg className="marginAuto fileSvgFileLine" width={40} height={40} />
                  <span className='marginAuto FileText'>{getFileNameFromPath(fileName)}</span>
                </div>

                <span className='FileText'>Date</span>
            </div>
        ) : (
            <div onClick={() => setProject({...project, path: fileName + "\\"})} className='DirLine' key={index}>
                <div className='centerFileLine'>
                  <FolderSvg className="marginAuto fileSvgFolderLine" width={40} height={40} />
                  <span className='FileText marginAuto'>{getFileNameFromPath(fileName)}</span>
                </div>
                <span className='FileText'>Date</span>
            </div>
        )
    ))}
    else {
      return <div className='ListOfPatchesNo marginAuto'><h1 className='ListOfPatchesNoText'>[ Empty ]</h1></div>
    }}

    // the functions get the project data like changes, name, etc...
    const getProjectDetails = async () => {
      setLoading(true)
      let changes = await contract.getChangesOrProposals(projectName, true);
      let changesWithProposal
      if (changeProposalOrGoBack === "changeProposal") {
        changesWithProposal = [...changes]
        changesWithProposal.push(value)
        changes = changesWithProposal;
      } else if (changeProposalOrGoBack === "goBack") {
        changesWithProposal = [...changes].slice(0, value*1)
        changes = changesWithProposal;
      }

      
      let currentProjectState = {state: -1, projectName: projectName, changes: changes, files: [], path: ''}
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/check-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ "name": currentProjectState.projectName, "changes": currentProjectState.changes })
        });

        const data = await response.json(); 

        if (data["message"] === 353) {
          currentProjectState = {...currentProjectState, state: 353}
        } else if (data["message"] === 354) {
          currentProjectState = {...currentProjectState, state: 354}
        } else if (data["message"] === 351) {
          currentProjectState = {...currentProjectState, state: 351}
        }

        try {

          const response = await fetch('http://127.0.0.1:8000/api/get_project_files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "changes": changes, 'name': currentProjectState.projectName }),
          });

          const data = await response.json(); 
          currentProjectState = {...currentProjectState, files: data["files"]}
          
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    
      } catch (error) {
          console.error("Can't get project details", error);
      }
      setProject(currentProjectState)
      setLoading(false)

  }

  // the function downloads a project to the local machine
  const downloadProject = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/download_project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "changes": project.changes, "file_name": project.projectName, "path": path.path }),
      });
      
    } catch (error) {
        console.error('Error uploading file:', error);
    }
  }

  // the functions show remote file content
  const getFileContent = async(file_name) => {
    try {

      const response = await fetch('http://127.0.0.1:8000/api/get_file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "changes": project.changes, "file_name": file_name }),
      });

      const data = await response.json(); 
      if (data["cid"] !== undefined) {
        setFileContent({content: {cid: data["cid"]}, fileName: file_name})
      } else {
        setFileContent({content: data["file"], fileName: file_name})
      }
    } catch (error) {
        console.error('Error uploading file:', error);
    }
  }

  const getState = () => {
    if (project.state === 353) {
      return "Not Downloaded"
    } else if (project.state === 354) {
      return "Latest Version"
    } else if (project.state === 351) {
      return "Need Update"
    }
  }

  // initiate the page
  useEffect(() => {
      try {
          getProjectDetails()
      } catch (error) {
          console.error('Error uploading file:', error);
      }
  }, [changeProposalOrGoBack]);


  const generateRandomText = (size) => {
    // Function to generate random text
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomText = '';
    for (let i = 0; i < size; i++) {
      randomText += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomText;
  };

  const getClassFoldersOrText = () => {
    if (fileContent.content === false) {
      return project.files.length > 0 ? "projectListProposals" : 'projectListProposals ListOfPatchesNo'
    } else {
      return "projectListProposalsCode"
    }
  }

  const goBack = (index) => {
    navigate(`/project/${projectName}/goBack/${index}`);
  }

  function getFormatAddress(address, startLength = 10, endLength = 4) {
    if (!address) return '';

    const start = address.substring(0, startLength);
    const end = address.substring(address.length - endLength);

    return `${start}...${end}`;
  }

  const setChangeProcess = async (changeCID) => {
    const changeMaker = await contract.getChangeMaker(projectName, changeCID);
    const isVoted = await contract.isVoted(changeMaker, changeCID, false, projectName);
    let votesToRemove = await contract.getChangeVotes(changeCID, false, projectName);
    let totalTokens = await contract.getTotalTokens(projectName);
    votesToRemove = votesToRemove.toNumber();
    totalTokens = totalTokens.toNumber();
  
    const votesToRemovePercentage = parseFloat(100*(votesToRemove/totalTokens)).toString()
    setPressedChange({cid: changeCID, changeMaker: changeMaker, votesToRemove: votesToRemovePercentage, voted: isVoted})
  }

  const voteToChangeRemoval = async () => {
    if (!pressedChange.voted) {
      const transaction = await contract.voteForChangeProposal(pressedChange.cid, false, projectName);
      await transaction.wait()
    } else {
      const transaction = await contract.removeVote(pressedChange.cid, false, projectName);
      await transaction.wait()
    }
    await setChangeProcess(pressedChange.cid)
  }

  const acceptChangeRemoval = async () => {
    const transaction = await contract.acceptRemoval(pressedChange.cid, projectName);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/accept_remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, patch: pressedChange.cid }),
      });
      await response.json();

    } catch (error) {
      console.error('Error:', error);
    }
    await transaction.wait();
    await getProjectDetails();
    await setChangeProcess(pressedChange.cid)
  }


  


  // the pages jsx
    return (
    <div className='background'>
        <ModalDetails isOpen={isModalOpen} closeModal={closeModal} closeInput={ClosePathInput}>
        <div className='modalFlex'>
          <div className=''>
            <h1>Changes</h1>
            <div className='modalFlex gap width10'>
            {project.changes.map((changeCID, index) => (
              (pressedChange.cid !== changeCID ?
              <div onClick={() => setChangeProcess(changeCID)} className='FileLine' key={index}>
                <label className='CIDtext FileText'>{changeCID.slice(0, 37)}</label>
              </div> 
              : 
              <div onClick={() => {setPressedChange({cid: "", changeMaker: ""})}} className='FileLinePressed'>
              <span className='spanClickedAddr'>{getFormatAddress(changeCID, 5, 4)}</span>
                <div className='centerClickedButtons'>
                  <span className='buttonFileLineChangeProposalVoted FileText'>{pressedChange.votesToRemove}%</span>
                  <span className='FileTextVL'>|</span>
                  <span onClick={(e) => {e.stopPropagation(); voteToChangeRemoval()}} className='FileTextVL FileTextVLVoteToRemove'>{pressedChange.voted ? "Remove Vote" : "Vote For Removal"}</span>
                  <span className='FileTextVL'>|</span>
                  <Show onClick={() => goBack(index)} width={40} height={40} className='FileText buttonFileLineChangeProposal'/>
                  <span className='FileTextVL'>|</span>
                  {pressedChange.votesToRemove > 50 &&
                  <><Accept onClick={(e) => {e.stopPropagation(); acceptChangeRemoval()}} width={40} height={40} className='FileText buttonFileLineChangeProposal'/>
                  <span className='FileTextVL'>|</span></>}
                  <div className='center'>
                    <img onClick={() => navigate("/"+pressedChange.changeMaker)} className='squareDev' src={`https://effigy.im/a/${pressedChange.changeMaker}.png`} alt=""/>
                  </div>
                </div>
              </div>)
            ))}
            </div>
          </div>

          <div className='boxesDownload'>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {!path.openPathInput ? closeModal() : downloadProject()}} className='projectHeader HomeButtonDiv'>
            <img className="HomeButton" src={!(path.path.length > 3) ? LeftArrowSvg : CompleteSvg} alt="" />
            </motion.div>

            {!path.openPathInput ?
            <motion.div onClick={() => setPath({...path, openPathInput: !path.openPathInput})} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader cursorPointer'>
              <DownloadSvg height={77} width={77} style={{  "fill": "#dedede" }}/>
            </motion.div> :
            
            <motion.div onClick={e => {e.stopPropagation()}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader'>
            <input onChange={(e) => {setPath({...path, path: e.target.value})}} type="text" placeholder='Project Path' className="DownloadInput" />
            </motion.div>}
            
          </div>
        </div>
        </ModalDetails>
      
        <div className='lineProjectPage'>
        <div className='onSideProjectPage'>
        <div className='projectHeaderLineProposals'>
          <motion.div whileTap={{y: 6}} whileHover={{y: 3}} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate('/')}} className='projectHeader HomeButtonDiv'>
              <img className="HomeButton" src={HomeSvg} alt="" />
          </motion.div>

          <motion.div whileHover={{y: 3}} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader'>
            {project.projectName !== "" && <h1 className='CIDtextHeader'>{project.projectName.slice(0,11)}</h1>}
            {project.projectName === "" && <h1>{generateRandomText(6)}</h1>}
          </motion.div>

          <motion.div whileHover={{y: 3}} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd'>
            {project.state === -1 && <h1>{generateRandomText(12)}</h1>}
            {project.projectName !== "" && <h1 className='nowrap'>{getState()}</h1>}

          </motion.div>

          <motion.div onClick={() => {openModal()}} whileTap={{y: 6}} whileHover={{y: 3}} transition={{ type: "spring", duration: 0.6 }} className='projectHeader changesButton'>
            <h1>Details</h1>
          </motion.div>

          <motion.div onClick={() => navigate(`/project/${projectName}/development`)} whileTap={{y: 6}} whileHover={{y: 3}} transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
            <h1>Development</h1>
          </motion.div>

          <motion.div onClick={() => navigate(`/${account}`)} whileTap={{y: 6}} whileHover={{y: 3}} transition={{ type: "spring", duration: 0.6 }} className='projectHeader accountButton toTheEnd'>
            <div className='accountLogo'>
              <img className='squareGray' src={`https://effigy.im/a/${account}.png`} alt=""/>
            </div>
          </motion.div>

        </div>

        <div className={getClassFoldersOrText()}> 
        {!loading ?
        <>
        {fileContent.content === false ? <>
        <div className='folderList'>
        {project.path.length > 1 ? 
        <div onClick={() => {setProject({...project, path: goBackOneLevel(project.path)})}} className='FileLine'>
          <span className='FileText'>..</span>
          <span className='FileText'>Go Back</span>
        </div> : null}
        {getFilesHtml()}
        </div>
        </> : 
        <div className='divText'>
          {typeof fileContent.content !== "object" ? 
            CodeEditor(fileContent.content, "javaScript") 
            : <div className='sizePhotoFromIPFS'><img className='showPhoto' src={`https://ipfs.io/ipfs/${fileContent.content.cid}/`} alt=""/></div>
          }
          <div className="goBackFromTextButton">
            <span className='cursor' onClick={() => {setFileContent({content: false, file_name: ""})}}> Go back </span> <span> | {fileContent.fileName} </span>
          </div>
        </div>
        }</>
        : <div id="loader"></div>} </div>
        </div>
        </div>

    </div>
    );
}

export default ProjectPage;
