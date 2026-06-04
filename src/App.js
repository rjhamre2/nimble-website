import React from 'react';
import LegacyLanding from './components/pages/LegacyLanding';
import MainLanding from './components/pages/MainLanding'; 

function App() {
    // Flag to decide which landing page to show
    const showLegacy = true; 

    if (showLegacy) {
        return <LegacyLanding />;
    } 
    
    return <MainLanding />;
}

export default App;