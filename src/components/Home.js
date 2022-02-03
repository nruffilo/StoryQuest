import { useEffect, useState } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";
import SceneLink from "./SceneLink";
import NewScene from "./NewScene";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home = ({ user }) => {
    const [recoveryToken, setRecoveryToken] = useState(null);
    const [linkedScenes, setLinkedScenes] = useState([]);
    const [scene, setScene] = useState([]);
    const [sceneTitle, setSceneTitle] = useState([]);
    const [errorText, setError] = useState("");
    const [currentAction, setCurrentAction] = useState("home");
    const [convertedText, setConvertedText] = useState("");
  
    
    useEffect(() => {
        /* Recovery url is of the form
         * <SITE_URL>#access_token=x&refresh_token=y&expires_in=z&token_type=bearer&type=recovery
         * Read more on https://supabase.io/docs/client/reset-password-email#notes
         */
        let url = window.location.hash;
        let query = url.substr(1);
        let result = {};

        let paramString = window.location.search;
        let params = paramString.substr(1);
        let paramsParsed = {};
        
        query.split("&").forEach((part) => {
            const item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });

        params.split("&").forEach((part) => {
            const item = part.split("=");
            paramsParsed[item[0]] = decodeURIComponent(item[1]);
        });


        if (result.type === "recovery") {
            setRecoveryToken(result.access_token);
        }
        if (paramsParsed['scene'] !== undefined) {
            loadScene(paramsParsed  ['scene']).catch(console.error);
        } else {
            loadScene(null).catch(console.error);
        }
    }, []);

    const createNewLinkedScene = async () => {
        console.log("create!");
        let { data: newScene, error } = await supabase
        .from("scene")
        .insert([{scenetitle: "Scene Title",scenedescription:"Scene Description", user_id: user.id}]);
        if (error) {
            console.log("error",error);
            setError(error);
        } else {
            //create a link to this scene, then load the scene
            let { data:linkedSceneData, linkError } = await supabase
            .from("scenelink")
            .insert([ { sceneid: scene.sceneid, linkedsceneid: newScene[0].sceneid, user_id: user.id }]);
            if (linkError) {
                console.log("error",linkError);
                setError(linkError);
            } else {
                console.log(linkedSceneData);
                document.location.href = "/?scene="+linkedSceneData[0].linkedsceneid;
                //loadScene(linkedSceneData.sceneid);
            }
        }
    }

    const returnHome = () => {
        setCurrentAction("home");
    }

    const saveUpdatedSceneText = async () => {
        let { data: updatedSceneData, error } = await supabase
        .from("scene")
        .update({ scenetitle: sceneTitle, scenedescription: convertedText})
        .match({ sceneid: scene.sceneid});

        if (error) {
            console.log("error",error);
            setError(error);
        } else {
            toast("Scene Saved");
        }
    }

    const loadScene = async (sceneId) => {
        if (!sceneId) {
            sceneId = 1;
        }
        let { data: sceneInfo, error } = await supabase
        .from("scene").select('sceneid, scenetitle, scenedescription, user_id, lastmodifieddate').eq("sceneid",sceneId);
        if (error) {
            console.log("error", error);
            setError(error);
        }
        else {
            setScene(sceneInfo[0]);
            setConvertedText(sceneInfo[0].scenedescription);
            setSceneTitle(sceneInfo[0].scenetitle);
            loadLinkedScenes(sceneInfo[0].sceneid);
        }
    }

    const loadLinkedScenes = async (sceneId) => {
        let { data: linkedScenes, error } = await supabase
        .rpc('getlinkedscenes',{targetsceneid: sceneId});
        if (error) {
            console.log("error", error);
            setError(error);
        }
        else setLinkedScenes(linkedScenes);
    }

    const handleLogout = async () => {
        supabase.auth.signOut().catch(console.error);
    };

    if (recoveryToken) {
        return <RecoverPassword
        token={recoveryToken}
        setRecoveryToken={setRecoveryToken}
        />
    } else {
        switch (currentAction) {
            case 'home':
            return <div className={"w-screen fixed flex flex-col min-h-screen bg-gray-50"}>
                <header
                    className={
                        "flex justify-between items-center px-4 h-16 bg-gray-900"
                    }
                >
                    <span
                        className={
                            "text-2xl sm:text-4xl invisible md:visible text-white border-b font-sans"
                        }
                    >
                        Story Quest
                    </span>
                    <button
                        onClick={handleLogout}
                        className={
                            "flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                        }
                    >
                        Logout
                    </button>
                </header>
                <div
                    className={"flex flex-col flex-grow p-4 listContainer"}                    
                >
                        {scene.user_id === user.id ?
                        <input type="text" value={sceneTitle} onChange={e => setSceneTitle(e.target.value)}></input>
                        :
                        <h2>
                            {scene.scenetitle}
                        </h2>
                        } 
                    <div
                        className={`p-2 border grid gap-2 ${
                            scene.scenedescription ? "auto-rows-min" : ""
                        } grid-cols-1 h-2/3 overflow-y-scroll first:mt-8`}
                    >
                        {scene.user_id === user.id ?
                        <>
                        <ReactQuill
                            theme='snow'
                            value={convertedText}
                            onChange={setConvertedText}
                            style={{minHeight: '300px'}}
                        />
                        <br/><br/>
                        <button 
                            className={"justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                            } 
                        
                            onClick={saveUpdatedSceneText}>Save</button>
                        </>
                      :scene.scenedescription}
                    </div>
                    <div
                        className={`p-2 border grid gap-2`}>
                        {linkedScenes.length ? (
                            linkedScenes.map((link) => (
                                <SceneLink 
                                    sceneId={link.linkedsceneid}
                                    sceneLink={link}
                                    onNavigate={() => document.location.href='/?scene='+link.linkedsceneid}
                                />
                            ))
                        ) : (
                            <span
                                className={
                                    "h-full flex justify-center items-center"
                                }
                            >
                                There are no linked scenes.
                            </span>
                        )}
                    </div>
                    {!!errorText && (
                        <div
                            className={
                                "border max-w-sm self-center px-4 py-2 mt-4 text-center text-sm bg-red-100 border-red-300 text-red-400"
                            }
                        >
                            {errorText}
                        </div>
                    )}
                </div>
                <div className={"flex m-4 mt-0 h-10"}>
                    <button
                        onClick={createNewLinkedScene}
                        className={
                            "flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out giveMeSomeSpace"
                        }
                    >
                        Create Linked Scene
                    </button>
                </div>

            </div>
            case 'CreateScene':
                return <NewScene returnHome={returnHome} setScene={setScene} user={user}/>
            default: 
                return null;
        }
    }
};

export default Home;
