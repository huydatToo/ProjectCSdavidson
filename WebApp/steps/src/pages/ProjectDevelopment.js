import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LeftArrowSvg from '../assets/leftArrow.svg';
import {ReactComponent as FlagUnSavedChanges} from '../assets/flag-svgrepo-com.svg';
import {ReactComponent as Show} from '../assets/show.svg';
import { useWallet } from '../utils/WalletContext';
import HomeSvg from '../assets/home.svg';
import ModalChanges from '../components/ModalChanges';
import ModalUpdate from '../components/ModalUpdate';
import { MetaMaskAvatar } from 'react-metamask-avatar';



// Project development page component
function ProjectDevelopment() {
  const navigate = useNavigate();
  const { projectName } = useParams();
  const { contract, account, isConnected, checkWalletConnection } = useWallet();
  const [ChangeProposals, setChangeProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectState, setProjectState] = useState({});
  const [time, setTime] = useState(null);
  const [localProject, setLocalProject] = useState({unSavedChanges: false, myChanges: [], changesCIDs: []})
  const [distribution, setDistribution] = useState({
    open: null,
    addresses: [],
    myBalance: null,
    projectBalance: null,
  });
  const [isModalOpen, setModalOpen] = useState(false);
  const [isModalUpdateOpen, setModalUpdateOpen] = useState(false);
  const [clickedChangeProposal, setClickedChangeProposal] = useState(false);
  const [clickedLocalChange, setClickedLocalChange] = useState(false);

  // Function to get change proposals for the project
  async function getChangeProposals() {
    let changeProposalsTemp = await contract.getChangesOrProposals(projectName, false);
    let t = [];
    changeProposalsTemp.map(async(changeProposal, index) => {
      const changeMaker = await contract.getChangeMaker(projectName, changeProposal)
      t.push({cid: changeProposal, changeMaker: changeMaker});
    })
    setChangeProposals(t);
  }

  function getTimeInSeconds() {
    setTime(Math.floor(Date.now() / 1000));
  }

  // Functions to open/close the modal
  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  // Functions to open/close the modal update
  async function openModalUpdate() {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/search_conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, changes: localProject.changesCIDs }),
      });
      const data = await response.json();
      setProjectState({state: data["message"], conflicts: data["conflicts"]});

    } catch (error) {
      console.error('Error:', error);
    }

    setModalUpdateOpen(true);
  }

  function closeModalUpdate() {
    setModalUpdateOpen(false);
  }

  // Function to get user's changes
  async function getMyChanges() {
    let changesCIDsTemp = await contract.getChangesOrProposals(projectName, true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/get_my_changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, patches: changesCIDsTemp }),
      });
      const data = await response.json();
      if (data.message !== 353) {
        setLocalProject({...localProject, myChanges: data['my_changes'], unSavedChanges: data["unSavedChanges"], changesCIDs: changesCIDsTemp});
      }

    } catch (error) {
      console.error('Error:', error);
    }
  }


  async function acceptChange() {
    const transaction = await contract.acceptChangeProposal(clickedChangeProposal, projectName);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/accept_change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, patch: clickedChangeProposal }),
      });
      await response.json();

    } catch (error) {
      console.error('Error:', error);
    }

    await transaction.wait();
    navigate(`/project/${projectName}`);
  }


  // Function to vote in favor of a change
  async function voteForChange() {
    await contract.voteForChangeProposal(clickedChangeProposal, projectName);
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
      const transaction = await contract.MakeChangeProposal(data['ipfsCID'], projectName);
      await transaction.wait();
      closeModal();
      await getChangeProposals();
      await getMyChanges();

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

      await response.json();
    } catch (error) {
      console.error('Error:', error);
    }
    
    await getMyChanges()
  }

  // Function to save user's local changes
  async function saveChanges() {
    try {
      await fetch('http://127.0.0.1:8000/api/save_changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName, changes: localProject.changesCIDs }),
      });

      getMyChanges();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  }

  // Function to get the distribution state
  async function getDistributionState() {
    var lastDistributionTime = await contract.getLastDistriubtionTime(projectName);
    var myBalance = await contract.getDistributionBalanceOf(account, projectName);
    var projectBalance = await contract.getBalance(account, projectName)
    var myPendingTokens = await contract.getPendingTokens(account, projectName)
    var totalTokensInProject = await contract.getTotalTokens(projectName)
    var TimeLockInterval = await contract.ClaimingInterval();
    
    TimeLockInterval = TimeLockInterval.toNumber()
    myPendingTokens = myPendingTokens.toNumber()
    lastDistributionTime = lastDistributionTime.toNumber()
    myBalance = myBalance.toNumber()
    projectBalance = projectBalance.toNumber()
    totalTokensInProject = totalTokensInProject.toNumber()
    
    let contributors = [];
    if (lastDistributionTime > time) {
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
      myPendingTokens: myPendingTokens,
      projectBalance: projectBalance,
      totalTokens: totalTokensInProject,
      timeLockInterval: TimeLockInterval
    });
  }

  // Function to calculate time until the next distribution
  function timeForDistribution() {
    const timeNow = time;
    if (distribution.lastDistributionTime > time) {
      const timeUntilNextDistribution = distribution.lastDistributionTime - timeNow;
      if (timeUntilNextDistribution > 60 * 60 * 24) {
        return `${Math.floor(timeUntilNextDistribution / (60 * 60 * 24))} days until distribution ends`
      } else if (timeUntilNextDistribution < 60 * 60 * 24 && timeUntilNextDistribution > 60 * 60) {
        return `${Math.floor(timeUntilNextDistribution / (60 * 60))} hours until distribution ends`
      } else if (timeUntilNextDistribution < 60 * 60 && timeUntilNextDistribution > 60) {
        return `${Math.floor(timeUntilNextDistribution / (60))} minutes until distribution ends`
      } else {
        return `${Math.floor(timeUntilNextDistribution)} seconds until distribution ends`
      }
    } else {
      return false;
    }
  }

  function timeForClaiming() {
    const timeNow = time;
    if (distribution.lastDistributionTime + distribution.timeLockInterval > timeNow) {
      const timeUntilNextClaimingEnds = (distribution.lastDistributionTime + distribution.timeLockInterval) - timeNow;
      if (timeUntilNextClaimingEnds > 60 * 60 * 24) {
        return `${Math.floor(timeUntilNextClaimingEnds / (60 * 60 * 24))} days until claiming ends`
      } else if (timeUntilNextClaimingEnds < 60 * 60 * 24 && timeUntilNextClaimingEnds > 60 * 60) {
        return `${Math.floor(timeUntilNextClaimingEnds / (60 * 60))} hours until claiming ends`
      } else if (timeUntilNextClaimingEnds < 60 * 60 && timeUntilNextClaimingEnds > 60) {
        return `${Math.floor(timeUntilNextClaimingEnds / (60))} minutes until claiming ends`
      } else {
        return `${Math.floor(timeUntilNextClaimingEnds)} seconds until claiming ends`
      }
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
      const transaction = await contract.distribute(addresses, amounts, projectName);
      await transaction.wait()
      await getDistributionState()
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


  useEffect(() => {
    async function fetchData() {
      if (isConnected) {
      await getDistributionState();
      await getChangeProposals();
      await getMyChanges();
      setLoading(false)
    }}

    getTimeInSeconds()
    fetchData()
  }, [checkWalletConnection, isConnected]);


  useEffect(() => {
    const intervalId = setInterval(() => {
      getTimeInSeconds()
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);



  // Function to format address
  function getFormatAddress(address, startLength = 10, endLength = 4) {
    if (!address) return '';

    const start = address.substring(0, startLength);
    const end = address.substring(address.length - endLength);

    return `${start}...${end}`;
  }

  // Function to claim tokens
  const claimTokens = async() => {
    const transaction = await contract.claimPendingTokens(projectName);
    await transaction.wait()
    await getDistributionState();
  }

  // Function to start distribution
  const startDistribution = async() => {
    const transaction = await contract.startDistribution(projectName);
    await transaction.wait()
    await getDistributionState();
  }


  function formatNumber(number) {
    if (Number.isInteger(number)) {
      return number.toString(); 
    } else {
      let roundedNumber = number.toFixed(2);
      return parseFloat(roundedNumber).toString(); 
    }
  }
  

    // returns the page's react component
    return (
        <div className='background'>
        <ModalChanges isOpen={isModalOpen} closeModal={closeModal}>
        <div className='modalFlex'>
          <div className=''>
            <div className='headerModalChanges'>
            <span className='HeaderModal'>[ Local Patches ]</span>
            {localProject.unSavedChanges ? <span className='unSavedChangesHeader'>Un Saved Changes Found</span> : null}
            </div>
            <div className='modalFlex gap'>
            {localProject.myChanges.map((myChange, index) => (
              <div onClick={() => {clickedLocalChange !== myChange ? setClickedLocalChange(myChange) : setClickedLocalChange(false)}} className={`FileLine centerText ${clickedLocalChange === myChange ? "brightBackground" : null}`} key={index}>
                <label className='CIDtext FileText'>{myChange}</label>
              </div>
            ))}
            </div>
          </div>

          <div className='boxesDownload'>
            <motion.div onClick={() => {closeModal()}} className='projectHeader HomeButtonDiv'>
            <img className="HomeButton" src={LeftArrowSvg } alt="" />
            </motion.div>

            <motion.div onClick={() => {uploadChange()}} className='projectHeader HomeButtonDiv'>
            <h1>Upload</h1>
            </motion.div>

            <motion.div onClick={() => {deleteChange()}} className='projectHeader HomeButtonDiv'>
            <h1>Delete</h1>
            </motion.div>

            <motion.div onClick={() => {localProject.unSavedChanges && saveChanges()}} className={localProject.unSavedChanges ? 'projectHeader HomeButtonDiv' : "projectHeaderOpacity"}>
            <h1>Save Changes</h1>
            </motion.div>

          </div>
        </div>
        </ModalChanges>

        <ModalUpdate isOpen={isModalUpdateOpen} closeModal={closeModalUpdate}>
          <div className='modalFlex width60'>
            {projectState.state === 351 ? 
            <>
            <div>
            <h1 className='headerUpdate'>Need Update</h1>
            <div className='gap10'>
            {Object.entries(projectState.conflicts.files).map((item, index) => (
              <div className='folderFilesDiv' key={index}>
                <h2>{item[0]}/</h2>
                
                <div className='filesListFolderFiles'>
                {item[1].map((file_name, index_file) => (
                  <div className='fileLineFolderFiles'>
                    <span className='' key={index_file}>{file_name}</span>
                    <div className='buttonsFoldersFiles'>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ))}

            {projectState.conflicts.folders.map((item, index) => (
              <div key={index} className='folderLineFolder'>
                <span className='' >{item}</span>
                <div className='buttonsFoldersFiles'>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                </div>
              </div>
            ))}
            </div>
            </div>

            <h1 className='updateButton'>Update</h1>
            </>
            : <h1 className='titleCenter'>Latest Version</h1>}
          </div>
        </ModalUpdate>
        
        <div className='DistributionAndDev'>
          <div className='onSide'>
          <div className='lineShort'>
            <div className='projectHeaderLineProposals'>
                <motion.div whileTap={{y: 6}} whileHover={{y: 3}}  transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate('/')}} className='BackgroundHome projectHeader HomeButtonDiv'>
                    <img className="HomeButton" src={HomeSvg} alt="" />
                </motion.div>

                <motion.div whileTap={{y: 6}} whileHover={{y: 3}}  transition={{ type: "spring", duration: 0.6 }} onClick={() => {navigate(`/project/${projectName}`)}} className='projectHeader HomeButtonDiv'>
                    <img className="HomeButton" src={LeftArrowSvg} alt="" />
                </motion.div>


                {projectState.state !== 353 ?
                <>
                <motion.div onClick={() => {!localProject.unSavedChanges ? openModalUpdate() : openModal()}} whileTap={{y: 6}} whileHover={{y: 3}}   transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
                    {localProject.unSavedChanges ? <FlagUnSavedChanges style={{"fill": "#dedede"}} width={60} height={80} /> 
                    : <h1>Update</h1>}
                </motion.div>

                <motion.div onClick={() => {openModal()}} whileTap={{y: 6}} whileHover={{y: 3}}   transition={{ type: "spring", duration: 0.6 }} className='projectHeader toTheEnd changesButton'>
                    <h1>My changes</h1>
                </motion.div>
                </>
                : 
                <motion.div className='projectHeader toTheEnd changesButton'>
                  <h1>not downloaded</h1>
                </motion.div>}
            </div>

            <div className={ChangeProposals.length > 0 ? "projectListProposals" : "projectListProposals ListOfPatchesNo"}> 
            {!loading ? <>
            {ChangeProposals.length > 0 ? ChangeProposals.map((item, index) => (
              
                (item.cid !== clickedChangeProposal ?
                <div key={index} onClick={() => {setClickedChangeProposal(item.cid)}} className='FileLine gapLine'>
                <span className='FileText'>{getFormatAddress(item.cid)}</span>
                <span className='FileTextVL'>|</span>
                <span className='FileText'>Change Proposal</span>
                </div> : 
                <div onClick={() => {setClickedChangeProposal(false)}} className='clickChangeProposal'>
                  <span className='spanClickedAddr'>{getFormatAddress(item.cid, 10, 3)}</span>
                  <div className='centerClickedButtons'>
                    <span onClick={(e) => {e.stopPropagation(); voteForChange()}} className='FileText buttonFileLineChangeProposal'>Vote</span>
                    <div className='vl'/>
                    <Show width={40} height={40} onClick={(e) => {e.stopPropagation(); navigate(`/project/${projectName}/changeProposal/${item.cid}`)}} className='FileText buttonFileLineChangeProposal'/>
                    <div className='vl'/>
                    <div className='marginAuto' onClick={() => {navigate(`/${item.changeMaker}`)}}>
                      <img className='squareGraySmall' src={`https://effigy.im/a/${item.changeMaker}.png`} alt=""/>

                      </div>
                    <div className='vl'/>
                    <span onClick={(e) => {e.stopPropagation(); acceptChange()}} className='FileText buttonFileLineChangeProposal'>Accept</span>
                  </div>
                </div>
                ))) : <h1 className='ListOfPatchesNoText'>[ Change Proposals ]</h1>}
            </> : <div id="loader"></div>}
            </div>
          </div>
          
          <div className='lineShorter'>
              
            {timeForDistribution() !== false && 
            <div className='distributionData'>
            <span className='spanTimeToDistribution'>{timeForDistribution()}</span>
            </div>}

            <div className='distributionData'>
                {timeForDistribution() !== false && <>
                <div className='divLinesDistributionData'>
                  <span className='distributionBalance'>Distribution Balance</span>
                  <span className='distributionBalanceBalance'>{distribution.myBalance}</span>
                </div>
                <hr className='hrLineDistribution' />
                </>}

                <div className='divLinesDistributionData'>
                  <span className='distributionBalance'>Project Balance</span>
                  <div className='gapDistributionBalance'>
                    <span className='distributionBalanceBalance'>{distribution.projectBalance}</span>
                    <div className='vl'/>
                    <span className='distributionBalanceBalance'>{formatNumber(100*(distribution.projectBalance/distribution.totalTokens))}%</span>
                  </div>
                </div>

                <hr className='hrLineDistribution' />
                <div className='divLinesDistributionData'>
                  <span className='distributionBalance'>Total Tokens</span>
                  <span className='distributionBalanceBalance'>{distribution.totalTokens}</span>
                </div>
            </div>

            <div className='distribution'> 
              {distribution.lastDistributionTime > time ? (
              <>
              <div className=''>
              <div className='payTokens'>
                  {distribution.addresses.map((item, index) => (
                  <div key={index} className='payTokensDiv'>
                    <div className='payTokensDetails'>
                    <div className='cursor center' onClick={() => {navigate("/" + item.address)}}>
                    <MetaMaskAvatar className='' address={item.address} size={40} />
                    </div>
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
                {timeForClaiming() !== false  ?
                <>
                  <h1>{timeForClaiming()}</h1>
                  {distribution.myPendingTokens !== 0 &&
                  <h1 onClick={() => {claimTokens()}} className='StartDistributeButtonOrClaim'>Claim {distribution.myPendingTokens} Tokens</h1>
                  }
                </>
                : <h1 onClick={() => {startDistribution()}} className="StartDistributeButtonOrClaim">Start Distribution</h1>
                }
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
