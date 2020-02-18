--This script needs to be run from this folder
\echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
\prompt 'You are about to drop and create databases!! Please be sure you are not connected to TS PROD!! Hit <enter> to continue...' junk
\c postgres
drop database if exists node_media_server;
create database node_media_server;

\c node_media_server

CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  user_name TEXT,
  user_password TEXT,
  email TEXT,
  profile_data TEXT,
  movie_data TEXT,
  dynamic_url TEXT
);

\c node_media_server

INSERT INTO users (id,user_name,user_password,email,profile_data,movie_data,dynamic_url) Values ('1','dlarrivee1','$2b$10$pPBOUy.gnhYGmb4XYP8lw.WdjPlvz1n5.8OAJiOjx/tKISrWZlw6i','dlarrivee@shawscott.com', '"{\"name\":\"Dylan 4\",\"age\":34,\"serverIP\":\"10.0.0.211:3000\",\"mediaFolders\":[{\"folderName\":\"Labs_Tranfer_Recordings\",\"filePath\":\"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings\"},{\"folderName\":\"Learning_Videos\",\"filePath\":\"/Users/Dylan/Documents/My_Things/Learning_Videos\"},{\"folderName\":\"Learning_Videos2\",\"filePath\":\"/Users/Dylan/Documents/My_Things/Learning_Videos\"},{\"folderName\":\"My_Things\",\"filePath\":\"/Users/Dylan/Documents/My_Things\"},{\"folderName\":\"Desktop\",\"filePath\":\"/Users/Dylan/Desktop\"}],\"location\":{\"city\":\"Seattle\",\"state\":\"Washington\"}}"','[{"id":0,"name":"Node.js Tutorial for Beginners - Learn Node in 1 Hour _ Mosh-TlB_eWDSMt4.mp4","filePath":"/Users/Dylan/Documents/My_Things/Learning_Videos/Node.js Tutorial for Beginners - Learn Node in 1 Hour _ Mosh-TlB_eWDSMt4.mp4"},{"id":1,"name":"test.mp4","filePath":"/Users/Dylan/Documents/My_Things/Learning_Videos/test.mp4"},{"id":2,"name":"Node.js Tutorial for Beginners - Learn Node in 1 Hour _ Mosh-TlB_eWDSMt4.mp4","filePath":"/Users/Dylan/Documents/My_Things/Learning_Videos/Node.js Tutorial for Beginners - Learn Node in 1 Hour _ Mosh-TlB_eWDSMt4.mp4"},{"id":3,"name":"test.mp4","filePath":"/Users/Dylan/Documents/My_Things/Learning_Videos/test.mp4"},{"id":4,"name":"Forms Builder Database Setup Call.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Forms Builder Database Setup Call.mp4"},{"id":5,"name":"Labs - TS Transfer - Meeting 1.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Labs - TS Transfer - Meeting 1.mp4"},{"id":6,"name":"Labs - TS Transfer - Meeting 2.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Labs - TS Transfer - Meeting 2.mp4"},{"id":7,"name":"Labs - TS Transfer - Meeting 3.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Labs - TS Transfer - Meeting 3.mp4"},{"id":8,"name":"Labs - TS Transfer - Meeting 4.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Labs - TS Transfer - Meeting 4.mp4"},{"id":9,"name":"Labs - TS Transfer - Meeting 5.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Labs - TS Transfer - Meeting 5.mp4"},{"id":10,"name":"Labs - TS Transfer - Meeting 6.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Labs - TS Transfer - Meeting 6.mp4"},{"id":11,"name":"Labs - TS Transfer - Meeting 7.mp4","filePath":"/Users/Dylan/Documents/ShawScott/TechServiceTeam/labsTransfer/videoRecordings/Labs - TS Transfer - Meeting 7.mp4"},{"id":12,"name":"A Claymation Christmas Celebration-A Claymation Christmas Celebration.mp4","filePath":"/Users/Dylan/Documents/My_Things/A Claymation Christmas Celebration-A Claymation Christmas Celebration.mp4"},{"id":13,"name":"A Claymation Christmas Celebration-A Claymation Christmas Celebration.mp4","filePath":"/Users/Dylan/Desktop/A Claymation Christmas Celebration-A Claymation Christmas Celebration.mp4"}]','https://f5ea8d67.ngrok.io');