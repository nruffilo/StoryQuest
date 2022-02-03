const SceneLink = ({ sceneId, sceneLink, onNavigate}) => {
    
    return (
        <div className={""} key={sceneLink.linkedsceneid}>
            <button className={"SceneLink"}
                onClick={onNavigate}>
                {sceneLink.scenetitle}
            </button>
        </div>    

    )

}

export default SceneLink;