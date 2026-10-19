import { useState, useEffect, useRef, useMemo } from "react";
import api from "./utils/api";
import romaniaData from "./utils/romania.json";
import { useNavigate } from "react-router-dom";
import { useAuth } from './AuthContext';

const calculateAge = (birthString: string | null) => {
    if (!birthString) return "N/A";
    const birth = new Date(birthString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const Community = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [players, setPlayers] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingGrid, setIsLoadingGrid] = useState(false);

    const [page, setPage] = useState(1);
    const [levelFilter, setLevelFilter] = useState("");
    const [sortOption, setSortOption] = useState("CreatedAt-desc");

    const [locationInput, setLocationInput] = useState("");
    const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const locationWrapperRef = useRef<HTMLDivElement>(null);

    const navigate=useNavigate();

    const allLocations = useMemo(() => {
        const locs = [];
        for (const [county, cities] of Object.entries(romaniaData as Record<string, string[]>)) {
            for (const city of cities) {
                const label = `${county}, ${city}`;
                locs.push({ 
                    county, 
                    city, 
                    label,
                    lowerLabel: label.toLowerCase() 
                });
            }
        }
        return locs;
    }, []);

    const filteredLocations = useMemo(() => {
        if (!locationInput) return allLocations.slice(0, 50);

        const searchStr = locationInput.toLowerCase();
        const results = [];

        for (let i = 0; i < allLocations.length; i++) {
            if (allLocations[i].lowerLabel.includes(searchStr)) {
                results.push(allLocations[i]);

                if (results.length === 50) break;
            }
        }
        
        return results;
    }, [locationInput, allLocations]);

    const { token } = useAuth();

    const currentUserId = useMemo(() => {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const id = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.nameid || payload.sub;
            return id ? Number(id) : null;
        } catch {
            return null;
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
                setShowLocationDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!debouncedTerm.trim()) {
                setUsers([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await api.get('User', {
                    params: {
                        page: 1,
                        pageSize: 50,
                        searchTerm: debouncedTerm,
                        excludeUserId: currentUserId,
                    }
                });

                const fetchedUsers = response.data.items || response.data.data || response.data;
                setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
            } catch (error) {
                console.error("Error fetching users:", error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [debouncedTerm, currentUserId]);

    useEffect(() => {
        const fetchAllPlayers = async () => {
            setIsLoadingGrid(true);
            const [sortBy, sortOrder] = sortOption.split("-");
            try {
                const response = await api.get('User', {
                    params: {
                        page,
                        pageSize: 10,
                        sortBy,
                        sortOrder,
                        county: selectedCounty,
                        city: selectedCity,
                        playerLevel: levelFilter ? Number(levelFilter) : null,
                        excludeUserId: currentUserId,
                    }
                });
                setPlayers(response.data.items || []);
                setTotalPages(response.data.totalPages || 1);
                setTotalCount(response.data.totalCount || 0);
            } catch (error) {
                console.error("Fetch players error:", error);
            } finally {
                setIsLoadingGrid(false);
            }
        };
        fetchAllPlayers();
    }, [page, sortOption, selectedCounty, selectedCity, levelFilter, currentUserId]);

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        
        let pages = [];
        const maxVisible = 3; 

        for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
            pages.push(
                <button 
                    key={i} onClick={() => setPage(i)}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${page === i ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                    {i}
                </button>
            );
        }

        if (totalPages > maxVisible + 1) {
            pages.push(<span key="dots" className="px-2 text-slate-500 font-bold">...</span>);
        }

        if (totalPages > maxVisible) {
            pages.push(
                <button 
                    key={totalPages} onClick={() => setPage(totalPages)}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${page === totalPages ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                    {totalPages}
                </button>
            );
        }

        return (
            <div className="flex gap-2 items-center justify-center mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 font-bold">&lt; Prev</button>
                {pages}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 font-bold">Next &gt;</button>
            </div>
        );
    };

    const getInitials = (first: string, last: string) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
    };

   return (
        <div className="min-h-screen bg-slate-900 p-8 md:p-12 font-sans">
            <div className="max-w-7xl w-full flex flex-col gap-12">
                <div className="max-w-7xl w-full flex flex-col gap-6 pl-50">

                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-left">
                        Find Players
                    </h1>

                    <div className="relative w-200">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search by username, name or email" 
                            className="w-full bg-slate-800 border border-slate-700 text-white text-lg rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-lg placeholder-slate-500"
                        />

                        {searchTerm && (
                            <button 
                                onClick={() => {
                                    setSearchTerm("");
                                    setUsers([]);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {showDropdown && searchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-50 overflow-hidden">
                                
                                {isLoading ? (
                                    <div className="p-6 text-center text-slate-400 font-medium animate-pulse">
                                        Searching for players...
                                    </div>
                                ) : users.length > 0 ? (
                                    <div className="flex flex-col py-2">
                                        {users.map((user, index) => (
                                            <div 
                                                key={user.userId || index}
                                                onClick={() => navigate(`/profile/${user.userId}`, { state: { user } })}
                                                className="flex items-center gap-4 px-6 py-4 border border-transparent hover:border-orange-500/50 cursor-pointer transition-all duration-200"
                                            >
                                                <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-slate-700 border border-slate-600">
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full bg-slate-700 rounded-full">
                                                            <span className="text-xl text-white font-bold tracking-wide">
                                                                {getInitials(user.firstName, user.lastName)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col flex-1 justify-center">
                                                    <span className="text-lg font-bold text-white leading-tight">
                                                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-400 mt-0.5">
                                                        {calculateAge(user.dateOfBirth)} — {user.city || "N/A"} — Level: <span className="font-bold">{user.playerLevel || 1}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-slate-400 font-medium">
                                        No players found for "{searchTerm}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            <div className="flex flex-col gap-6 pl-50 pt-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <h2 className="text-3xl font-extrabold text-white shrink-0">
                            All Players <span className="text-lg text-slate-400 font-medium ml-2">({totalCount})</span>
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
                                <option value="">All Levels</option>
                                <option value="1">Level 1</option>
                                <option value="2">Level 2</option>
                                <option value="3">Level 3</option>
                            </select>

                            <div className="relative" ref={locationWrapperRef}>
                                <input 
                                    type="text" 
                                    placeholder="Search location..." 
                                    value={locationInput}
                                    onFocus={() => setShowLocationDropdown(true)}
                                    onChange={e => {
                                        setLocationInput(e.target.value);
                                        setShowLocationDropdown(true);
                                        if (e.target.value === "") {
                                            setSelectedCounty(null);
                                            setSelectedCity(null);
                                            setPage(1);
                                        }
                                    }}
                                    className="bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-orange-500 outline-none w-56 placeholder-slate-500"
                                />
                                
                                {locationInput && (
                                    <button 
                                        onClick={() => {
                                            setLocationInput("");
                                            setSelectedCounty(null);
                                            setSelectedCity(null);
                                            setShowLocationDropdown(false);
                                            setPage(1);
                                        }} 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                                {showLocationDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto z-40">
                                        {filteredLocations.length > 0 ? (
                                            filteredLocations.map((loc, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => {
                                                        setLocationInput(loc.label);
                                                        setSelectedCounty(loc.county);
                                                        setSelectedCity(loc.city);
                                                        setShowLocationDropdown(false);
                                                        setPage(1);
                                                    }}
                                                    className="px-4 py-2 hover:bg-orange-500/20 cursor-pointer text-sm text-slate-300 hover:text-white transition-colors"
                                                >
                                                    {loc.label}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-slate-500">No locations found.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <select value={sortOption} onChange={e => { setSortOption(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
                                <option value="CreatedAt-desc">Joined: Newest to Oldest</option>
                                <option value="CreatedAt-asc">Joined: Oldest to Newest</option>
                                <option value="DateOfBirth-desc">Age: Youngest to Oldest</option>
                                <option value="DateOfBirth-asc">Age: Oldest to Youngest</option>
                                <option value="Height-desc">Height: Tallest to Shortest</option>
                                <option value="Height-asc">Height: Shortest to Tallest</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {isLoadingGrid ? (
                            <div className="py-12 text-center text-slate-400 font-bold animate-pulse">Loading players...</div>
                        ) : players.length > 0 ? (
                            players.map((user, idx) => (
                                <div key={user.userId || idx}
                                onClick={() => navigate(`/profile/${user.userId}`, { state: { user } })}
                                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-slate-800/30 border border-transparent rounded-2xl hover:border-orange-500/50 hover:bg-slate-800/80 transition-all duration-200 group items-center cursor-pointer"
                                >
                                    
                                    <div className="md:col-span-6 flex items-center gap-4 min-w-0">
                                       <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-slate-700 border border-slate-600">
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full bg-slate-700 rounded-full">
                                                            <span className="text-xl text-white font-bold tracking-wide">
                                                                {getInitials(user.firstName, user.lastName)}
                                                            </span>
                                                        </div>
                                                    )}
                                        </div>

                                        <div className="truncate">
                                            <div className="font-bold text-lg text-white group-hover:text-orange-400 transition-colors truncate">
                                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                            </div>
                                            <div className="text-sm text-slate-400 truncate">
                                                {calculateAge(user.dateOfBirth)} — {user.city || "Unknown City"}, {user.county || "Unknown County"} — Level: <span className="font-bold">{user.playerLevel || 1}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 flex flex-col justify-center">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined in</span>
                                        <span className="text-slate-300 font-medium mt-0.5">{formatDate(user.createdAt)}</span>
                                    </div>

                                    <div className="md:col-span-3 flex flex-col justify-center">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tournaments played</span>
                                        <span className="text-slate-300 font-medium mt-0.5">12</span>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400 font-medium">No players found matching your criteria.</div>
                        )}
                    </div>

                    {renderPagination()}
                </div>
            </div>
        </div>
    );
};
export default Community;