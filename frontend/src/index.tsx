import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {Container} from '@material-ui/core';
import { Auth0Provider } from "@auth0/auth0-react";

const domain:string = process.env.REACT_APP_AUTH0_DOMAIN as string;
const clientId:string = process.env.REACT_APP_AUTH0_CLIENT_ID as string;

ReactDOM.render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    redirectUri={window.location.origin}
  >
    <Container className="app-container">
      <App />
    </Container>
  </Auth0Provider>,
  document.getElementById('root')
);
