import {createContext,useContext,useEffect,useState} from 'react';
import {authService} from '../services/services';
const AuthContext=createContext(null);
export function AuthProvider({children}){const[user,setUser]=useState(null);const[loading,setLoading]=useState(true);
 useEffect(()=>{authService.me().then(d=>setUser(d.user)).catch(()=>setUser(null)).finally(()=>setLoading(false));},[]);
 const value={user,loading,login:async d=>{const r=await authService.login(d);setUser(r.user);return r.user;},register:async d=>{const r=await authService.register(d);setUser(r.user);return r.user;},logout:async()=>{await authService.logout();setUser(null);}};
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;}
export const useAuth=()=>useContext(AuthContext);
