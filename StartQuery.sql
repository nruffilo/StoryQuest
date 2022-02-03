
CREATE TABLE UserInfo (
  UserInfoId bigint generated by default as identity primary key,
  user_id uuid references auth.users not null,
  AvatarUrl varchar default null,
  DisplayName varchar default null,
  Description text default null
);

CREATE TABLE Story (
  StoryId bigint generated by default as identity primary key,
  StoryName varchar not null,
  StoryDescription text not null,
  StoryLanguage varchar not null,
  user_id uuid references auth.users not null,
  PublicFlag bool default false,
  CreatedDate timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE Scene (
  SceneId bigint generated by default as identity primary key,
  SceneTitle varchar not null,
  SceneDescription text not null,
  StoryId int references Story null,
  user_id uuid references auth.users not null,
  Views int default 0,
  Likes int default 0,
  RootDisplayFlag boolean default false,
  PublicFlag boolean default true,
  ReviewFlag boolean default false,
  RequiredItems varchar default null,  
  CreatedDate timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  LastModifiedDate timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE SceneItem (
  SceneItemId bigint generated by default as identity primary key,
  SceneItemName varchar not null,
  SceneItemDescription varchar not null,
  SceneId bigint references Scene not null,
  user_id uuid references auth.users not null,
  CreatedDate timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  LastModifiedDate timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE UserSceneItem (
  UserSceneItemId bigint generated by default as identity primary key,
  SceneItemId bigint references SceneItem,
  user_id uuid references auth.users not null,
  ItemAttributes varchar default null
);

CREATE TABLE SceneLink (
  SceneLinkId bigint generated by default as identity primary key,
  SceneId bigint references Scene not null,
  LinkedSceneId bigint not null, 
  user_id uuid references auth.users not null
);

CREATE INDEX LinkedScene ON SceneLink(LinkedSceneId);
--user scene items

CREATE OR REPLACE FUNCTION GetLinkedScenes(targetSceneId int)  
RETURNS TABLE(linkedSceneId bigint, sceneTitle varchar)
AS $Body$
begin
  return 
    QUERY 
        SELECT 
          sl.sceneid as linkedsceneid, s.scenetitle
        FROM 
          scenelink sl 
          LEFT JOIN scene s ON s.sceneid = sl.sceneid
        WHERE sl.linkedsceneid = targetSceneId
        UNION
        SELECT 
          sl.linkedsceneid, s.scenetitle
        FROM 
          SceneLink sl 
          LEFT JOIN Scene s ON s.sceneid = sl.linkedsceneid
        WHERE sl.sceneid = targetSceneId;      
end;
$Body$
LANGUAGE plpgsql VOLATILE;

GRANT EXECUTE ON FUNCTION GetLinkedScenes(targetSceneId int) TO PUBLIC; 


ALTER TABLE UserInfo ENABLE ROW LEVEL SECURITY;
ALTER TABLE Story ENABLE ROW LEVEL SECURITY;
ALTER TABLE Scene ENABLE ROW LEVEL SECURITY;
ALTER TABLE SceneItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserSceneItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE SceneLink ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Individuals can create Info" on UserInfo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can update info" on UserInfo FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can delete info" on UserInfo FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Individuals can create Story" on Story FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can update Story" on Story FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can delete Story" on Story FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Individuals can create Scene" on Scene FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can update Scene" on Scene FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can delete Scene" on Scene FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Individuals can create SceneItem" on SceneItem FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can update SceneItem" on SceneItem FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can delete SceneItem" on SceneItem FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Individuals can create UserSceneItem" on UserSceneItem FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can update UserSceneItem" on UserSceneItem FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can delete UserSceneItem" on UserSceneItem FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Individuals can create SceneLink" on SceneLink FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can update SceneLink" on SceneLink FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Individuals can delete SceneLink" on SceneLink FOR DELETE USING (auth.uid() = user_id);

grant usage on schema auth to anon;
grant usage on schema auth to authenticated;

