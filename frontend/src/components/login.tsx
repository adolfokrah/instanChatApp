import {Card, CardContent, Avatar, Typography, Button} from '@material-ui/core';
import { useAuth0 } from "@auth0/auth0-react";
import './Login.css';
const Login=()=>{
    const { loginWithRedirect } = useAuth0();
    return (
            <Card elevation={0} className="card">
                <CardContent className="card-content">
                    <Avatar aria-label="recipe" className="appLogo">IS</Avatar>
                     <Typography variant="h4" className="heading">InstaChat</Typography>
                     <Typography className="text">Welcome to Instachat.<br/> Please login or Sign up below</Typography>
                </CardContent>

                <Button variant="contained" className="loginBtn" disableElevation onClick={loginWithRedirect}>
                      LOGIN | SIGNUP
                 </Button>
            </Card>
    )
}

export default Login;