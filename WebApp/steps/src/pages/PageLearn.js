import { useEffect } from "react";
import { animate, useScroll, motion } from "framer-motion";

const PageLearn = ({scroll}) => {
  const animControls = scroll;

  useScroll().scrollYProgress.on("change", (yProgress) => {
    if (!animControls.current) return;
    animControls.current.time = yProgress * animControls.current.duration;
    
  });

  useEffect(() => {
    animControls.current = animate([
      [".titleLearn", { opacity: 1 }, { ease: "easeOut", duration: 3, at: 1 }],
      [".explainBox", { opacity: 1, y: 0 }, { ease: "easeOut", duration: 3, at: 1 }],
      [".explainBox", { opacity: 0, y: 100}, { ease: "easeOut", duration: 3, at: 0 }],      
      [".titleLearnButton", { opacity: 1 }, { ease: "easeOut", duration: 3, at: 1 }],
    ]);
    animControls.current.pause();
  }, []);


  return (
    <div className='pageLearnCenter'>
      <div className="learnHeaderLine">
      <motion.h1         
      initial={{opacity: 0}}
      className="titleLearn">How it works
      </motion.h1>
      <motion.h1         
      initial={{opacity: 0}}
      className="titleLearnButton">Connect Wallet
      </motion.h1>
      </div>

      <div className="gridExplains">
      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>1</strong>
        <span>Create A New Project</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>2</strong>
        <span>Share To Others</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>3</strong>
        <span>Save Your Changes</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>4</strong>
        <span>Upload Your Changes</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>5</strong>
        <span>Vote For Change Proposals</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>6</strong>
        <span>Accept Your Change Proposals</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>7</strong>
        <span>Start A Distribution Round</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>8</strong>
        <span>Send Voting Power To Your Peers</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <strong>9</strong>
        <span>Claim Voting Power</span>
      </motion.div>

      </div>
    </div>
  );
}

export default PageLearn;
