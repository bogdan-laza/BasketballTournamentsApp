import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import api from "./utils/api";

const ChangePhoto = () => {
    const navigate = useNavigate();
    const location=useLocation();
    const [isUploading, setIsUploading] = useState(false);

    const user=location.state?.user;

    useEffect(()=>{
        if(!user)
            navigate("/myprofile");
    }, [user, navigate])

    const getInitials = (first: string, last: string) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
    };

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "hoopzone_profile"); 
            
            const cloudinaryResponse = await axios.post(
                `https://api.cloudinary.com/v1_1/mnlcb2sr/image/upload`, 
                formData
            );

            const newImageUrl = cloudinaryResponse.data.secure_url;
            console.log("Uploaded successfully to:", newImageUrl);

           await api.put(`/user/${user.userId}/profile-photo`, JSON.stringify(newImageUrl), {
                headers: {
                    "Content-Type": "application/json",
                }
            });

            console.log("Saved to database!");
            navigate("/myprofile", { state: { newImageUrl: newImageUrl } });
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally{
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start pt-15 p-8">
            <div className="flex flex-col items-center w-full max-w-sm">
                
                <h1 className="text-3xl font-extrabold text-white mb-25 tracking-tight">
                    Profile Photo
                </h1>

                <div className="h-40 w-40 rounded-full shadow-xl ring-4 ring-slate-800 mb-25">
                    {user?.profileImageUrl ? (
                        <img 
                            src={user.profileImageUrl} 
                            alt="Profile" 
                            className="h-full w-full object-cover rounded-full"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full bg-slate-700 rounded-full">
                            <span className="text-5xl text-white font-bold tracking-wide">
                                {getInitials(user?.firstName, user?.lastName)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 w-full">
                    
                   <label className={`flex items-center justify-center gap-3 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg ${
                        isUploading 
                            ? "bg-orange-400 cursor-not-allowed opacity-70 pointer-events-none" 
                            : "bg-orange-500 hover:bg-orange-600 cursor-pointer hover:shadow-orange-500/20 active:scale-95"
                    }`}>
                        {isUploading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                        
                        {isUploading ? "Uploading..." : "Upload photo"}
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange}
                            disabled={isUploading} 
                        />
                    </label>

                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-6 rounded-xl border border-slate-600 transition-all duration-200 active:scale-95"
                    >
                        Back
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

export default ChangePhoto;