import { Link, Navigate } from "react-router-dom";

function WelcomePage(){
    const isLoggedIn=!!localStorage.getItem("token");

    if(isLoggedIn){
        return <Navigate to="/tournaments" replace />;
    }
    return (
        <div className="relative h-screen w-full bg-cover bg-center"
        style={{backgroundImage:"url('https://sportarena.ro/wp/wp-content/uploads/2021/05/WhatsApp-Image-2021-05-04-at-11.59.30-AM-1.jpeg')"}}
        >
            <div className="absolute inset-0 bg-black/60"></div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                <h1 className="text-7xl md:text-9xl font-extrabold text-white tracking-tighter mb-4 drop-shadow-lg">
                    Hoop<span className="text-orange-500">Zone</span>
                </h1>

                <p className="text-2xl md:text-3xl text-gray-200 font-light mb-12 max-w-2xl drop-shadow-md">
                    Play competitive at any level!
                </p>

                
            </div>
        </div>
    );
}

export default WelcomePage;