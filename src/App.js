import "./app.scss";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import Intro from "./pages/intro/Intro";
import Topbar from "./components/topbar/Topbar";
import TopContact from "./components/topContact/TopContact";
import About from "./pages/about/About";
import Services from "./pages/services/Services";
import Events from "./pages/events/Events";
import Newsletter from "./pages/newsletter/Newsletter";
import Footer from "./components/footer/Footer";
import Sidebar from "./components/sidebar/Sidebar";
import { useContext, useState } from "react";
import Testimony from "./pages/testimony/Testimony";
import Faq from "./pages/faq/Faq";
import Application from "./pages/application/Application";
import AdminLogin from "./pages/adminLogin/AdminLogin";
import Dashboard from "./pages/dashboard/Dashboard";
import PostEvent from "./pages/postEvent/PostEvent";
import PostTestimonial from "./pages/postTestimonial/PostTestimonial";
import PostPresentation from "./pages/postPresentaion/PostPresentation";
import PostGallery from "./pages/postGallery/PostGallery";
import Data from "./pages/data/Data";
import StudentPage from "./pages/studentPage/StudentPage";
import Settings from "./pages/settings/Settings";
import { Context } from "./context/Context";
import Auth from "./pages/auth/Auth";
import Gallery from "./pages/gallery/Gallery";
import Contact from "./pages/contact/Contact";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useContext(Context);
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <div className="app">
            <TopContact />
            <Topbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />{" "}
            <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />{" "}
            <div className="section">
              <Intro />
              <Services />
              <Events />
              <Faq />
              <Testimony />
              <Newsletter />
              <Footer />
            </div>{" "}
          </div>{" "}
        </Route>{" "}
        <Route path="/about">
          <About />
        </Route>
        <Route path="/contact">
          <Contact />
        </Route>
        <Route path="/gallery">
          <Gallery />
        </Route>
        <Route path="/application">
          <Application />
        </Route>{" "}
        <Route path="/login">
          {user ? <Dashboard /> : <Redirect to="/login" />}
        </Route>{" "}
        <Route path="/dashboard">{user ? <Dashboard /> : <AdminLogin />}</Route>
        <Route path="/data">{user ? <Data /> : <AdminLogin />}</Route>
        <Route path="/post-event">
          {user ? <PostEvent /> : <AdminLogin />}
        </Route>
        <Route path="/post-testimonial">
          {user ? <PostTestimonial /> : <AdminLogin />}
        </Route>
        <Route path="/post-presentation">
          {user ? <PostPresentation /> : <AdminLogin />}
        </Route>
        <Route path="/post-gallery">
          {user ? <PostGallery /> : <AdminLogin />}
        </Route>
        <Route path="/student">{user ? <StudentPage /> : <AdminLogin />}</Route>
        <Route path="/settings">{user ? <Settings /> : <AdminLogin />}</Route>
        <Route path="/auth">{user ? <Auth /> : <AdminLogin />}</Route>
      </Switch>{" "}
    </Router>
  );
}

export default App;
