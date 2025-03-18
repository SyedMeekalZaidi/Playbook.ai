import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './SideBar.css';

const SideBar : React.FC = () => {

    return (
        <aside className="left-0 w-3xs flex-none border-r" style={{ height: "100vh" }}>
            <h3>sidebar</h3>

        </aside>
    )
}

export default SideBar;