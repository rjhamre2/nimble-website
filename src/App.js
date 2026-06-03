import React from 'react';
import LegacyLanding from './components/pages/LegacyLanding';
import MainLanding from './components/pages/MainLanding'; // Ready for your new landing page

function App() {
    // Flag to decide which landing page to show
    const showLegacy = false; 

    if (showLegacy) {
        return <LegacyLanding />;
    } else {
        // You can return the new MainLanding or a blank page here
        /*
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">New Landing Page Coming Soon...</p>
            </div>
        );
        */
        return <MainLanding />; // Replace with <MainLanding /> when ready
    }
}

export default App;