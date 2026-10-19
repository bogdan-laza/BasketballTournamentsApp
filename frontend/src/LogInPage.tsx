import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./utils/api";
import { useAuth } from "./AuthContext";

function LogInPage(){
    const navigate=useNavigate();

    const [user, setUser]=useState({
        username:"",
        password:"",
    });

    const [error, setError]=useState<string | null>(null);
    const [loading, setLoading]=useState(false);

     const {login}=useAuth();

    const handleChange=(e: React.ChangeEvent<HTMLInputElement>) => {
        setUser({...user, [e.target.name]:e.target.value});
    };

    const handleSubmit=async (e: React.SubmitEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setError(null);
        setLoading(true);

        try{
            const finalPayload={
                username:user.username,
                password:user.password,
            };

            const response=await api.post('/Auth/login', finalPayload);

            const data=await response.data;
            login(data.accessToken, data.refreshToken);

            navigate("/tournaments");
        } catch(err:any){
            console.error("Login error: ", err);
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                if(errorData.message==="EmailNotVerified"){
                    const userEmail=err.response.data.email;
                    navigate("/verify-email", {state:{email:userEmail}});
                    return;
                }

                if (err.response.status === 401) {
                    setError("Invalid username or password.");
                    setLoading(false);
                    return; 
                }

                if (errorData.detail) {
                    setError(errorData.detail);
                } else if (errorData.message) {
                    setError(errorData.message);
                } else if (errorData.errors && typeof errorData.errors === 'object') {
                    const firstErrorKey = Object.keys(errorData.errors)[0];
                    setError(errorData.errors[firstErrorKey][0]);
                } else {
                    setError("Login failed! Please try again.");
                }
            } else {
                setError("Unable to connect to the server.");
            }
        } finally{
            setLoading(false);
        }
    }


    return(
        <div className="min-h-screen bg-slate-900 flex flex-col p-8">
                <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                    Hoop<span className="text-orange-500">Zone</span>
                </h1>
                <p className="text-slate-400 mt-2">Log into your profile</p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                    <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Type your username
                            </label>

                            <input required type="text" name="username" value={user.username} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. MiddyGod" />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Type your password
                            </label>

                            <input required type="password" name="password" value={user.password} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. abcde12!" />
                        </div>

                        <div className="mt-6">
                            <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                                {loading?"Logging in...": "Log in"}
                            </button>
                        </div>
                    </div>
            </form>

            <p className="text-center text-slate-400 mt-8 text-sm">
                Don't have an account? <Link to="/signup" className="text-orange-500 hover:underline">Sign up</Link>
            </p>

        </div>
        </div>
        </div>
    );
}

export default LogInPage;