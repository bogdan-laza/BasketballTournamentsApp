import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./utils/api";


interface Tournament{
  tournamentId:number;
  tournamentName:string;
  tournamentDate:string;
  daysDuration:number;
  tournamentLocation:string;
  entryFee:number;
  prize:number;
  tournamentFormat:string;
  createdByUserId:number;
  maximumNumberOfTeams:number;
  status:string;
  registrationDeadline:string;
  rules:string;
  tournamentImageUrl:string;
}

function TournamentDetails(){
    const { tournamentId }=useParams();
    const [tournament, setTournament] = useState<Tournament | null>(null);

    const navigate=useNavigate();

    useEffect(() => {
        api.get(`/Tournament/${tournamentId}`)
        .then((res)=>setTournament(res.data))
       .catch((err) => console.error("Error fetching tournament:", err));
    }, [tournamentId])

    if(!tournament)
        return <div>Loadind details...</div>;

    const getColorByStatus = (status:string) =>{
        switch(status){
            case 'Upcoming':
                return 'bg-green-800 text-white';
            case 'Ongoing':
                return 'bg-green-500 text-white';
            case 'Completed':
                return 'bg-yellow-400 text-black';
            case 'Cancelled':
                return 'bg-red-600 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getEndDate=(startDateString: string, duration:number)=>{
        const date=new Date(startDateString);
        date.setDate(date.getDate()+duration);
        return date.toLocaleDateString('en-gb');
    }

    const handleRegisterClick=()=>{
        const isLoggedIn=localStorage.getItem("token")!==null;

        if(!isLoggedIn){
            navigate("/signup", {
                state:{alertMessage:"You need to sign up before joining a tournament!"}
            });
        }
        else{
            navigate(`/tournament/${tournamentId}/register`);
        }
    };

   return (
  <div className="p-8 bg-slate-900 min-h-screen">

    <div className="max-w-6xl mx-auto border-slate-700 shadow-lg p-8 rounded-2xl flex gap-12 items-center bg-slate-800">
      
      <div className="shrink-0">
        <img
          src="https://images.unsplash.com/photo-1542652694-40abf526446e?q=80&w=500&auto=format&fit=crop"
          alt={tournament.tournamentName}
          className="w-80 h-80 object-cover rounded-xl shadow-sm"
        />
      </div>

      <div className="flex flex-col flex-1">
        
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white">{tournament.tournamentName}</h1>
          <span className={`px-4 py-2 rounded-full text-sm mt-4 font-bold uppercase tracking-wider inline-block ${getColorByStatus(tournament.status)}`}>
            {tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-lg text-white">
          <p><strong>Location:</strong> {tournament.tournamentLocation}</p>
          <p><strong>Start date:</strong> {new Date(tournament.tournamentDate).toLocaleDateString('en-gb')}</p>
          <p><strong>Format:</strong> {tournament.tournamentFormat}</p>
          <p><strong>End date:</strong> {getEndDate(tournament.tournamentDate, tournament.daysDuration)}</p>
          <p><strong>Entry fee:</strong> {tournament.entryFee}</p>
          <p><strong>Starting time:</strong> {new Date(tournament.tournamentDate).getHours()}:{new Date(tournament.tournamentDate).getMinutes().toString().padStart(2, '0')}</p>
          <p><strong>Winner prize:</strong> {tournament.prize}</p>
          <p><strong>Max teams:</strong> {tournament.maximumNumberOfTeams}</p>
          <p><strong>Registration deadline:</strong> {new Date(tournament.registrationDeadline).toLocaleDateString('en-gb')}, {new Date(tournament.registrationDeadline).getHours()}:{new Date(tournament.registrationDeadline).getMinutes().toString().padStart(2, '0')}</p>
          
          <div className="col-span-2 flex gap-8 mt-4 pt-4 border-t border-gray-100">
            <p><strong>Teams participating:</strong> 
              <Link to={`/tournament/${tournamentId}/teams`} className="text-orange-400 hover:text-blue-800 hover:underline ml-2">See the teams</Link>
            </p>
            <p><strong>Rules:</strong> 
              <Link to={`/tournament/${tournamentId}/rules`} className="text-orange-400 hover:text-blue-800 hover:underline ml-2">See the rules</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
    <div className="mt-8 flex justify-center w-full">
    <button
        onClick={handleRegisterClick}
        className="inline-flex justify-center items-center px-10 py-3  bg-orange-500 hover:bg-orange-600 transition-colors duration-300 text-white text-2xl font-bold rounded-full transform">
            Register
    </button>
    </div>
  </div>
);
}

export default TournamentDetails;