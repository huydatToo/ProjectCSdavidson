import React, {useRef} from 'react';
import '../css/LandingPage.css';
import { useWallet } from '../utils/WalletContext';
import PageLearn from './PageLearn';
import { Link } from 'react-scroll';


const LandingPage = () => {
    const { setIsConnected, setAccount } = useWallet();
    const scrollRef = useRef(null)

    const connectWallet = async () => {
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setIsConnected(true);
            setAccount(accounts[0]);
          } catch (error) {
            console.error("Wallet connection error:", error);
          }
        }
    };
    

  return (
    <div className='LandingPage'>

    <div className='backgroundStars landingPageBackground noise centerLandingPage'>
        <div className='divHeaderLandingPage center'>
            <h1 className='fontKemco headerLandingPage'>explore web3 open source</h1>
            
            <div className='flexButtonLandingPage'>
              <div className='connectWalletLandingPage borderPixelLandingPage fontKemco'>
                  <span onClick={connectWallet}>connect wallet</span>
              </div>

              <Link to="pageTwo" smooth={true} duration={500}>
              <div className='connectWalletLandingPage borderPixelLandingPage fontKemco'>
                  <span>Learn More</span>
              </div>
              </Link>
            </div>
        </div>
    </div>
    
    <div name="pageTwo" className='pageTwoLearn'>
        <PageLearn scroll={scrollRef}/>
    </div>
    </div>
  );
}

export default LandingPage;
