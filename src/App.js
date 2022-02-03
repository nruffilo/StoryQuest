import { useState, useEffect } from "react";
import { supabase } from "./lib/api";
import Auth from "./components/Auth";
import Home from "./components/Home";

function App() {
    const [user, setUser] = useState(null);
    const [loginScreen, setLoginScreen] = useState(false);

    useEffect(() => {
        const session = supabase.auth.session();
        setUser(session?.user ?? null);

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user;
                setUser(currentUser ?? null);
            }
        );

        return () => {
            authListener?.unsubscribe();
        };
    }, [user]);

    return (
        <div className="min-w-full min-h-screen flex items-center justify-center bg-gray-200">
            {loginScreen ? <Auth setLoginScreen={setLoginScreen} /> : <Home user={user} setLoginScreen={setLoginScreen} /> }
        </div>
    );
}

export default App;
