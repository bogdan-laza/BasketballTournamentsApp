import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./utils/api";

export default function VerifyEmailPage(){
    const location=useLocation();
    const navigate=useNavigate();
    
    const email=location.state?.email || "";

    const [code, setCode]=useState("");
    const [error, setError]=useState("");
    const [isLoading, setIsLoading]=useState(false);
    const [successMsg, setSuccessMsg]=useState("");
    const [resendTimer, setResendTimer]=useState(0);

    useEffect(()=>{
        if(!email){
            navigate("/login");
        }
    }, [email, navigate]);

    useEffect(()=>{
        let interval:ReturnType<typeof setInterval>;

        if(resendTimer>0){
            interval=setInterval(()=>{
                setResendTimer((prev)=>prev-1);
            }, 1000);
        }
        return ()=>clearInterval(interval)
    }, [resendTimer]);

    const handleVerify=async (e:React.FormEvent)=>{
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setIsLoading(true);

        try{
            await api.post("/Auth/verify-email", {email, code});

            setSuccessMsg("Email verified successfully! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        }catch(err:any){
            setError(err.response?.data?.message || "Invalid verification code. Please try again!");
        }finally{
            setIsLoading(false);
        }
    };

    const handleResend=async ()=>{
        if(resendTimer>0)
            return;

        setError("");
        setSuccessMsg("");

        try{
            await api.post("Auth/resend-code", {email:email});

            setSuccessMsg("A new verification code has been sent to your email!");
            setResendTimer(60);
        }catch(err:any){
            setError(err.response?.data?.message || "Failed to resend code. Please try again!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col p-8">
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                            Hoop<span className="text-orange-500">Zone</span>
                        </h1>
                        <h2 className="text-xl font-bold text-white mt-4">Verify Your Email</h2>
                        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                            We sent a 6-digit code to <strong className="text-white">{email}</strong>. Please enter it below.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-500/20 border border-green-500 text-green-200 p-3 rounded-lg mb-6 text-sm text-center font-semibold animate-pulse">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleVerify}>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} 
                            className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-4 text-3xl tracking-[10px] text-center mb-6 focus:outline-none focus:border-orange-500 transition-colors placeholder-slate-600 font-mono"
                            required
                        />
                        
                        <button 
                            type="submit" 
                            disabled={isLoading || code.length < 6}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg transition-all mb-6"
                        >
                            {isLoading ? "Verifying..." : "Verify Email"}
                        </button>
                    </form>

                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={handleResend}
                            disabled={resendTimer > 0}
                            className={`bg-transparent border-none text-sm transition-colors ${
                                resendTimer > 0 
                                    ? "text-slate-500 cursor-not-allowed" 
                                    : "text-orange-500 hover:text-orange-400 hover:underline cursor-pointer"
                            }`}
                        >
                            {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Didn't receive a code? Resend"}
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}