import { useEffect } from "react";
import { animate, useScroll, motion } from "framer-motion";

const PageLearn = ({scroll}) => {
  const animControls = scroll;

  useScroll().scrollYProgress.on("change", (yProgress) => {
    if (!animControls.current) return;
    animControls.current.time = yProgress * animControls.current.duration;
    
    console.log(animControls.current.time, yProgress, animControls.current.duration)
  });

  useEffect(() => {
    animControls.current = animate([
      [".titleLearn", { opacity: 0, y: -100 }, { ease: "easeOut", duration: 3 }],
      [".titleLearn", { y: 0, opacity: 1 }, { ease: "easeOut", duration: 3, at: 1 }],
      [".explainBox", { opacity: 1, x: 0 }, { ease: "easeOut", duration: 3, at: 1 }],
      [".explainBox", { opacity: 0, x: 100}, { ease: "easeOut", duration: 3, at: 0 }],
      [".explainBox1", { opacity: 1, x: 0 }, { ease: "easeOut", duration: 3, at: 1 }],
      [".explainBox1", { opacity: 0, x: -100}, { ease: "easeOut", duration: 3, at: 0 }],
      [".explainBox2", { opacity: 1, y: 0 }, { ease: "easeOut", duration: 3, at: 1 }],
      [".explainBox2", { opacity: 0, y: 100}, { ease: "easeOut", duration: 3, at: 0 }],
      
    ]);
    animControls.current.pause();
  }, []);


  return (
    <div className=''>
      <motion.h1         
      initial={{opacity: 0, y: -100}}
      className="titleLearn"
      >How it works</motion.h1>

      <div className="gridExplains">

      <motion.div initial={{opacity: 0}} className="explainBox1">
        <span>1. Initiate A New Project</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox2">
        <span>2. Share To Others</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <span>3. Upload A Change Proposal</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox1">
        <span>4. Vote For Change Proposals</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox2">
        <span>1. Initiate A New Project</span>
      </motion.div>

      <motion.div initial={{opacity: 0}} className="explainBox">
        <span>1. Initiate A New Project</span>
      </motion.div>

      </div>
    </div>
  );
}

export default PageLearn;
