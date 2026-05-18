"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { ThemeProvider } from "./theme-provider";

const Provider = ({ children }) => {
  return (
    <SessionProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
      {children}
    </SessionProvider>
  );
};

export default Provider;
