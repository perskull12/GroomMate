import { Link } from "react-router-dom"


export default function Header() {

    return(
        <header>
                <h1>GroomMate</h1>
                <img src="src/assets/logo.png" alt="logo"/>
                <nav style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "end",
                    alignItems: "end",
                    alignContent: "end",
                    fontWeight:"bold"
                }}>
                    <Link to = "/home" >Home</Link>
                    <Link to = "/Feedback" >Reviews</Link>
                    <Link to = "/Notifications">Notifications</Link>
                </nav>
        </header>
    )
}

