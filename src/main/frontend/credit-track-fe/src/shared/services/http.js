import axios from "axios";
const gatewayUrl = process.env.REACT_APP_GATEWAY_URL;
const apiUrl =  `${gatewayUrl}/api`;
const http = axios.create({
  baseURL: apiUrl,
    withCredentials: true,
});

const redirectToLogin = () => {
  // sessionStorage.clear();
  window.location.href = `/`;
};


http.interceptors.response.use(
  (response) => response,

  (error) => {
    const isLoginPage = window.location.pathname === "/";
    const isGuest = localStorage.getItem("isGuest") === "true";

    if (isLoginPage) {
      return Promise.reject(error);
    }

    // Handle Network Errors
    if (error.message === "Network Error") {
      console.error("Network error detected. Redirecting to login.");
      if (!isGuest) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    // Handle 401/403 Unauthorized or Forbidden
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("Session expired or unauthorized. Redirecting to login.");
      if (!isGuest) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default http;