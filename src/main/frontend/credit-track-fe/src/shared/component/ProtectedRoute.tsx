import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { HashLoader } from 'react-spinners';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, isAuthLoading } = useContext(AuthContext);

  if (isAuthLoading) {
    console.log("Auth loading in ProtectedRoute:", isAuthLoading);
    return (<>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <HashLoader color='#064F1E' />
        </div>
        </>); // or spinner
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
