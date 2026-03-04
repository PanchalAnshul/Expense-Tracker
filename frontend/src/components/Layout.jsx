import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-wrapper">
                <Header />
                <main className="main-content">
                    <div className="page-container">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
