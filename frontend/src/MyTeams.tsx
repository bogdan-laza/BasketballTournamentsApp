import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./utils/api";
import { useAuth } from "./AuthContext";

interface Team {
    teamId: number;
    teamName: string;
    createdByUserId: number;
    creatorName: string;
    createdAt: string;
    logoUrl?: string | null;
}

function MyTeams() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(6); 

    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
    const handleNextPage = () => setPage((prev) => prev + 1);

    const { token } = useAuth();

    const getCreatorInitials = (name: string) => {
    if (!name) return "??";
    const words = name.trim().split(" ");
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

    useEffect(() => {
        if (!token) return;

        try {
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            const userId = decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
                        || decodedPayload.nameid 
                        || decodedPayload.sub;

            api.get(`/Team/my-teams/${userId}?page=${page}&pageSize=${pageSize}`)
            .then((response) => {
                const data = response.data;
                if (data.items && Array.isArray(data.items)) {
                    setTeams(data.items);
                    setTotalCount(data.totalCount);
                    setTotalPages(data.totalPages);
                } else {
                    setError("Failed to load teams.");
                }
            })
                .catch((error) => {
                    console.error("Error fetching teams: ", error);
                    setError("Could not connect to the server.");
                })
                .finally(() => {
                    setLoading(false);
                });

        } catch (error) {
            console.error("Failed to decode token", error);
            setLoading(false);
        }
    }, [token, page]);

    const formatShortDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

   return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-6xl mx-auto mt-3">
                <div className="flex justify-center mb-8 mt-2">
                    <Link 
                        to="/create-team" 
                        className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded-full transition-all duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Create another team
                    </Link>
                </div>

                <div className="mb-10">
                    <h1 className="text-5xl font-extrabold text-white tracking-tight">
                        My <span className="text-orange-500">Teams</span>
                    </h1>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="text-xl text-slate-400 font-light animate-pulse">Loading your teams...</p>
                ) : (
                    <>
                        {teams.length === 0 ? (
                            <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                                <p className="text-2xl text-slate-400 font-medium mb-4">You haven't created any teams yet.</p>
                                <p className="text-slate-500">Click the button above to create your first team.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {teams.map((team) => (
                                    <div key={team.teamId} className="p-6 border border-slate-700 rounded-2xl shadow-lg flex items-center gap-6 bg-slate-800 hover:border-orange-500 transition-colors duration-300 group cursor-pointer">
                                        
                                        <div className="shrink-0">
                                            {team.logoUrl ? (
                                                <img
                                                    src={team.logoUrl}
                                                    alt={team.teamName}
                                                    className="w-24 h-24 object-cover rounded-full shadow-md border-2 border-slate-600"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 flex items-center justify-center bg-slate-800 rounded-full shadow-inner border-2 border-slate-600 group-hover:border-orange-500 transition-colors duration-300">
                                                    <span className="text-3xl font-extrabold text-slate-400 group-hover:text-orange-500 transition-colors duration-300 tracking-wider">
                                                        {getCreatorInitials(team.creatorName)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Team Info */}
                                        <div className="flex flex-col flex-1">
                                            <h2 className="text-2xl font-bold text-white mb-1">
                                                {team.teamName}
                                            </h2>
                                            
                                            <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Created {formatShortDate(team.createdAt)}
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-6">
                        <button
                            onClick={handlePreviousPage}
                            disabled={page === 1}
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
                            disabled={page >= totalPages}
                            className="px-6 py-2 bg-slate-800 text-white font-semibold rounded-full border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyTeams;