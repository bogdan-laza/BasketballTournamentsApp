import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from 'react-router-dom';
import api from "./utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Tournament {
  tournamentId: number;
  tournamentName: string;
  tournamentDate: string;
  tournamentLocation: string;
  entryFee: number;
  prize: number;
  tournamentFormat: string;
  createdByUserId: number;
  maximumNumberOfTeams: number; 
  status: string;
  registrationDeadline: string;
  rules: string;
  tournamentImageUrl: string;
}

function TournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams]=useSearchParams();

  const [page, setPage]=useState(parseInt(searchParams.get("page") || "1"));
  const [pageSize]=useState(6);
  const [totalPages, setTotalPages]=useState(1);
  const [totalCount, setTotalCount]=useState(1);

  const [searchName, setSearchName]=useState(searchParams.get("name") || "");

  const [searchLocation, setSearchLocation]=useState(searchParams.get("location") || "");

  const [searchFormat, setSearchFormat]=useState(searchParams.get("format") || "");

  const urlStatus=searchParams.get("status");
  const initialStatus=urlStatus!==null ? urlStatus : "Upcoming";
  const defaultSortOrder=(initialStatus==="Upcoming" || initialStatus==="Ongoing" ? "asc" : "desc");

  const [searchStatus, setSearchStatus]=useState(initialStatus);

  const [searchMonth, setSearchMonth]=useState(searchParams.get("month") || "");

  const [startDate, setStartDate]=useState<Date|null>(searchParams.get("start") ? new Date(searchParams.get("start") as string) : null);

  const [endDate, setEndDate]=useState<Date|null>(searchParams.get("end") ? new Date(searchParams.get("end") as string) : null);

  const [isCalendarOpen, setIsCalendarOpen]=useState(false);

  const calendarRef=useRef<HTMLDivElement>(null);

  const [sortBy, setSortBy]=useState(searchParams.get("sortBy") || "TournamentDate");

  const [sortOrder, setSortOrder]=useState(searchParams.get("sortOrder") || defaultSortOrder);

 useEffect(() => {
    setLoading(true);

    const startString=startDate ? startDate.toISOString() : "";
    const endString=endDate ? endDate.toISOString() : "";
    const monthToSend=searchMonth==="interval" ? "" : searchMonth;

    api.get(`/Tournament?page=${page}&pageSize=${pageSize}&tournamentName=${searchName}&tournamentLocation=${searchLocation}&tournamentFormat=${searchFormat}&status=${searchStatus}&tournamentMonth=${monthToSend}&startDate=${startString}&endDate=${endString}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      .then((response) => {
        const data = response.data; 

        if (data.items && Array.isArray(data.items)) {
          setTournaments(data.items);
          setTotalPages(data.totalPages);
          setTotalCount(data.totalCount);
        } else {
          setError("The API did not return a list!");
        }
      })
      .catch((error) => {
        console.error("Error while fetching tournaments: ", error);
        
        const errorMessage = error.response?.data?.detail || error.message;
        setError(errorMessage);
      })
      .finally(() => { 
        setLoading(false); 
      });
  }, [page, pageSize, searchName, searchLocation, searchFormat, searchStatus, searchMonth, startDate, endDate, sortBy, sortOrder]);

  useEffect(()=>{
    const params=new URLSearchParams();

    if(searchName)
        params.set("name", searchName);

    if(searchLocation)
        params.set("location", searchLocation);

    if(searchFormat)
        params.set("format", searchFormat);

    if(searchMonth)
        params.set("month", searchMonth);

    if(startDate)
        params.set("start", startDate.toISOString());

    if(endDate)
        params.set("end", endDate.toISOString());

    params.set("status", searchStatus);
    params.set("page", page.toString());
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    setSearchParams(params);
  }, [searchName, searchLocation, searchFormat, searchStatus, searchMonth, startDate, endDate, page, sortBy, sortOrder])

  useEffect(()=>{
    function handleClickOutside(event:MouseEvent){
        if(calendarRef.current && !calendarRef.current.contains(event.target as Node)){
            setIsCalendarOpen(false);
        }
    }

        document.addEventListener("mousedown", handleClickOutside);

        return ()=>{
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [])

  const handlePreviousPage=()=> {
    setPage((prev)=>Math.max(1, prev-1));
}

  const handleNextPage=()=>{
    setPage((cur)=>cur+1)
  }

  const groupedTournaments=tournaments.reduce((groups, tournament)=>{
    const date=new Date(tournament.tournamentDate);
    const monthYear=date.toLocaleString('en-US', {month: 'long', year: 'numeric'});

    if(!groups[monthYear])
        groups[monthYear]=[];

    groups[monthYear].push(tournament);
    return groups;
  }, {} as Record<string, Tournament[]>);

  const formatShortDate=(date:Date)=>{
    return date.toLocaleDateString('en-GB', {
        day:'numeric',
        month:'short',
        year:'numeric'
    });
  }
  

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto mt-4">

        <div className="mb-5 mt-5 w-full max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-55">
                    <input 
                    type="text"
                    placeholder="Name"
                    value={searchName}
                    onChange={(e)=>{
                        setSearchName(e.target.value);
                        setPage(1);
                    }}
                    className="w-full px-5 py-4 pr-12 bg-slate-800 text-white text-lg font-semibold rounded-full border border-slate-600 focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-400 shadow-sm"
                    /> 

                    {searchName && (
                        <button 
                        onClick={()=>{
                            setSearchName("");
                            setPage(1);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                        title="Clear search"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                    <div className="relative w-55">
                        <input 
                        type="text"
                        placeholder="Location"
                        value={searchLocation}
                        onChange={(e)=>{
                            setSearchLocation(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-5 py-4 pr-12 bg-slate-800 text-white text-lg font-semibold rounded-full border border-slate-600 focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-400 shadow-sm"
                        /> 

                        {searchLocation && (
                            <button 
                            onClick={()=>{
                                setSearchLocation("");
                                setPage(1);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                            title="Clear search"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                   <div className="relative w-70" ref={calendarRef}>
                        {searchMonth === "interval" && startDate && endDate ? (
                            <div 
                                onClick={() => setIsCalendarOpen(true)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-slate-800 text-white text-lg font-semibold rounded-full border border-slate-600 focus:outline-none focus:border-orange-500 hover:border-orange-500 transition-colors shadow-sm cursor-pointer"
                            >
                                <span className="truncate">
                                    {formatShortDate(startDate!)} - {formatShortDate(endDate!)}
                                </span>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        setSearchMonth("");  
                                        setStartDate(null);  
                                        setEndDate(null);
                                        setIsCalendarOpen(false);
                                        setPage(1);
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors p-1 shrink-0"
                                    title="Clear dates"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                                ) : (
                                    <>
                                        <select
                                            value={searchMonth}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSearchMonth(val);
                                                setPage(1);
                                                
                                                if (val === "interval") {
                                                    setIsCalendarOpen(true);
                                                } else {
                                                    setIsCalendarOpen(false);
                                                    setStartDate(null);
                                                    setEndDate(null);
                                                }
                                            }}
                                            className="w-full px-5 py-4 bg-slate-800 text-lg text-white font-semibold rounded-full border border-slate-600 focus:outline-none focus:border-orange-500 transition-colors shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Anytime</option>
                                            <option value="interval">Set interval...</option>
                                            <option value="1">January</option>
                                            <option value="2">February</option>
                                            <option value="3">March</option>
                                            <option value="4">April</option>
                                            <option value="5">May</option>
                                            <option value="6">June</option>
                                            <option value="7">July</option>
                                            <option value="8">August</option>
                                            <option value="9">September</option>
                                            <option value="10">October</option>
                                            <option value="11">November</option>
                                            <option value="12">December</option>
                                        </select>

                                        {searchMonth !== "" && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault(); 
                                                    e.stopPropagation();
                                                    setSearchMonth("");
                                                    setStartDate(null);
                                                    setEndDate(null);
                                                    setIsCalendarOpen(false);
                                                    setPage(1);
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 z-10"
                                                title="Clear selection"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}

                                        {searchMonth==="" && (
                                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </>
                                )}

                                {isCalendarOpen && searchMonth === "interval" && (
                                    <div className="absolute top-full left-0 mt-2 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4">
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(dates) => {
                                                const [start, end] = dates;
                                                setStartDate(start);
                                                setEndDate(end);
                                                
                                                if (start && end){
                                                     setIsCalendarOpen(false); 
                                                     setPage(1);
                                                }
                                            }}
                                            startDate={startDate}
                                            endDate={endDate}
                                            selectsRange
                                            inline
                                            showYearDropdown
                                        />
                                        
                                    </div>
                                )}
                            </div>

                    <div className="relative w-45">
                        <select
                        value={searchFormat}
                        onChange={(e)=>{
                            setSearchFormat(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-5 py-4 bg-slate-800 text-lg text-white font-semibold rounded-full border border-slate-600 focus:outline-none focus:border-orange-500 transition-colors shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">All formats</option>
                            <option value="1v1">1v1</option>
                            <option value="2v2">2v2</option>
                            <option value="3v3">3v3</option>
                            <option value="5v5">5v5</option>
                        </select>

                        {searchFormat !== "" && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    setSearchFormat("");
                                    setPage(1);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 z-10"
                                title="Clear selection"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {searchFormat==="" &&(
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>

                     <div className="relative w-45">
                        <select
                        value={searchStatus}
                        onChange={(e)=>{
                            const newStatus=e.target.value;
                            setSearchStatus(newStatus);

                            if(newStatus==="Upcoming" || newStatus==="Ongoing"){
                                setSortOrder("asc");
                            }
                            else{
                                setSortOrder("desc");
                            }
                            setPage(1);
                        }}
                        className="w-full px-5 py-4 bg-slate-800 text-lg text-white font-semibold rounded-full border border-slate-600 focus:outline-none focus:border-orange-500 transition-colors shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">All statuses</option>
                            <option value="Upcoming">Upcoming</option>
                            <option value="Completed">Completed</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>

                        {searchStatus !== "" && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    setSearchStatus("");
                                    setPage(1);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 z-10"
                                title="Clear selection"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {searchStatus==="" && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                        </div>
                        )}
                    </div>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 mt-10 gap-6">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          {totalCount} Available <span className="text-orange-500">{totalCount===1 ? "Tournament" : "Tournaments"}</span>
        </h1>

        <div className="flex items-center gap-3 shrink-0">
            <label className="text-slate-400 font-medium whitespace-nowrap">
                Sort by:
            </label>

            <div className="relative">
                <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e)=>{
                    const [newSortBy, newSortOrder]=e.target.value.split("-");

                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                    setPage(1);
                }}
                className="appearance-none w-full bg-slate-800 text-white font-semibold py-3 pl-5 pr-12 rounded-full border border-slate-700 hover:border-slate-500 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer">
                    <option value="TournamentDate-asc">Date: Oldest to Newest</option>
                    <option value="TournamentDate-desc">Date: Newest to Oldest</option>
                    <option value="Prize-desc">Prize: High to Low</option>
                    <option value="EntryFee-asc">Entry Fee: Low to High</option>
                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-xl text-slate-400 font-light animate-pulse">Loading the courts...</p>
        ) : (

            <>

            {Object.entries(groupedTournaments).map(([monthYear, monthTournaments])=>(
                <div key={monthYear} className="mb-14">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-1.5 h-10 bg-orange-500 rounded-full"></div>

                        <h2 className="text-3xl font-semibold text-white tracking-wide">
                            {monthYear}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {monthTournaments.map((tournament)=>(
                            <div key={tournament.tournamentId} 
                                className="p-5 border border-slate-700 rounded-2xl shadow-lg flex items-center gap-6 bg-slate-800 hover:border-orange-500 transition-colors duration-300 group"
                            >
                    <div className="shrink-0">
                        <img
                            src="https://images.unsplash.com/photo-1542652694-40abf526446e?q=80&w=500&auto=format&fit=crop"
                            alt={tournament.tournamentName}
                            className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>

                    <div className="flex flex-col flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                            {tournament.tournamentName}
                        </h2>

                        <h3 className="text-lg text-slate-300 font-medium">
                            {tournament.tournamentLocation}
                        </h3>

                        <h3 className="text-slate-400 mb-5">
                            {new Date(tournament.tournamentDate).toLocaleDateString('en-gb')}
                        </h3>

                        <Link 
                            to={`/tournament/${tournament.tournamentId}`}
                            className="self-start bg-orange-500 text-white font-bold py-2.5 px-6 rounded-full transform transition-all duration-300"
                        >
                            View Details
                        </Link>
                    </div>
                </div>
                        ))}
                    </div>
                </div>
            ))}

          <div className="mt-12 flex items-center justify-center gap-6">
            <button
            onClick={handlePreviousPage}
            disabled={page===1}
            className="px-6 py-2 bg-slate-800 text-white font-semibold rounded-full border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                &larr; Previous
            </button>

            <span className="text-slate-400 font-medium">
                Page <span className="text-white font-bold">{page}</span> of 
                <span className="text-white font-bold"> {totalPages}</span>
            </span>

            <button
            onClick={handleNextPage}
            disabled={page>=totalPages}
            className="px-6 py-2 bg-slate-800 text-white font-semibold rounded-full border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                &rarr; Next
            </button>

          </div>

          </>
        )}
      </div>
    </div>
  );
}

export default TournamentList;