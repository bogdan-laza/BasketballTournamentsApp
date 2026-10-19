import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "./utils/api";
import romaniaData from "./utils/romania.json";

interface ReviewStats {
    numberOfReviews: number;
    avgLevel: number;
}

const LevelStatBar = ({ label, value, tooltipText }: { label: string; value: number; tooltipText: string }) => {
    const barHeights = ["h-7", "h-9", "h-11"];

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 relative group mb-8 justify-center">
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 border border-slate-600 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none normal-case not-italic font-normal tracking-normal text-center">
                    {tooltipText}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-600"></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-4 border-transparent border-t-slate-900"></div>
                </div>

                <div className="cursor-help text-slate-400 hover:text-slate-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <span className="uppercase font-extrabold italic text-slate-200 tracking-wider text-sm whitespace-nowrap">
                    {label} <span className="text-orange-500 ml-1 text-sm">{value.toFixed(1)}</span>
                </span>
            </div>
            
            <div className="flex gap-1.5 items-end justify-center h-7 w-full mt-5">
                {[0, 1, 2].map((index) => {
                    const fillPercentage = Math.min(Math.max(value - index, 0), 1) * 100;
                    return (
                        <div 
                            key={index} 
                            className={`relative w-4 ${barHeights[index]} bg-slate-800 rounded-sm overflow-hidden border border-slate-700/50`}
                        >
                            <div 
                                className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-500" 
                                style={{ width: `${fillPercentage}%` }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AccountSettings = () => {
    const { isAuthenticated, token } = useAuth();
    const [activeTab, setActiveTab] = useState("Personal Information");
    const [isLoading, setIsLoading] = useState(true);

    const [userId, setUserId] = useState<number | null>(null);
    const [rawUser, setRawUser] = useState<any>(null);
    const [counties, setCounties] = useState<string[]>([]);
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isEditingLevel, setIsEditingLevel] = useState(false);

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        birthDate: "",
        county: "",
        city: "",
        phoneNumber: "",
        handedness: "Right",
        height: "",
        playerLevel: 1
    });

   useEffect(() => {
        setCounties(Object.keys(romaniaData));
    }, []);

    useEffect(() => {
        if (isAuthenticated && token) {
            try {
                const payloadBase64 = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payloadBase64));

                const extractedUserId = decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
                                     || decodedPayload.nameid 
                                     || decodedPayload.sub;

                if (extractedUserId) {
                    setUserId(extractedUserId);
                    Promise.all([
                        api.get(`User/${extractedUserId}`),
                        api.get(`Review/stats/${extractedUserId}`)
                    ])
                    .then(([userResponse, statsResponse]) => {
                            const user = userResponse.data;
                            setRawUser(user); 
                            setStats(statsResponse.data);

                            let formattedDate = "";
                            if (user.dateOfBirth) {
                                const d = new Date(user.dateOfBirth);
                                formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                            }

                            setFormData({
                                username: user.username || "",
                                firstName: user.firstName || "",
                                lastName: user.lastName || "",
                                email: user.email || "",
                                birthDate: formattedDate,
                                county: user.county || "",
                                city: user.city || "",
                                phoneNumber: user.phoneNumber || "",
                                handedness: user.handedness || "Right",
                                height: user.height ? String(user.height) : "",
                                playerLevel: user.playerLevel || 1
                            });

                            if (user.county && romaniaData[user.county as keyof typeof romaniaData]) {
                                setAvailableCities(romaniaData[user.county as keyof typeof romaniaData]);
                            }
                        })
                        .catch((error) => console.error("Error fetching user settings:", error))
                        .finally(() => setIsLoading(false));
                }
            } catch (error) {
                console.error("Failed to decode token:", error);
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, token]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData({ 
            ...formData, 
            [name]: name === "playerLevel" ? Number(value) : value 
        });
    };

    const handleCountyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedCounty = e.target.value;
        setFormData({ ...formData, county: selectedCounty, city: "" }); 

        if (selectedCounty && romaniaData[selectedCounty as keyof typeof romaniaData]) {
            setAvailableCities(romaniaData[selectedCounty as keyof typeof romaniaData]);
        } else {
            setAvailableCities([]);
        }
    };

   const handleSaveChanges = async () => {
        setError(null);
        setSuccess(null);

        if (!formData.firstName.trim()) return setError("First name is required.");
        if (!formData.lastName.trim()) return setError("Last name is required.");
        if (!formData.county.trim()) return setError("County is required.");
        if (!formData.city.trim()) return setError("City is required.");

        setIsSaving(true);

        try {
            let isoDate = null;
            if (formData.birthDate) {
                const [day, month, year] = formData.birthDate.split('/');
                isoDate = `${year}-${month}-${day}`; 
            }

            const payload = {
                ...rawUser, 
                ...formData, 
                dateOfBirth: isoDate, 
                height: formData.height ? Number(formData.height) : null,
                playerLevel: Number(formData.playerLevel),
                phoneNumber: formData.phoneNumber === "" ? null : formData.phoneNumber,
            };

            await api.put(`User/${userId}`, payload);
            
            setSuccess("Personal information updated successfully!");
            setTimeout(() => setSuccess(null), 3000);

        } catch (err: any) {
            console.error("Full backend error:", err.response?.data || err);
            
            if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
                const firstErrorKey = Object.keys(err.response.data.errors)[0];
                setError(err.response.data.errors[firstErrorKey][0]);
            } 
            else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } 
            else if (typeof err.response?.data === 'string') {
                setError(err.response.data);
            } 
            else {
                setError("Failed to update profile. Please try again.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleChangePasswordSubmit = async () => {
        setError(null);
        setSuccess(null);

        if (!passwordData.oldPassword) return setError("Please enter your current password.");
        if (!passwordData.newPassword) return setError("Please enter the new password.");
        if (!passwordData.confirmPassword) return setError("Please confirm your new password.");

        const digitCount = (passwordData.newPassword.match(/\d/g) || []).length;
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

        if (passwordData.newPassword.length < 8) return setError("The password must be at least 8 characters long.");
        if (digitCount < 2) return setError("The password must contain at least 2 digits.");
        if (!hasSpecialChar) return setError("The password must contain at least one special character.");
        if (passwordData.newPassword !== passwordData.confirmPassword) return setError("Passwords do not match.");

        setIsChangingPassword(true);

        try {
            await api.post(`User/${userId}/change-password`, {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            setSuccess("Password updated successfully!");
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error("Password change error:", err.response?.data || err);
            setError(err.response?.data?.detail || err.response?.data || "Failed to change password. Please check your old password and try again.");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const menuOptions = [
        "Personal Information",
        "Player Settings",
        "Change Password"
    ];

    const getRecommendedLevel = () => {
        if (!stats || stats.numberOfReviews === 0) return formData.playerLevel; 
        
        const avg = stats.avgLevel;
        const decimalPart = avg - Math.floor(avg);
        
        return decimalPart < 0.7 ? Math.floor(avg) : Math.floor(avg) + 1;
    };

    const recommendedLevel = getRecommendedLevel();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex justify-center items-center">
                <span className="text-white text-xl font-bold animate-pulse">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-8 md:p-12">
            
            <h1 className="text-5xl font-extrabold text-white mb-10 tracking-tight text-left">
                My Settings
            </h1>

            <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-72 flex flex-col gap-2">
                    {menuOptions.map((option) => (
                        <button
                            key={option}
                            onClick={() => setActiveTab(option)}
                            className={`text-left px-6 py-4 rounded-xl font-bold transition-all duration-200 ${
                                activeTab === option
                                    ? "bg-slate-800 text-white shadow-lg border-l-4 border-orange-500" 
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"     
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

               <div className="pl-0 md:pl-15 flex-1 max-w-3xl">
                    {activeTab === "Personal Information" && (
                        <div className="flex flex-col gap-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Personal Information</h2>
                                <p className="text-slate-400">Update your account details here.</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl font-semibold">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-xl font-semibold">
                                    {success}
                                </div>
                            )}


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">Username</label>
                                    <input type="text" name="username" value={formData.username} disabled className="bg-slate-900/50 border border-slate-800 text-slate-500 text-lg px-4 py-3 rounded-xl cursor-not-allowed" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">Email Address</label>
                                    <input type="email" name="email" value={formData.email} disabled className="bg-slate-900/50 border border-slate-800 text-slate-500 text-lg px-4 py-3 rounded-xl cursor-not-allowed" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">First Name</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="bg-slate-800 border border-slate-700 text-white text-lg px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">Last Name</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="bg-slate-800 border border-slate-700 text-white text-lg px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
                                </div>

                               <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">Birth Date</label>
                                    <input type="text" name="birthDate" value={formData.birthDate} disabled className="bg-slate-900/50 border border-slate-800 text-slate-500 text-lg px-4 py-3 rounded-xl cursor-not-allowed" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">Phone Number</label>
                                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="bg-slate-800 border border-slate-700 text-white text-lg px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
                                </div>

                               <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">County</label>
                                    <div className="relative">
                                        <input 
                                            required 
                                            list="counties-list" 
                                            name="county" 
                                            value={formData.county} 
                                            onChange={handleCountyChange} 
                                            placeholder="Type to search county..." 
                                            className="w-full bg-slate-800 text-white border border-slate-700 text-lg rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow [&::-webkit-calendar-picker-indicator]:opacity-0" 
                                        />
                                        <datalist id="counties-list">
                                            {counties.map(c => <option key={c} value={c} />)}
                                        </datalist>

                                        {formData.county ? (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, county: "", city: "" }); 
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

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">City</label>
                                    <div className="relative">
                                        <input 
                                            required 
                                            list="cities-list" 
                                            name="city" 
                                            value={formData.city} 
                                            onChange={handleInputChange} 
                                            disabled={!formData.county} 
                                            placeholder={formData.county ? "Type to search city..." : "Select a county first"} 
                                            className="w-full bg-slate-800 text-white border border-slate-700 text-lg rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900/50 [&::-webkit-calendar-picker-indicator]:opacity-0" 
                                        />
                                        <datalist id="cities-list">
                                            {availableCities.map(c => <option key={c} value={c} />)}
                                        </datalist>

                                        {formData.city ? (
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({ ...formData, city: "" })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                                                title="Clear city"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${!formData.county ? 'text-slate-600' : 'text-slate-400'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-center">
                                <button 
                                    onClick={handleSaveChanges} 
                                    disabled={isSaving}
                                    className={`font-bold py-3 px-8 rounded-xl transition-all duration-200 ${
                                        isSaving 
                                            ? "bg-orange-400 cursor-not-allowed opacity-70" 
                                            : "bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/20 active:scale-95 text-white"
                                    }`}
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "Player Settings" && (
                        <div className="flex flex-col gap-10">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Player Settings</h2>
                                <p className="text-slate-400">Update your player details here.</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl font-semibold">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-xl font-semibold">
                                    {success}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <h3 className="text-xl font-bold text-white">Handedness</h3>
                                <div className="flex gap-4">
                                    {['Left', 'Right', 'Ambidextrous'].map(hand => (
                                        <button
                                            key={hand}
                                            type="button"
                                            onClick={() => setFormData({...formData, handedness: hand})}
                                            className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all duration-200 ${
                                                formData.handedness === hand
                                                ? 'border-orange-500 bg-slate-800 text-white shadow-orange-500/10'
                                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                            }`}
                                        >
                                            {hand}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 max-w-[200px]">
                                <h3 className="text-xl font-bold text-white">Height <span className="text-slate-400 text-sm font-normal ml-1">(cm)</span></h3>
                                <input 
                                    type="number" 
                                    name="height" 
                                    value={formData.height} 
                                    onChange={handleInputChange}
                                    placeholder="e.g. 185"
                                    className="bg-slate-800 border border-slate-700 text-white text-lg px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" 
                                />
                            </div>

                            <div className="flex justify-start">
                                <button onClick={handleSaveChanges} disabled={isSaving} className={`font-bold py-3 px-8 rounded-xl transition-all duration-200 ${isSaving ? "bg-orange-400 cursor-not-allowed opacity-70" : "bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/20 active:scale-95 text-white"}`}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                            <div className="h-px w-full bg-slate-700/50 my-2"></div>

                            <div className="flex flex-col gap-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Player Level</h3>
                                    <p className="text-slate-400 text-sm">See how your selected skill level compares with your reviews.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="flex flex-col items-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                                        <p className="text-slate-300 font-medium mb-6 text-center h-12 flex items-center">Your current level is:</p>
                                        <LevelStatBar 
                                            label="Level" 
                                            value={formData.playerLevel} 
                                            tooltipText="Your currently selected skill level." 
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col items-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                                        <p className="text-slate-300 font-medium mb-6 text-center h-12 flex items-center">
                                            The level we recommend to you based on the reviews:
                                        </p>
                                        <LevelStatBar 
                                            label="Rec. Level" 
                                            value={recommendedLevel} 
                                            tooltipText={
                                                stats?.numberOfReviews && stats.numberOfReviews > 0 
                                                    ? `Based on ${stats.numberOfReviews} reviews (Avg: ${stats.avgLevel.toFixed(1)})` 
                                                    : "Not enough reviews yet."
                                            } 
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center mt-2">
                                    {!isEditingLevel ? (
                                        <button 
                                            onClick={() => setIsEditingLevel(true)}
                                            className="text-orange-500 hover:text-orange-400 font-bold transition-colors underline underline-offset-4"
                                        >
                                            Change Level
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-4 w-full max-w-sm mt-4 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 shadow-inner">
                                            <div>
                                                <label className="block text-slate-300 text-sm font-bold mb-2">
                                                    Choose your player level
                                                </label>
                                                <div className="relative"> 
                                                    <select 
                                                        name="playerLevel" 
                                                        value={formData.playerLevel} 
                                                        onChange={handleInputChange} 
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
                                            <div className="flex gap-4 w-full">
                                                <button 
                                                    onClick={() => {
                                                        setIsEditingLevel(false);
                                                        if (rawUser) {
                                                            setFormData(prev => ({ ...prev, playerLevel: rawUser.playerLevel || 1 }));
                                                        }
                                                    }}
                                                    className="flex-1 font-bold py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 shadow-lg active:scale-95"
                                                >
                                                    Cancel
                                                </button>
                                                
                                                <button 
                                                    onClick={async () => {
                                                        await handleSaveChanges();
                                                        setIsEditingLevel(false); 
                                                    }}
                                                    disabled={isSaving}
                                                    className={`flex-1 font-bold py-3 rounded-xl transition-all duration-200 ${isSaving ? "bg-orange-400 cursor-not-allowed opacity-70" : "bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/20 active:scale-95 text-white"}`}
                                                >
                                                    {isSaving ? "Saving..." : "Save"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Change Password" && (
                        <div className="flex flex-col gap-8 max-w-xl">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Change Password</h2>
                                <p className="text-slate-400">Keep your account secure by using a strong password.</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl font-semibold">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-xl font-semibold">
                                    {success}
                                </div>
                            )}

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">Old Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showOldPassword ? "text" : "password"} 
                                            name="oldPassword"
                                            value={passwordData.oldPassword}
                                            onChange={handlePasswordChangeInput}
                                            className="w-full bg-slate-800 border border-slate-700 text-white text-lg px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow pr-12"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            {showOldPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.342-1.748c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-md text-slate-400">
                                    The new password must contain at least <strong className="text-white">8 characters</strong>, including at least <strong className="text-white">2 digits</strong> and <strong className="text-white">one special character</strong>.
                                </p>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChangeInput}
                                            className="w-full bg-slate-800 border border-slate-700 text-white text-lg px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow pr-12"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            {showNewPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.342-1.748c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-400 pl-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChangeInput}
                                            className="w-full bg-slate-800 border border-slate-700 text-white text-lg px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow pr-12"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.342-1.748c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-start">
                                <button 
                                    onClick={handleChangePasswordSubmit} 
                                    disabled={isChangingPassword} 
                                    className={`font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg ${isChangingPassword ? "bg-orange-400 cursor-not-allowed opacity-70" : "bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/20 active:scale-95 text-white"}`}
                                >
                                    {isChangingPassword ? "Saving..." : "Save Password"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AccountSettings;