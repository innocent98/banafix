import "./app.scss";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Intro from "./pages/intro/Intro";
import Topbar from "./components/topbar/Topbar";
import TopContact from "./components/topContact/TopContact";
import About from "./pages/about/About";
import Services from "./pages/services/Services";
import Events from "./pages/events/Events";
import Newsletter from "./pages/newsletter/Newsletter";
import Footer from "./components/footer/Footer";
import Sidebar from "./components/sidebar/Sidebar";
import { useState } from "react";
import Testimony from "./pages/testimony/Testimony";


function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <div className="app">
            <TopContact />
            <Topbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            <div className="section">
              <Intro />
              <About />
              <Services />
              <Events />
              <Testimony />
              <Newsletter />
              <Footer />
            </div>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
