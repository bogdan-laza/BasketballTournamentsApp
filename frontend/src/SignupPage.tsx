import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "./utils/api";
import romaniaData from "./utils/romania.json";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function SignupPage(){
    const navigate=useNavigate();
    const [step, setStep]=useState(1);

    const [user, setUser]=useState({
        username:"",
        firstName:"",
        lastName:"",
        passwordHash:"",
        email:"",
        phoneNumber:"",
        playerLevel: 1,
        height: 180, 
        handedness: "Right",
        dateOfBirth: null as Date | null,
        county: "",
        city: ""
    });

    const [error, setError]=useState<string | null>(null);
    const [loading, setLoading]=useState(false);

    const [counties, setCounties] = useState<string[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    const navigation=useNavigate();
    const location=useLocation();
    const alertMessage=location.state?.alertMessage;

    useEffect(() => {
        setCounties(Object.keys(romaniaData));
    }, []);

    const handleChange=(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUser({...user, [e.target.name]:e.target.value});
    };

    const handleCountyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedCounty = e.target.value;
        setUser({ ...user, county: selectedCounty, city: "" }); 

        if (selectedCounty && romaniaData[selectedCounty as keyof typeof romaniaData]) {
            setAvailableCities(romaniaData[selectedCounty as keyof typeof romaniaData]);
        } else {
            setAvailableCities([]);
        }
    };

    const handleSubmit=async (e: React.SubmitEvent<HTMLFormElement>) =>{
        e.preventDefault();
        setError(null);
        setLoading(true);

        try{
           const finalPayload = {
                ...user,
                playerLevel: Number(user.playerLevel),
                height: Number(user.height),
                phoneNumber: user.phoneNumber === "" ? null : user.phoneNumber, 
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : "2004-09-12",
                userId: 0,
                refreshToken: "",
                createdAt: new Date().toISOString(),
                personRole: "Player",
                isEmailVerified: false,
                refreshTokenExpiry: new Date().toISOString(),
            };

            const response=await api.post('/User', finalPayload);
            navigate("/verify-email", {state:{email:user.email}});
       } catch (err: any) {
            console.error("Sign-up error: ", err);

            if (err.response && err.response.data) {
                const errorData = err.response.data;

                if (errorData.detail) {
                    setError(errorData.detail);
                } 
                else if (errorData.errors && typeof errorData.errors === 'object') {
                    const firstErrorKey = Object.keys(errorData.errors)[0];
                    setError(errorData.errors[firstErrorKey][0]);
                } 
                else {
                    setError("Sign-up failed! Please try again.");
                }
            } 
            else {
                setError("Unable to connect to the server.");
            }
        } finally {
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
                <p className="text-slate-400 mt-2">Create your player profile</p>
            </div>

            {alertMessage &&(
                <div className="bg-orange-500/20 border border-orange-500 text-orange-200 p-3 rounded-lg mb-6 text-sm text-center font-semibold animate-pulse">
                    {alertMessage}
                </div>
            )}

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
                {step===1 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                First Name
                            </label>

                            <input required type="text" name="firstName" value={user.firstName} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. Lebron" />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Last Name
                            </label>

                            <input required type="text" name="lastName" value={user.lastName} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. James" />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Phone Number <span className="text-slate-500 font-normal">(Optional)</span>
                            </label>

                            <input type="text" name="phoneNumber" value={user.phoneNumber} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. 0712345678" />
                        </div>

                        <button type="submit" className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                            Continue &rarr;
                        </button>
                    </div>
                )}

                {step===2 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Choose a unique username
                            </label>

                            <input required type="text" name="username" value={user.username} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. MiddyGod" />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Enter your email
                            </label>

                            <input required type="text" name="email" value={user.email} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. bron31@gmail.com" />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Create a password-at least 8 characters(2 digits and one special character)
                            </label>

                            <input required type="password" name="passwordHash" value={user.passwordHash} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" placeholder="e.g. abcde12!" />
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">
                                &larr; Back
                            </button>

                            <button type="submit" className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                                Continue &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">
                                Choose your player level
                            </label>
                            
                            <div className="relative"> 
                                <select 
                                    name="playerLevel" 
                                    value={user.playerLevel} 
                                    onChange={handleChange as any} 
                                    className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value={1}>1 (Beginner)</option>
                                    <option value={2}>2 (Intermediate)</option>
                                    <option value={3}>3 (Veteran)</option>
                                </select>

                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">Handedness</label>
                                <div className="relative">
                                    <select name="handedness" value={user.handedness} onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer">
                                        <option value="Right">Right Handed</option>
                                        <option value="Left">Left Handed</option>
                                        <option value="Ambidextrous">Ambidextrous</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-slate-300 text-sm font-bold">What is your height?</label>
                                    <span className="text-orange-500 font-bold text-lg">{user.height} cm</span>
                            </div>
                            <input type="range" name="height" min="100" max="230" value={user.height} onChange={handleChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                        </div>

                         <div className="flex gap-4 mt-6">
                            <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">
                                &larr; Back
                            </button>

                            <button type="submit" className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                                Continue &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">Date of Birth</label>
                                <DatePicker
                                    selected={user.dateOfBirth}
                                    onChange={(date: Date | null) => setUser({ ...user, dateOfBirth: date })}
                                    dateFormat="dd/MM/yyyy"
                                    showYearDropdown
                                    showMonthDropdown
                                    dropdownMode="select" 
                                    maxDate={new Date()} 
                                    placeholderText="DD/MM/YYYY"
                                    className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                                    wrapperClassName="w-full"
                                />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">County</label>
                                <div className="relative">
                                    <input 
                                        required 
                                        list="counties-list" 
                                        name="county" 
                                        value={user.county} 
                                        onChange={handleCountyChange} 
                                        placeholder="Type to search county..." 
                                        className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-orange-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0" 
                                    />
                                    <datalist id="counties-list">
                                        {counties.map(c => <option key={c} value={c} />)}
                                    </datalist>

                                    {user.county ? (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setUser({ ...user, county: "", city: "" }); 
                                                setAvailableCities([]);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                                            title="Clear county"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    ) : (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                </div>
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">City</label>
                                <div className="relative">
                                    <input 
                                        required 
                                        list="cities-list" 
                                        name="city" 
                                        value={user.city} 
                                        onChange={handleChange} 
                                        disabled={!user.county} 
                                        placeholder={user.county ? "Type to search city..." : "Select a county first"} 
                                        className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:opacity-0" 
                                    />
                                    <datalist id="cities-list">
                                        {availableCities.map(c => <option key={c} value={c} />)}
                                    </datalist>

                                    {user.city ? (
                                        <button 
                                            type="button"
                                            onClick={() => setUser({ ...user, city: "" })} // Clear just the city
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                                            title="Clear city"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    ) : (
                                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${!user.county ? 'text-slate-600' : 'text-slate-400'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                </div>
                        </div>
                                            
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setStep(3)} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">
                                &larr; Back
                            </button>
                            <button type="submit" disabled={loading} className="w-2/3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                                {loading ? "Creating..." : "Create account"}
                            </button>
                        </div>
                    </div>
                        )}
            </form>

            <p className="text-center text-slate-400 mt-8 text-sm">
                Already have an account? <Link to="/login" className="text-orange-500 hover:underline">Log in</Link>
            </p>

        </div>
        </div>
        </div>
    );
}

export default SignupPage;