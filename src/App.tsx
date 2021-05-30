import Login from './components/login';
import Chat from './components/chat';
import {CircularProgress} from '@material-ui/core';
import { useAuth0 } from "@auth0/auth0-react";


const  App=()=>{
  const { isAuthenticated, isLoading } = useAuth0();
  if(isLoading){
    return (
      <div className="app">
        <CircularProgress />
      </div>
    )
  }
  return (
    <div className="App">
        {isAuthenticated ? <Chat /> : <Login/>}
    </div>
  );
}

export default App;
