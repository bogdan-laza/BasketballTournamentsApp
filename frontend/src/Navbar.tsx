import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useState, useRef, useEffect } from "react";
import api from "./utils/api";

interface User{
    userId:number;
    username:string;
    firstName:string;
    lastName:string;
    email:string;
    phoneNumber:string;
    personRole:string;
    createdAt:string;
    profileImageUrl?:string;
}

export interface NotificationSender {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    playerLevel?: number;
    city?: string;
    county?: string;
}

export interface Notification {
    id: number;
    type: string;
    sender: NotificationSender;
    createdAt: string;
    isRead: boolean;
}

function Navbar(){
    const [isDropdownOpen, setIsDropdownOpen]=useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [currentUser, setCurrentUser]=useState<User | null>(null);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const dropdownRef=useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const navigate=useNavigate();
    const location=useLocation();

    const {isAuthenticated, token, logout}=useAuth();

    useEffect(()=>{
        if(isAuthenticated && token){
                try{
                    const payloadBase64=token.split('.')[1];
                    const decodedPayload=JSON.parse(atob(payloadBase64));

                    const userId = decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
                                || decodedPayload.nameid 
                                || decodedPayload.sub;

                    if(userId){
                        api.get(`User/${userId}`)
                        .then((response)=>{
                             let fetchedUser = response.data;

                        if (fetchedUser.profileImage) {
                            fetchedUser.profileImageUrl = fetchedUser.profileImage;
                        }

                        if (location.state?.newImageUrl) {
                            fetchedUser.profileImageUrl = location.state.newImageUrl;
                        }
                            setCurrentUser(fetchedUser);
                        })
                        .catch((error)=>console.error("Error fetching user for navbar:", error));
                    }
                } catch(error){
                    console.error("Failed to decode token:", error);
                }
            }
            else{
                setCurrentUser(null);
            }
        }, [isAuthenticated, token, location.state]);

    useEffect(()=>{
        function handleClickOutside(event:MouseEvent){
            if(dropdownRef.current && !dropdownRef.current.contains(event.target as Node)){
                setIsDropdownOpen(false);
            }

            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return ()=>document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials=(first:string, last:string)=>{
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
    }

    const handleLogout=async ()=>{
        try{
            await api.post("Auth/logout");
        }catch(error){
            console.error("Backend logout failed, but clearing local session anyway.", error);
        } finally{
            logout();
            navigate("/login");
        }
    };

    return (
        <nav className="bg-slate-900 border-b border-slate-800 text-white px-8 py-4 flex items-center justify-between">
            <div  className="text-3xl md:text-3xl font-extrabold text-white tracking-tighter drop-shadow-lg">
                    Hoop<span className="text-orange-500">Zone</span>
            </div>

            <div className="hidden md:flex gap-8 font-semibold text-slate-300">
                {isAuthenticated? (
                <>
                    <Link to="/tournaments" className="hover:text-orange-400 transition-colors">Browse</Link>
                    <Link to="/mytournaments" className="hover:text-orange-400 transition-colors">My Tournaments</Link>
                    <Link to="/myteams" className="hover:text-orange-400 transition-colors">My Teams</Link>
                    <Link to="/hoop" className="hover:text-orange-400 transition-colors">Hoop</Link>
                    <Link to="/community" className="hover:text-orange-400 transition-colors">Community</Link>
                </>
                ):(
                    <>
                        <Link to="/tournaments" className="hover:text-orange-400 transition-colors">See tournaments</Link>
                    </>
                )
                }
            </div>

            <div className="flex items-center gap-4">
                {isAuthenticated && currentUser ? (
                    <>
                        <div className="relative" ref={notificationsRef}>
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                                        <h3 className="text-white font-bold text-xl">Notifications</h3>
                                    </div>
                                    
                                    <div className="max-h-96 overflow-y-auto bg-slate-800 divide-y divide-slate-700/50">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-slate-400 text-sm">
                                                <p>You don't have any notifications.</p>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div 
                                                    key={notification.id}
                                                    onClick={() => {
                                                        setIsNotificationsOpen(false);
                                                        navigate(`/profile/${notification.sender.userId}`, { 
                                                            state: { 
                                                                user: notification.sender, 
                                                                friendStatus: 'PENDING_RECEIVED' 
                                                            } 
                                                        });
                                                    }}
                                                    className="p-4 flex items-start gap-3 hover:bg-slate-700/50 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-700 border border-slate-600">
                                                        {notification.sender.profileImageUrl ? (
                                                            <img 
                                                                src={notification.sender.profileImageUrl} 
                                                                alt="Sender" 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full w-full bg-slate-600 text-white font-bold text-xs">
                                                                {notification.sender.firstName?.[0]}{notification.sender.lastName?.[0]}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-200 leading-snug">
                                                            <span className="font-bold text-white">
                                                                {notification.sender.firstName} {notification.sender.lastName}
                                                            </span>{" "}
                                                            sent you a friend request.
                                                        </p>

                                                        <div className="flex items-center gap-2 mt-3">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); 
                                                                    /* TODO: Accept logic */
                                                                }}
                                                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow"
                                                            >
                                                                Accept
                                                            </button>

                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); 
                                                                    /* TODO: Reject logic later */
                                                                }}
                                                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-600 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="border-t border-slate-700">
                                        <Link 
                                            to="/notifications" 
                                            onClick={() => setIsNotificationsOpen(false)}
                                            className="block w-full text-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-orange-500 font-semibold text-sm transition-colors"
                                        >
                                            See all notifications
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <button
                            onClick={()=>setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-center h-12 w-12 rounded-full ring-2 ring-transparent hover:ring-orange-500 focus:outline-none focus:ring-orange-500 transition-all overflow-hidden bg-slate-700">
                                {currentUser.profileImageUrl ? (
                                    <img 
                                    src={currentUser.profileImageUrl}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg text-white font-bold tracking-wide">
                                        {getInitials(currentUser.firstName, currentUser.lastName)}
                                    </span>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                                    <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/50">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="text-white font-bold truncate">
                                                {currentUser.firstName} {currentUser.lastName}
                                            </p>

                                            {currentUser.personRole==="Admin" && (
                                                <span className="bg-orange-500/20 text-orange-500 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-orange-500/30">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 truncate">
                                            @{currentUser.username}
                                        </p>
                                    </div>

                                    <div className="py-2">
                                        <Link to="/myprofile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            My Profile
                                        </Link>

                                       <Link to="/myfriends" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                                My Friends
                                        </Link>


                                    <Link to="/account" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Account Settings
                                        </Link>

                                        <Link to="/mystatistics" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                My Statistics
                                        </Link>
                                    </div>

                                    <div className="border-t border-slate-700 py-2">
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Log Out
                                            </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ):
                (
                    <>
                    <div className="flex items-center gap-4">
                       <Link
                        to="/signup"
                        className="inline-flex justify-center items-center px-3 py-1 bg-orange-500 hover:bg-orange-600 transition-colors duration-300 text-white text-lg font-bold rounded-full transform">
                            Sign up
                        </Link>

                        <Link
                            to="/login"
                            className="inline-flex justify-center items-center px-3 py-1 bg-orange-500 hover:bg-orange-600 transition-colors duration-300 text-white text-lg font-bold rounded-full transform">
                                Log in
                        </Link>
                    </div>
                    </>
                )
                }
            </div>
        </nav>
    );
}

export default Navbar;