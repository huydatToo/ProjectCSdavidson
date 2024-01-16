import React, {useState, useEffect} from 'react';
import { useWallet } from '../utils/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import CompleteSvg from '../assets/complete-svgrepo-com.svg';
import HomeSvg from '../assets/homeDark.svg';
import { useNavigate } from 'react-router-dom';

const CreateNewProject = () => {
    const { contract } = useWallet();
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [path, setPath] = useState("")
    const navigate = useNavigate()


    const createProjectFunction = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ "path": path, "name": name }),
            });
        
            if (!response.ok) {
              throw new Error('Failed to upload file')
            }
        
            const data = await response.json(); 
            const _CID = data.ipfsCID;
            const transaction = await contract.createProject(_CID, name)
            await transaction.wait();
            navigate(`/project/${name}`)
            
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    const nextStep = () => {
        if (step !== 3) {
            setStep(step+1)
        } else {
            createProjectFunction(path)
        }
    }

    const pastePath = async () => {
        const text = await navigator.clipboard.readText();
        setPath(text)
        setStep(step+1)
    }
    
    const getStep = () => {
        if (step === 1) {
        return (
            <div className='center-new-project'>
            <motion.div whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} style={{cursor: "default"}} className='box-new-project'>
                <h1>Project Name</h1>
                <input onChange={(e) => setName(e.target.value)} type="text" className="newProjectInput" />
            </motion.div>
            <AnimatePresence initial={false} mode='wait'>
            {name.length > 3 ? (
            <motion.div key={"divSVG"} exit={{y: 10}} whileHover={{scale: 1.05}} initial={{y: 0 }} animate={{y: 210}} transition={{ type: "spring", duration: 0.7 }} onClick={() => nextStep()} className='button-new-project'>
                <motion.img  transition={{ type: "spring", duration: 1.5 }} initial={{opacity: -1 }} animate={{opacity: 1}} key={"svgSVG"} className='arrowDown' src={CompleteSvg} alt="" />
            </motion.div>
            ) : <></>}
            </AnimatePresence>
            </div>

        )} else if (step === 2 || step === 3) {
        return (
            <div className='center-new-project'>
            <motion.div style={{cursor: "default"}} whileHover={{scale: 1.05}} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.7 }} className='box-new-project'>
                <h1>Project Initial Folder</h1>
                {step === 2 ?
                <div onClick={(e) => {pastePath(e)}} style={{cursor: "pointer"}} className="newProjectInput">
                    <span className='pastePathButton'>Paste Project Path</span>
                </div>
                :<input value={path} onChange={(e) => setPath(e.target.value)} placeholder='Project Path' type="text" className="newProjectInput" />}
            </motion.div>

            <AnimatePresence initial={false} mode='wait'>
            {path.length > 3 ? (
                <motion.div key={"divSVG"} exit={{y: 10}} whileHover={{scale: 1.05}} initial={{y: 0 }} animate={{y: 210}} transition={{ type: "spring", duration: 0.7 }} onClick={() => nextStep()} className='button-new-project'>
                    <motion.img transition={{ type: "spring", duration: 1.5 }} initial={{opacity: -1 }} animate={{opacity: 1}} key={"svgSVG"} className='arrowDown' src={CompleteSvg} alt="" />
                </motion.div>
            ) : <></>}
            </AnimatePresence>
            </div>

        )}
    }

    useEffect(() => {

    }, []);

    return (
    <div className='background center'>
        {getStep()}
        <motion.div onClick={() => {navigate('/')}} transition={{ type: "spring", duration: 1.3 }} initial={{opacity: 0 }} animate={{opacity: 1}} className='HomeButton'>
            <AnimatePresence initial={false} mode='wait'>
                { step === 0 || (step === 1 && name.length < 3) || ((step === 2 || step === 3) && path.length < 3) ? (<motion.img key={"svgSVG"} transition={{ type: "spring", duration: 1.3 }} exit={{opacity: 0}} initial={{opacity: 0 }} animate={{opacity: 1}}  className='HomeButtonDark' src={HomeSvg} alt="" />) : null}
            </AnimatePresence>
        </motion.div>
    </div>
    );
}

export default CreateNewProject;
