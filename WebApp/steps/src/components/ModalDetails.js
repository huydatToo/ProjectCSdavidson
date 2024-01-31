import React from 'react';
import { motion } from 'framer-motion';

// the function returns the modal of project details
const ModalDetails = ({ isOpen, closeModal, children, closeInput }) => {
  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={closeModal} className="modal-overlay">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={e => {e.stopPropagation(); closeInput()}} className="modal-content">
        {children}
      </motion.div>
    </motion.div>
  );
};

export default ModalDetails;
