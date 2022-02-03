const SceneLink = ({ sceneId, sceneLink, onNavigate}) => {
    
    return (
        <div className={""}>
                {sceneLink.SceneLinkTitle}
            <button className={""}
                onClick={onNavigate}>
                {sceneLink.scenetitle}
            </button>
        </div>    

    )

}

export default SceneLink;