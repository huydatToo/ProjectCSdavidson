import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './pages/Home';
import CreateNewProject from './pages/CreateNewProject';
import './css/App.css';
import './css/Modal.css';
import { WalletProvider, useWallet } from './utils/WalletContext';
import ProjectPage from './pages/ProjectPage';
import ProjectDevelopment from './pages/ProjectDevelopment';
import NewHome from './pages/NewHome';
import AccountPage from './pages/AccountPage';
import LandingPage from './pages/LandingPage';

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

const ConnectedStatusWrapper = () => {
  const { isConnected } = useWallet();
  return isConnected ? <Home /> : <LandingPage />;
};



// webapp routing
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <WalletProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConnectedStatusWrapper />}/>
        <Route path="/new" element={<NewHome />}/>
        
        <Route path="/createNewProject" element={<CreateNewProject />}/>
        <Route path="/project/:projectName" element={<ProjectPage />}/>
        <Route path="/:accountAddress" element={<AccountPage />}/>
        <Route path="/project/:projectName/:changeProposalOrGoBack/:value" element={<ProjectPage />}/>
        <Route path="/project/:projectName/development" element={<ProjectDevelopment />}/>
      </Routes>
    </BrowserRouter>
  </WalletProvider>
);