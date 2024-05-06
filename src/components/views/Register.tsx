import React, { useState } from "react";
import { api, handleError } from "helpers/api";
import User from "models/User";
import {Link, useNavigate} from "react-router-dom";
import { Button } from "components/ui/Button";
import "styles/views/Register.scss";
import BaseContainer from "components/ui/BaseContainer";
import PropTypes from "prop-types";
import { MAX_USERNAME_LENGTH } from "../../constants/constants";
import { showToast} from "../../helpers/toastService";
/*
It is possible to add multiple components inside a single file,
however be sure not to clutter your files with an endless amount!
As a rule of thumb, use one file per component and only add small,
specific components that belong to the main one in the same file.
 */
const CHAR_NOT_FOUND = -1;
const FormField = (props) => {
  return (
    <div className="login field">
      <label className="login label">{props.label}</label>
      <input
        className="login input"
        placeholder="enter here.."
        value={props.value}
        type={props.type}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.string
};

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>(null);
  const [password, setPassword] = useState<string>(null);

  const doRegister = async () => {
    try {
      const requestBody = JSON.stringify({ username, password });
      const response = await api.post("/users", requestBody);

      // Get the returned user and update a new object.
      const user = new User(response.data);

      sessionStorage.setItem("token", user.token);
      sessionStorage.setItem("id", user.id);
      sessionStorage.setItem("username", user.username);
      // Register successfully worked --> navigate to the route /game in the LobbyRouter
      showToast('Register successful!', 'success');
      navigate("/lobby");
    } catch (error) {
      let message = 'An unexpected error occurred during Register.';
      if (error.response) {
        switch (error.response.status) {
          case 409:
            message = 'Register failed: Username has been taken, please change a username.';
            break;
          default:
            message = `Register failed: ${error.response.data.reason || 'Please try again later.'}`;
        }
      }
      showToast(message, 'error');
    }
  };

  return (
    <BaseContainer>
      <div className="register container">
        <div className="login kaeps-title">Kaeps</div>
        <div className="register form">
          <FormField
            label="Username"
            value={username}
            type="text"
            onChange={(un: string) => {
              if (un.length <= MAX_USERNAME_LENGTH) setUsername(un);
            }}
          />
          <FormField
            label="Password"
            value={password}
            type="password"
            onChange={(n: any) => {
              if (n.length <= MAX_USERNAME_LENGTH) setPassword(n)
            }}
          />
          <div className="register button-container">
            <Button
              disabled={!username || !password ||password.indexOf(" ") !== CHAR_NOT_FOUND || username.indexOf(" ") !== CHAR_NOT_FOUND }
              width="75%"
              onClick={() => doRegister()}
              style={{ color: "black"}}
            >
              register
            </Button>
          </div>

          <div className="register button-container">
              Already have an account?
            <Link to={"/login"}>Login</Link>
          </div>

        </div>
      </div>
    </BaseContainer>
  );
};

/**
 * You can get access to the history object's properties via the useLocation, useNavigate, useParams, ... hooks.
 */
export default Register;
