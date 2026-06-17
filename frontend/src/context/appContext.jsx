import axios from "axios";
import { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContent = createContext()

axios.defaults.withCredentials = true;

const resolveBackendUrl = () => {
    const envUrl = import.meta.env.VITE_BACKEND_URL?.trim();
    if (envUrl) return envUrl.replace(/\/$/, '');
    return 'http://127.0.0.1:4000';
};

const readSavedSessionToken = () => {
    try {
        if (typeof window === 'undefined') return '';
        const raw = window.localStorage.getItem('med_app_auth_token');
        return raw || '';
    } catch {
        return '';
    }
};

export const AppContextProvider = (props)=>{
    
    const backendUrl = resolveBackendUrl()
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)

    const getAuthHeaders = useCallback(() => {
        const savedToken = readSavedSessionToken();
        return savedToken ? { Authorization: `Bearer ${savedToken}` } : undefined;
    }, []);

    const getUserData = useCallback(async ()=>{
        try{
            const {data} = await axios.get(backendUrl + '/api/user/data', { headers: getAuthHeaders() })
            data.success ? setUserData(data.userData) : toast.error(data.message)
        }catch(error){
            toast.error(error.message)
        }
    }, [backendUrl, getAuthHeaders])

    const getAuthState = useCallback(async ()=>{
        try{
            const {data} = await axios.get(backendUrl + '/api/auth/is-auth', { headers: getAuthHeaders() })

            if(data.success){
                setIsLoggedin(true)
                await getUserData()
            }
        }catch(error){
            toast.error(error.message)
        }
    }, [backendUrl, getAuthHeaders, getUserData])

    useEffect(()=>{
        (async () => {
            await getAuthState();
        })();
    },[getAuthState])

    const value ={
        backendUrl,
        isLoggedin,setIsLoggedin,
        userData,setUserData,
        getUserData

    }
    
    
    return(
        <AppContent.Provider value={value}>
                {props.children}
        </AppContent.Provider>
    )
}