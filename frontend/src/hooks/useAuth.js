import { useSelector, useDispatch } from 'react-redux';
import { login as loginAction, register as registerAction, logout as logoutAction, resetAuthState } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, error, success } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    return dispatch(loginAction({ email, password })).unwrap();
  };

  const register = async (username, email, password, phone, age, gender, dob) => {
    return dispatch(registerAction({ username, email, password, phone, age, gender, dob })).unwrap();
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const reset = () => {
    dispatch(resetAuthState());
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  return {
    user,
    loading,
    error,
    success,
    isAuthenticated,
    isAdmin,
    isStaff,
    isStaffOrAdmin,
    login,
    register,
    logout,
    reset,
  };
};

export default useAuth;
