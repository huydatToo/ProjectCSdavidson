import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'
import { useWallet } from '../utils/WalletContext';
import { motion } from 'framer-motion';
import HomeSvg from '../assets/home.svg';
import LeftArrowSvg from '../assets/leftArrow.svg';
import CompleteSvg from '../assets/complete-svgrepo-com.svg';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import ModalDetails from '../components/ModalDetails';

// the project page
const ProjectPage = () => {
    // data save on the page
    const { contract } = useWallet();
    const navigate = useNavigate()
    const [project, setProject] = useState({changes: [], projectName: "", state: -1, files: [], path: ''});
    const { projectName, changeProposal } = useParams();
    const [fileContent, setFileContent] = useState(false)
    const [isModalOpen, setModalOpen] = useState(false);
    const [path, setPath] = useState({path: "", openPathInput: false})

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
                <span className='FileText'>{getFileNameFromPath(fileName)}</span>
                <span className='FileText'>Date</span>
            </div>
        ) : (
            <div onClick={() => setProject({...project, path: fileName + "\\"})} className='DirLine' key={index}>
                <span className='FileText'>{getFileNameFromPath(fileName)}</span>
                <span className='FileText'>Date</span>
            </div>
        )
    ))}
    else {
      return <div className='ListOfPatchesNo'><h1 className='ListOfPatchesNoText'>[ Empty ]</h1></div>
    }}

    // the functions get the project data like changes, name, etc...
    const getProjectDetails = async () => {
      let changes = await contract.getChangesOrProposals(projectName, true);
      changes = [...changes].reverse();
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
          let changesWithProposal
          if (changeProposal) {
            changesWithProposal = [...changes]
            changesWithProposal.push(changeProposal)
          }

          const response = await fetch('http://127.0.0.1:8000/api/get_project_files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "changes": changeProposal ? changesWithProposal : changes, 'name': currentProjectState.projectName }),
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

  }

  // the function downloads a project to the local machine
  const downloadProject = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/download_project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "changes": project.changes, "file_name": project.projectName, "path": path }),
      });
      
    } catch (error) {
        console.error('Error uploading file:', error);
    }
  }

  // the functions show remote file content
  const getFileContent = async(file_name) => {
    try {
      let changesWithProposal
      if (changeProposal) {
        changesWithProposal = [...project.changes]
        changesWithProposal.push(changeProposal)
      }
      const response = await fetch('http://127.0.0.1:8000/api/get_file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "changes": changeProposal ? changesWithProposal : project.changes, "file_name": file_name }),
      });

      const data = await response.json(); 
      setFileContent(data["file"])
      
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
  }, []);

  // the pages jsx
    return (
    <div className='background middle center gapLines lineGap pageOne'>
        <ModalDetails isOpen={isModalOpen} closeModal={closeModal} closeInput={ClosePathInput}>
        <div className='modalFlex'>
          <div className=''>
            <h1>Changes</h1>
            <div className='modalFlex gap'>
            {project.changes.map((changeCID, index) => (
              <div onClick={() => navigator.clipboard.writeText(changeCID)} className='FileLine centerText' key={index}>
                <label className='CIDtext FileText'>{changeCID.slice(0, 42)}</label>
              </div>
            ))}
            </div>
          </div>

          <div className='boxesDownload'>
            <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {!path.openPathInput ? closeModal() : downloadProject()}} className='projectHeader HomeButtonDiv'>
            <img className="HomeButton" src={!(path.path.length > 3) ? LeftArrowSvg : CompleteSvg} alt="" />
            </motion.div>

            {!path.openPathInput ?
            <motion.div onClick={() => setPath({...path, openPathInput: !path.openPathInput})} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader cursorPointer'>
              <h1>Download</h1>
            </motion.div> :
            <motion.div onClick={e => {e.stopPropagation()}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader'>
            <input onChange={(e) => {setPath({...path, path: e.target.value})}} type="text" placeholder='Project Path' className="DownloadInput" />
            </motion.div>}
          </div>
        </div>
        </ModalDetails>
        
        <div className='line projectHeaderLine'>
        <motion.div whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate('/')}} className='projectHeader HomeButtonDiv'>
            <img className="HomeButton" src={HomeSvg} alt="" />
        </motion.div>


          <motion.div  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader'>
            <h1>{project.projectName}</h1>
          </motion.div>

          <motion.div  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader'>
            <h1>{getState()}</h1>
          </motion.div>

          <motion.div onClick={() => {openModal()}} whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader changesButton'>
            <h1>Details</h1>
          </motion.div>

          <motion.div onClick={() => navigate(`/project/${projectName}/development`)} whileTap={{scale: 0.9}} whileHover={{scale: 1.03}} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
            <h1>Development</h1>
          </motion.div>
        </div>

        <div className={project.files.length > 0 ? "line projectListFiles" : 'projectListFiles ListOfPatchesNo line'}> 
        {fileContent === false ? <>
        {project.path.length > 1 ? 
        <div onClick={() => {setProject({...project, path: goBackOneLevel(project.path)})}} className='FileLine'>
          <span className='FileText'>..</span>
          <span className='FileText'>Go Back</span>
        </div> : null}
        {getFilesHtml()}
        </> : <>
        {typeof fileContent !== "object" ? CodeEditor(fileContent) : <img src={`https://ipfs.infura.io/ipfs/${fileContent[0]}/`} alt=""/>}
        <div onClick={() => {setFileContent(false)}}>Go back</div>
        </>}
        </div>

    </div>
    );
}

export default ProjectPage;
