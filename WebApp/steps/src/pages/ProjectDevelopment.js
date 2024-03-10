import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LeftArrowSvg from '../assets/leftArrow.svg';
import { useWallet } from '../utils/WalletContext';
import HomeSvg from '../assets/home.svg';
import ModalChanges from '../components/ModalChanges';
import { MetaMaskAvatar } from 'react-metamask-avatar';

// Project development page component
function ProjectDevelopment() {
  const navigate = useNavigate();
  const { projectName } = useParams();
  const { contract, account, isConnected, checkWalletConnection } = useWallet();
  const [ChangeProposals, setChangeProposals] = useState([]);
  const [myChanges, setMyChanges] = useState([]);
  const [distribution, setDistribution] = useState({
    open: null,
    addresses: [],
    myBalance: null,
  });
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedChangeProposal, setClickedChangeProposal] = useState(false);
  const [clickedLocalChange, setClickedLocalChange] = useState(false);

  // Function to get change proposals for the project
  async function getChangeProposals() {
    const changeProposalsTemp = await contract.getChangesOrProposals(projectName, false);
    setChangeProposals(changeProposalsTemp);
  }

  function getTimeInSeconds() {
    return Math.floor(Date.now() / 1000);
  }

  // Functions to open/close the modal
  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  // Function to get user's changes
  async function getMyChanges() {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/get_my_changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName }),
      });
      const data = await response.json();
      setMyChanges(data['my_changes']);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Function to vote in favor of a change
  async function voteForChange() {
    await contract.acceptChangeProposal(clickedChangeProposal, projectName);
    navigate(`/project/${projectName}`);
  }

  // Function to upload local changes and create a new change proposal
  async function uploadChange() {
    try {
      if (!clickedLocalChange) {
        return -1;
      }

      const response = await fetch('http://127.0.0.1:8000/api/upload_changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, change_name: clickedLocalChange }),
      });

      const data = await response.json();
      await contract.MakeChangeProposal(data['ipfsCID'], projectName);
      await getChangeProposals();
      closeModal();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Function to delete a local change
  async function deleteChange() {
    try {
      if (!clickedLocalChange) {
        return -1;
      }

      const response = await fetch('http://127.0.0.1:8000/api/delete_change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, change_name: clickedLocalChange }),
      });

      const data = await response.json();
      setMyChanges(data['my_changes']);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Function to save user's local changes
  async function saveChanges() {
    try {
      await fetch('http://127.0.0.1:8000/api/save_changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, change_name: clickedLocalChange }),
      });

      getMyChanges();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  }

  // Function to get the distribution state
  async function getDistributionState() {
    var lastDistributionTime = await contract.getLastDistriubtionTime(projectName);
    var timeInterval = await contract.TimeLockInterval();
    var myBalance = await contract.getDistributionBalanceOf(account, projectName);
    var myPendingTokens = await contract.getPendingTokens(account, projectName)
    
    myPendingTokens = myPendingTokens.toNumber()
    timeInterval = timeInterval.toNumber()
    lastDistributionTime = lastDistributionTime.toNumber()
    myBalance = myBalance.toNumber()
    
    let contributors = [];
    if (lastDistributionTime + timeInterval > getTimeInSeconds()) {
      const projectAddresses = await contract.getAddresses(projectName);
      const projectAddressesFiltered = [...new Set(projectAddresses)];

      for (let i = 0; i < projectAddressesFiltered.length; i++) {
        contributors.push({
          address: projectAddressesFiltered[i],
          sendTo: 0,
          changesOrProposalsCount: projectAddresses.filter((element) => element === projectAddresses[i]).length,
        });
      }
    }

    setDistribution({
      ...distribution,
      myBalance: myBalance,
      lastDistributionTime: lastDistributionTime,
      addresses: contributors,
      timeInterval: timeInterval,
    });
  }

  // Function to calculate time until the next distribution
  function timeForDistribution() {
    const timeNow = getTimeInSeconds();
    if (distribution.lastDistributionTime + distribution.timeInterval > getTimeInSeconds()) {
      const timeUntilNextDistribution = (distribution.timeInterval - (timeNow - distribution.lastDistributionTime));
      return timeUntilNextDistribution;
    } else {
      return false;
    }
  }

  // Function to distribute tokens
  async function distribute() {
    var amounts = distribution.addresses.map((usr) => usr.sendTo);
    var addresses = distribution.addresses.map((usr) => usr.address);

    addresses = addresses.filter((_, index) => amounts[index] !== 0);
    amounts = amounts.filter((element) => element !== 0);

    if (amounts.length + addresses.length > 0) {
      await contract.distribute(addresses, amounts, projectName);
    }
  }

  // Function to update payTo
  function updatePayTo(index, change) {
    const changeInBalance = distribution.addresses[index].sendTo - change;

    if (distribution.myBalance + changeInBalance < 0 || change < 0) {
      return null;
    }

    const newDistributionAddresses = [...distribution.addresses];
    newDistributionAddresses[index] = { ...newDistributionAddresses[index], sendTo: change };

    setDistribution({ ...distribution, myBalance: distribution.myBalance + changeInBalance, addresses: newDistributionAddresses });
  }

  // Initialize the page
  useEffect(() => {
    if (isConnected) {
      getChangeProposals();
      getMyChanges();
      getDistributionState();
    }
  }, [checkWalletConnection, isConnected]);

  // Function to format address
  function getFormatAddress(address, startLength = 10, endLength = 4) {
    if (!address) return '';

    const start = address.substring(0, startLength);
    const end = address.substring(address.length - endLength);

    return `${start}...${end}`;
  }

  // Function to claim tokens
  const claimTokens = async() => {
    await contract.claimPendingTokens(projectName);
    await getDistributionState();
  }

  // Function to start distribution
  const startDistribution = async() => {
    await contract.startDistribution(projectName);
    await getDistributionState();
  }

    // returns the page's react component
    return (
        <div className='background pageOne'>
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
        
        <div className='DistributionAndDev'>
          <div className='onSide'>
          <div className='lineShort'>
            <div className='projectHeaderLineProposals'>
                <motion.div whileTap={{y: 6}} whileHover={{y: 3}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate('/')}} className='projectHeader HomeButtonDiv'>
                    <img className="HomeButton" src={HomeSvg} alt="" />
                </motion.div>

                <motion.div whileTap={{y: 6}} whileHover={{y: 3}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate(`/project/${projectName}`)}} className='projectHeader HomeButtonDiv'>
                    <img className="HomeButton" src={LeftArrowSvg} alt="" />
                </motion.div>

                <motion.div whileTap={{y: 6}} whileHover={{y: 3}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
                    <h1>Update</h1>
                </motion.div>

                <motion.div onClick={() => {openModal()}} whileTap={{y: 6}} whileHover={{y: 3}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{scale: .91 }} transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
                    <h1>My changes</h1>
                </motion.div>
            </div>

            <div className={ChangeProposals.length > 0 ? "projectListProposals" : "projectListProposals ListOfPatchesNo"}> 
            {ChangeProposals.length > 0 ? ChangeProposals.map((item, index) => (
                (item !== clickedChangeProposal ?
                <div onClick={() => {setClickedChangeProposal(item)}} className='FileLine'>
                <span className='FileText'>{getFormatAddress(item)}</span>
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
          
          <div className='lineShorter'>
            <div className='distribution'> 
              {distribution.lastDistributionTime + distribution.timeInterval > getTimeInSeconds() ? (
              <>
              <div className=''>
              <div className='distributionData'>
                  <h2>{`${Math.floor(timeForDistribution())} days until distribution ends`}</h2>
                  <h2>balance: {distribution.myBalance}</h2>
              </div>

              <div className='payTokens'>
                  {distribution.addresses.map((item, index) => (
                  <div key={index} className='payTokensDiv'>
                    <div className='payTokensDetails'>
                    <MetaMaskAvatar className='' address={item.address} size={40} />
                    <div className='justDetails'>
                    <span className=''>{getFormatAddress(item.address, 5, 3)}</span>
                    <span className=''>Changes: {item.changesOrProposalsCount}</span>
                    </div>
                    </div>


                    <div class="payTokensIncrementor">
                      <h3 className='incDec' onClick={() => {updatePayTo(index, distribution.addresses[index].sendTo - 1)}}>-</h3>
                      <input onChange={(e) => updatePayTo(index, e.target.value)} type="number" value={item.sendTo}/>
                      <h3 className='incDec' onClick={() => {updatePayTo(index, distribution.addresses[index].sendTo + 1)}}>+</h3>
                    </div>

                  </div>
                  ))}
              </div>
              </div>
              <h2 onClick={() => {distribute()}} className='distributeButton'>Distribute</h2>
              </>
              ) : (
              <>
              <div className='center'>
                <h1>{distribution.myPendingTokens}</h1>
                <h1 onClick={() => {claimTokens()}} className='StartDistributeButtonOrClaim'>Claim Tokens</h1>
                <h1 onClick={() => {startDistribution()}} className='StartDistributeButtonOrClaim'>Start Distribution</h1>
              </div>
              </>
              )}
            </div>
          </div>
        </div>
        </div>

        </div>
    );
}

export default ProjectDevelopment;
