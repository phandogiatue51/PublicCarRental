import "../src/dist/styles.css";
import About from "./Pages/About";
import Home from "./Pages/Home";
import Navbar from "../src/components/Navbar";
import { Route, Routes } from "react-router-dom";
import Models from "./Pages/Models";
import TestimonialsPage from "./Pages/TestimonialsPage";
import Team from "./Pages/Team";
import Contact from "./Pages/Contact";
import Main from "./admin/AdminApp";
import StaffApp from "./staff/App";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";

function App() {
  return (
    <Routes>
      <Route path="admin/*" element={<Main />} />
      <Route path="staff/*" element={<StaffApp />} />
      <Route path="*" element={
        <>
          <Navbar />
          <Routes>
            <Route index path="/" element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="models" element={<Models />} />
            <Route path="testimonials" element={<TestimonialsPage />} />
            <Route path="team" element={<Team />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="sign-up" element={<SignUp />} />
          </Routes>
        </>
      } />
    </Routes>
  );
}

export default App;
