// utils/handleApiError.js
export const handleApiError = (error, setUser, setTokenExpiredMessage) => {
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.error === "Invalid or expired token"
    ) {
      localStorage.removeItem("userToken");
      setUser(null);
      setTokenExpiredMessage("Your session has expired. Please log in again.");
    }
};  