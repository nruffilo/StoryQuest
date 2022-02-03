import { useEffect, useState } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";
import SceneLink from "./SceneLink";
import NewScene from "./NewScene";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home = ({ user, setLoginScreen }) => {
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
            setTimeout(() => { loadScene(paramsParsed['scene']).catch(console.error) }, 10);
        } else {
            setTimeout(() => { loadScene(null).catch(console.error) }, 10);
        }
    }, []);// eslint-disable-line react-hooks/exhaustive-deps


    const createNewLinkedScene = async () => {
        console.log("create!");
        let { data: newScene, error } = await supabase
            .from("scene")
            .insert([{ scenetitle: "Scene Title", scenedescription: "Scene Description", user_id: user.id }]);
        if (error) {
            console.log("error", error);
            setError(error);
        } else {
            //create a link to this scene, then load the scene
            let { data: linkedSceneData, linkError } = await supabase
                .from("scenelink")
                .insert([{ sceneid: scene.sceneid, linkedsceneid: newScene[0].sceneid, user_id: user.id }]);
            if (linkError) {
                console.log("error", linkError);
                setError(linkError);
            } else {
                console.log(linkedSceneData);
                document.location.href = "/?scene=" + linkedSceneData[0].linkedsceneid;
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
            .update({ scenetitle: sceneTitle, scenedescription: convertedText })
            .match({ sceneid: scene.sceneid });

        if (error) {
            console.log("error", error);
            setError(error);
        } else {
            console.log(updatedSceneData);
            toast("Scene Saved");
        }
    }

    const loadScene = async (sceneId) => {
        if (!sceneId) {
            sceneId = 1;
        }
        let { data: sceneInfo, error } = await supabase
            .from("scene").select('sceneid, scenetitle, scenedescription, user_id, lastmodifieddate, publicrootflag').eq("sceneid", sceneId);
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
    };

    const loadLinkedScenes = async (sceneId) => {
        let { data: linkedScenes, error } = await supabase
            .rpc('getlinkedscenes', { targetsceneid: sceneId });
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
                return <div className={"w-screen min-h-screen bg-gray-50"}>
                    <header className={"justify-between items-center px-4 h-16 bg-gray-900"}>
                        <span className={"text-2xl sm:text-4xl invisible md:visible text-white border-b font-sans"}>
                            Story Quest
                        </span>
                        <div className={"UserInfo"}>
                        {user === null ?
                            <>
                                <span className={"text-white "} onClick={() => setLoginScreen(true)}>Login/Create</span>
                            </>
                            :
                            <>
                                <button
                                    onClick={handleLogout}
                                    className={
                                        "flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
                                    }
                                >
                                    Logout
                                </button>
                            </>
                        }
                        </div>
                    </header>
                    <div className={"SceneDisplay"}>
                        <div className="SceneTitle">
                        {user !== null && scene.user_id === user.id ?
                            <input type="text" value={sceneTitle} onChange={e => setSceneTitle(e.target.value)}></input>
                            :
                            <h2>
                                {scene.scenetitle}
                            </h2>
                        }
                        </div>
                        <div className={"SceneDescription"}>
                            {user !== null && scene.user_id === user.id ?
                                <>
                                    <ReactQuill
                                        theme='snow'
                                        value={convertedText}
                                        onChange={setConvertedText}
                                        style={{ minHeight: '120px' }}
                                    />
                                    <button
                                        className={"justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out SaveSceneButton"}
                                        onClick={saveUpdatedSceneText}>Save</button>
                                </>
                                : <div dangerouslySetInnerHTML={{ __html: scene.scenedescription }} />
                            }
                        </div>
                        <div
                            className={`p-2 border grid gap-2 LinkedScenesList`}>
                            {linkedScenes.length ? (
                                <>
                                    <h3>Linked Scenes</h3>
                                    {linkedScenes.map((link) => (
                                        <SceneLink
                                            key={link.linkedsceneid}
                                            sceneId={link.linkedsceneid}
                                            sceneLink={link}
                                            onNavigate={() => document.location.href = '/?scene=' + link.linkedsceneid}
                                        />
                                    ))}
                                </>
                            ) : (
                                <span className={"h-full flex justify-center items-center"}>
                                    There are no linked scenes.
                                </span>
                            )}
                            {
                        (user !== null && (user.id === scene.user_id || scene.publicrootflag === true)) ?
                            <div className={""}>
                                <button
                                    onClick={createNewLinkedScene}
                                    className={
                                        "py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out giveMeSomeSpace"
                                    }
                                >
                                    Create Linked Scene
                                </button>
                            </div>
                            : <></>
                    }
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
                    

                </div>
            case 'CreateScene':
                return <NewScene returnHome={returnHome} setScene={setScene} user={user} />
            default:
                return null;
        }
    }
};

export default Home;
