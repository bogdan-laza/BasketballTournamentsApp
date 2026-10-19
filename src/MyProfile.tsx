import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./utils/api";

interface User {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    personRole: string;
    createdAt: string;
    profileImageUrl?: string;
    playerLevel: number;
    dateOfBirth: string; 
    county?: string;
    city?: string;
    handedness?: string;
    height?: number;
}

interface ReviewStats {
    numberOfReviews: number;
    avgSportsmanship: number;
    avgReliability: number;
    avgLevel: number;
}

const SegmentedStatBar = ({ label, value, tooltipText }: { label: string; value: number; tooltipText: string }) => {
    return (
        <div className="flex flex-col bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-md w-full sm:w-[260px]">
            <div className="flex justify-between items-end mb-2 px-1">
                
                <div className="flex items-center gap-1.5 relative group">
                    <span className="uppercase font-extrabold italic text-slate-200 tracking-wider text-sm">
                        {label}
                    </span>
                    
                    <div className="cursor-help text-slate-400 hover:text-slate-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2.5 bg-slate-900 border border-slate-600 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none normal-case not-italic font-normal tracking-normal">
                        {tooltipText}
                        <div className="absolute top-full left-4 -mt-[1px] border-4 border-transparent border-t-slate-600"></div>
                        <div className="absolute top-full left-4 -mt-[2px] border-4 border-transparent border-t-slate-900"></div>
                    </div>
                </div>

                <span className="text-orange-500 font-black text-sm">
                    {value.toFixed(1)}
                </span>
            </div>
            <div className="flex gap-1.5 h-5 px-1">
                {[0, 1, 2, 3, 4].map((index) => {
                    const fillPercentage = Math.min(Math.max(value - index, 0), 1) * 100;
                    return (
                        <div 
                            key={index} 
                            className="relative flex-1 bg-slate-900 skew-x-[-15deg] overflow-hidden rounded-sm"
                        >
                            <div 
                                className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-500" 
                                style={{ width: `${fillPercentage}%` }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

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

function MyProfile(){
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { token, isAuthenticated } = useAuth();
    const navigate=useNavigate();
    const location=useLocation();

    useEffect(() => {
        if (location.state?.newImageUrl) {
            setUser((prevUser: any) => ({
                ...prevUser,
                profileImageUrl: location.state.newImageUrl
            }));
            window.history.replaceState({}, document.title) 
        }
    }, [location.state]);

   useEffect(() => {
        if (isAuthenticated && token) {
            try {
                const payloadBase64 = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payloadBase64));
                const userId = decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
                            || decodedPayload.nameid 
                            || decodedPayload.sub;

                if (userId) {
                    Promise.all([
                        api.get(`User/${userId}`),
                        api.get(`Review/stats/${userId}`)
                    ])
                    .then(([userResponse, statsResponse]) => {
                        let fetchedUser = userResponse.data;

                        if (fetchedUser.profileImage) {
                            fetchedUser.profileImageUrl = fetchedUser.profileImage;
                        }

                        if (location.state?.newImageUrl) {
                            fetchedUser.profileImageUrl = location.state.newImageUrl;
                        }

                        setUser(fetchedUser);
                        setStats(statsResponse.data);
                    })
                    .catch((error) => console.error("Error fetching profile data:", error))
                    .finally(() => setLoading(false));
                }
            } catch (error) {
                console.error("Failed to decode token:", error);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, token, location.state]); 

    const getInitials = (first: string, last: string) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
    };

    const getAge = (birthdayString: string) => {
        if (!birthdayString) return "N/A";
        const birthday = new Date(birthdayString);
        const today = new Date();
        let age = today.getFullYear() - birthday.getFullYear();
        const m = today.getMonth() - birthday.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
            age--;
        }
        return age;
    };

    const todayIndex=new Date().getDay();
    const realDay=todayIndex===0 ? 6 : todayIndex-1;
    const mockPlayData = [true, false, true, false, false, false, false];

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
        const isInFuture=index>realDay;
        const played=!isInFuture && mockPlayData[index];
        return {day, isInFuture, played};
    })

    const timesPlayedThisWeek=weekDays.filter(d=>d.played).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <p className="text-xl text-slate-400 animate-pulse">Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <p className="text-xl text-red-400">Failed to load user data.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto mt-10">
                <div className="flex flex-col items-center justify-center mb-12">
                    <div 
                        onClick={() => navigate('/myprofile/change-photo', { state: { user } })}
                        className="relative h-40 w-40 rounded-full cursor-pointer group shadow-xl ring-4 ring-slate-800 hover:ring-orange-500 transition-all duration-300">
                        {user.profileImageUrl ? (
                            <img 
                                src={user.profileImageUrl} 
                                alt="Profile" 
                                className="h-full w-full object-cover rounded-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full bg-slate-700 rounded-full">
                                <span className="text-5xl text-white font-bold tracking-wide">
                                    {getInitials(user.firstName, user.lastName)}
                                </span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-white/80 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-900 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-bold text-slate-900">
                                Change photo
                            </span>
                        </div>
                    </div>

                   

                    <h1 className="text-3xl font-extrabold text-white mt-4 tracking-tight">
                        {user.firstName} {user.lastName}
                    </h1>

                {stats && (
                    <div className="w-full flex flex-col items-center mb-12 mt-4">
                        <p className="text-slate-500 text-sm mb-6 font-semibold text-center">
                            Based on {stats.numberOfReviews} {stats.numberOfReviews === 1 ? 'review' : 'reviews'}
                        </p>
                        
                        <div className="relative flex flex-col md:flex-row gap-6">
                            
                            <SegmentedStatBar 
                                label="Sportsmanship" 
                                value={stats.avgSportsmanship} 
                                tooltipText="Based on fair play, respect for opponents, and being gracious in victory or defeat."
                            />
                            
                            <SegmentedStatBar 
                                label="Reliability" 
                                value={stats.avgReliability} 
                                tooltipText="Based on punctuality and the commitment to show up for scheduled matches."
                            />

                            <div className="hidden md:flex absolute top-full right-full mt-10 pr-6 border-r-2 border-orange-500 flex-row items-start justify-end gap-6 h-34">
                                <LevelStatBar 
                                    label="My Level" 
                                    value={user.playerLevel} 
                                    tooltipText="The personal skill level you selected during registration (1 = Beginner, 2 = Intermediate, 3 = Veteran)."
                                />
                                <LevelStatBar 
                                    label="Community Rating" 
                                    value={stats.avgLevel} 
                                    tooltipText="The average skill level evaluated by other players who played with you."
                                />
                            </div>

                           <div className="hidden md:flex absolute top-full left-0 right-0 mt-10 border-r-2 border-orange-500 flex-row justify-center items-start h-34">
                                <div className="flex flex-col items-start justify-start gap-3">
                                    
                                    <div className="flex items-center gap-2.5 group whitespace-nowrap">
                                        <span className="text-md text-white font-extrabold tracking-wide">
                                            Location:
                                        </span>
                                        <span className="text-md text-slate-300 font-medium tracking-wide">
                                            {user.city ? `${user.city}, ${user.county}` : "Location unknown"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2.5 group whitespace-nowrap">
                                        <span className="text-md text-white font-extrabold tracking-wide">
                                            Age:
                                        </span>
                                        <span className="text-md text-slate-300 font-medium tracking-wide">
                                            {getAge(user.dateOfBirth)} years old
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2.5 group whitespace-nowrap">
                                        <span className="text-md text-white font-extrabold tracking-wide">
                                            Handedness:
                                        </span>
                                        <span className="text-md text-slate-300 font-medium tracking-wide"> 
                                            {user.handedness ? (user.handedness === "Ambidextrous" ? `${user.handedness}` : `${user.handedness} Handed`) : "N/A"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2.5 group whitespace-nowrap">
                                        <span className="text-md text-white font-extrabold tracking-wide">
                                            Height:
                                        </span>
                                        <span className="text-md text-slate-300 font-medium tracking-wide">
                                            {user.height ? `${user.height / 100} m`  : "N/A"} 
                                        </span>
                                    </div>

                                </div>

                                <div className="absolute top-0 left-full pl-6 flex flex-col w-max gap-5">
                                    <span className="text-md text-white font-extrabold tracking-wide mb-3 whitespace-nowrap">
                                        You've played <span className="text-orange-500 ml-1">{timesPlayedThisWeek}</span> {timesPlayedThisWeek===1 ? " time" : " times"} this week:
                                    </span>
                                    
                                    <div className="flex flex-row items-center gap-4">
                                        {weekDays.map(weekDay => (
                                            <div 
                                                key={weekDay.day} 
                                                className={`flex items-center gap-1.5 text-[14px] font-bold tracking-wide ${weekDay.isInFuture ? 'text-slate-600 opacity-50' : 'text-slate-300'}`}
                                            >
                                                {/* Icon Logic */}
                                                {!weekDay.isInFuture ? (
                                                    weekDay.played ? (
                                                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    )
                                                ) : (
                                                    <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-slate-700"></div> // Empty circle for future days
                                                )}
                                                <span className="uppercase">{weekDay.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden flex flex-row justify-center gap-6 mt-8">
                            <LevelStatBar label="My Level" value={user.playerLevel} tooltipText="The personal skill level you selected during registration (1 = Beginner, 2 = Intermediate, 3 = Veteran)." />
                            <LevelStatBar label="Community Rating" value={stats.avgLevel} tooltipText="The average skill level evaluated by other players who played with you." />
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}

export default MyProfile;