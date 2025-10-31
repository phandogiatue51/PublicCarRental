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
import AccountTabs from "./Pages/Account/AccountTabs";
import ForgotPassword from "./Pages/Account/ForgotPassword";
import ModelDetail from "./Pages/ModelDetail";
import Success from './Pages/Payment/Success';
import Cancel from './Pages/Payment/Cancel';
import AdminRoute from "./admin/AdminRoute";
import StaffRoute from "./staff/components/StaffRoute";
import { ChakraProvider } from "@chakra-ui/react";
import ResetPassword from "./Pages/Account/ResetPassword";

function App() {
  return (
    <ChakraProvider>
      <Routes>
        <Route path="admin/*" element={
          <AdminRoute>
            <Main />
          </AdminRoute>
        } />
        <Route path="staff/*" element={
          <StaffRoute>
            <StaffApp />
          </StaffRoute>
        } />
        <Route path="*" element={
          <>
            <Navbar />
            <Routes>
              <Route index path="/" element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="models" element={<Models />} />
              <Route path="models/:id" element={<ModelDetail />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="team" element={<Team />} />
              <Route path="contact" element={<Contact />} />
              <Route path="login" element={<Login />} />
              <Route path="sign-up" element={<SignUp />} />
              <Route path="account" element={<AccountTabs />} />
              <Route path="/payment/success" element={<Success />} />
              <Route path="/payment/cancel" element={<Cancel />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

            </Routes>
          </>
        } />
      </Routes>
    </ChakraProvider>
  );
}

export default App;