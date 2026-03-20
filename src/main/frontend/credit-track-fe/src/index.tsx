import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "viewerjs/dist/viewer.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./shared/context/AuthContext";
import { SnackbarProvider } from "./shared/context/SnackbarContext";
import "./license";
import theme from "./theme";
import { ThemeProvider } from "@emotion/react";

const queryClient = new QueryClient();
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SnackbarProvider>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
          <ReactQueryDevtools />
        </SnackbarProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
  // </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
