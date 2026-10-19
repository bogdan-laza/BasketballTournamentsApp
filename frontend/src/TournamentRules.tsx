import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface Tournament{
  tournamentId:number;
  tournamentName:string;
  tournamentDate:string;
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

function TournamentRules(){
    const {tournamentId}=useParams();
    const [tournament, setTournament]=useState<Tournament | null>(null);

    useEffect(()=>{
        fetch(`http://localhost:5265/api/Tournament/${tournamentId}`)
        .then((res)=>res.json())
        .then((data)=>setTournament(data));
    }, [tournamentId])

    return (
        <div className="p-8 bg-slate-900 min-h-screen"> 
            <h1 className="text-4xl font-bold text-white text-center mb-8"> {tournament?.tournamentName} Rules </h1>
            <div className="text-xl text-white"> {tournament?.rules}</div>
        </div>
    );
}

export default TournamentRules;