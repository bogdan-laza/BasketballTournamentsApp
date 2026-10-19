import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType{
    isAuthenticated: boolean;
    token: string | null;
    login: (token: string, refreshToken: string)=>void;
    logout: ()=>void;
}

const AuthContext=createContext<AuthContextType | undefined>(undefined);

export const AuthProvider=({ children }: { children:React.ReactNode})=>{
    const [isAuthenticated, setIsAuthenticated]=useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(()=>{
        const token=localStorage.getItem("token");
        if(token){
            setToken(token);
            setIsAuthenticated(true);
        }
    }, []);

    const login=(token:string, refreshToken:string)=>{
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        setToken(token);
        setIsAuthenticated(true);
    }

    const logout=()=>{
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setIsAuthenticated(false);
    }

    return(
        <AuthContext.Provider value={{isAuthenticated, token, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth=()=>{
    const context=useContext(AuthContext);
    if(!context){
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
